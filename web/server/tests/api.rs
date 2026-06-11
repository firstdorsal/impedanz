//! Integration tests: login flow, role enforcement and the event
//! publishing API, all against a real (temporary) SQLite database.

use axum::body::{to_bytes, Body};
use axum::http::{header, Request, StatusCode};
use axum::Router;
use impedanz_server::config::{Secret, ServerConfig};
use serde_json::{json, Value};
use tower::ServiceExt;

const ADMIN_PASSWORD: &str = "admin-test-password";
const MEMBER_PASSWORD: &str = "member-test-password";

async fn test_app() -> (Router, tempfile::TempDir) {
    let dir = tempfile::tempdir().expect("create tempdir");
    let config = ServerConfig {
        database_path: dir.path().join("test.db"),
        media_dir: dir.path().join("media"),
        cookie_secure: false,
        initial_admin_username: Some(String::from("admin")),
        initial_admin_password: Some(Secret(String::from(ADMIN_PASSWORD))),
        ..ServerConfig::default()
    };
    let state = impedanz_server::init_state(config)
        .await
        .expect("init state");
    (impedanz_server::api_app(state), dir)
}

async fn body_json(response: axum::response::Response) -> Value {
    let bytes = to_bytes(response.into_body(), usize::MAX)
        .await
        .expect("read body");
    serde_json::from_slice(&bytes).expect("body is json")
}

fn json_request(method: &str, uri: &str, cookie: Option<&str>, body: Value) -> Request<Body> {
    let mut builder = Request::builder()
        .method(method)
        .uri(uri)
        .header(header::CONTENT_TYPE, "application/json");
    if let Some(cookie) = cookie {
        builder = builder.header(header::COOKIE, cookie);
    }
    builder
        .body(Body::from(body.to_string()))
        .expect("valid request")
}

fn get_request(uri: &str, cookie: Option<&str>) -> Request<Body> {
    let mut builder = Request::builder().method("GET").uri(uri);
    if let Some(cookie) = cookie {
        builder = builder.header(header::COOKIE, cookie);
    }
    builder.body(Body::empty()).expect("valid request")
}

/// Logs in and returns the session cookie (name=value).
async fn login(app: &Router, username: &str, password: &str) -> String {
    let response = app
        .clone()
        .oneshot(json_request(
            "POST",
            "/api/auth/login",
            None,
            json!({ "username": username, "password": password }),
        ))
        .await
        .expect("login request");
    assert_eq!(response.status(), StatusCode::OK, "login should succeed");
    let cookie = response
        .headers()
        .get(header::SET_COOKIE)
        .expect("set-cookie present")
        .to_str()
        .expect("cookie is ascii")
        .to_string();
    cookie
        .split(';')
        .next()
        .expect("cookie has a value part")
        .to_string()
}

fn sample_event(slug: &str) -> Value {
    json!({
        "slug": slug,
        "title": slug,
        "description": "test event",
        "dateTimeStart": "2026-08-01T23:00:00+02:00",
        "dateTimeEnd": "2026-08-02T07:00:00+02:00",
        "location": {
            "name": "City Club Augsburg",
            "city": "Augsburg",
            "latitude": 48.365419,
            "longitude": 10.895053
        },
        "genre": "Techno",
        "ageRestriction": "18+",
        "acts": [
            { "artists": [{ "name": "TONSAMMLER", "url": "https://www.instagram.com/ton.sammler/" }] }
        ],
        "published": true
    })
}

#[tokio::test]
async fn login_rejects_wrong_credentials() {
    let (app, _dir) = test_app().await;

    let response = app
        .clone()
        .oneshot(json_request(
            "POST",
            "/api/auth/login",
            None,
            json!({ "username": "admin", "password": "wrong-password" }),
        ))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);

    let response = app
        .oneshot(json_request(
            "POST",
            "/api/auth/login",
            None,
            json!({ "username": "ghost", "password": "irrelevant-password" }),
        ))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn login_and_me_roundtrip() {
    let (app, _dir) = test_app().await;
    let cookie = login(&app, "admin", ADMIN_PASSWORD).await;

    let response = app
        .clone()
        .oneshot(get_request("/api/auth/me", Some(&cookie)))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    let body = body_json(response).await;
    assert_eq!(body["username"], "admin");
    assert_eq!(body["role"], "admin");

    // without cookie: 401
    let response = app
        .oneshot(get_request("/api/auth/me", None))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn seeded_events_are_public() {
    let (app, _dir) = test_app().await;

    let response = app.oneshot(get_request("/api/events", None)).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    let body = body_json(response).await;
    let events = body.as_array().expect("array of events");
    assert_eq!(events.len(), 5, "the five seeded events");
    assert_eq!(events[0]["slug"], "apokalypsis", "newest first");
}

#[tokio::test]
async fn event_crud_requires_session_and_validates() {
    let (app, _dir) = test_app().await;

    // unauthenticated create → 401
    let response = app
        .clone()
        .oneshot(json_request(
            "POST",
            "/api/events",
            None,
            sample_event("test-event"),
        ))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);

    let cookie = login(&app, "admin", ADMIN_PASSWORD).await;

    // create → 201
    let response = app
        .clone()
        .oneshot(json_request(
            "POST",
            "/api/events",
            Some(&cookie),
            sample_event("test-event"),
        ))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::CREATED);
    let created = body_json(response).await;
    assert_eq!(created["slug"], "test-event");
    assert_eq!(created["acts"][0]["artists"][0]["name"], "TONSAMMLER");

    // duplicate slug → 409
    let response = app
        .clone()
        .oneshot(json_request(
            "POST",
            "/api/events",
            Some(&cookie),
            sample_event("test-event"),
        ))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::CONFLICT);

    // invalid: end before start → 422
    let mut invalid = sample_event("invalid-event");
    invalid["dateTimeEnd"] = json!("2026-08-01T22:00:00+02:00");
    let response = app
        .clone()
        .oneshot(json_request("POST", "/api/events", Some(&cookie), invalid))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY);

    // update → 200 with changed title
    let mut update = sample_event("ignored");
    update.as_object_mut().unwrap().remove("slug");
    update["title"] = json!("renamed");
    let response = app
        .clone()
        .oneshot(json_request(
            "PUT",
            "/api/events/test-event",
            Some(&cookie),
            update,
        ))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    let updated = body_json(response).await;
    assert_eq!(updated["title"], "renamed");

    // update of a missing event → 404
    let mut update = sample_event("ignored");
    update.as_object_mut().unwrap().remove("slug");
    let response = app
        .clone()
        .oneshot(json_request(
            "PUT",
            "/api/events/does-not-exist",
            Some(&cookie),
            update,
        ))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn drafts_are_hidden_from_the_public() {
    let (app, _dir) = test_app().await;
    let cookie = login(&app, "admin", ADMIN_PASSWORD).await;

    let mut draft = sample_event("secret-draft");
    draft["published"] = json!(false);
    let response = app
        .clone()
        .oneshot(json_request("POST", "/api/events", Some(&cookie), draft))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::CREATED);

    // public list does not contain the draft
    let response = app
        .clone()
        .oneshot(get_request("/api/events", None))
        .await
        .unwrap();
    let body = body_json(response).await;
    assert!(
        body.as_array()
            .unwrap()
            .iter()
            .all(|event| event["slug"] != "secret-draft"),
        "draft must not be public"
    );

    // public detail view → 404
    let response = app
        .clone()
        .oneshot(get_request("/api/events/secret-draft", None))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::NOT_FOUND);

    // includeUnpublished without session → 401
    let response = app
        .clone()
        .oneshot(get_request("/api/events?includeUnpublished=true", None))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);

    // with session the draft is visible
    let response = app
        .clone()
        .oneshot(get_request(
            "/api/events?includeUnpublished=true",
            Some(&cookie),
        ))
        .await
        .unwrap();
    let body = body_json(response).await;
    assert!(body
        .as_array()
        .unwrap()
        .iter()
        .any(|event| event["slug"] == "secret-draft"));
}

#[tokio::test]
async fn roles_are_enforced() {
    let (app, _dir) = test_app().await;
    let admin_cookie = login(&app, "admin", ADMIN_PASSWORD).await;

    // admin creates a member
    let response = app
        .clone()
        .oneshot(json_request(
            "POST",
            "/api/users",
            Some(&admin_cookie),
            json!({ "username": "pepe", "password": MEMBER_PASSWORD, "role": "member" }),
        ))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::CREATED);

    let member_cookie = login(&app, "pepe", MEMBER_PASSWORD).await;

    // member can create events
    let response = app
        .clone()
        .oneshot(json_request(
            "POST",
            "/api/events",
            Some(&member_cookie),
            sample_event("member-event"),
        ))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::CREATED);

    // member cannot delete events
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("DELETE")
                .uri("/api/events/member-event")
                .header(header::COOKIE, &member_cookie)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::FORBIDDEN);

    // member cannot manage users
    let response = app
        .clone()
        .oneshot(get_request("/api/users", Some(&member_cookie)))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::FORBIDDEN);

    // admin can delete the event
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("DELETE")
                .uri("/api/events/member-event")
                .header(header::COOKIE, &admin_cookie)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::NO_CONTENT);
}

#[tokio::test]
async fn the_last_admin_is_protected() {
    let (app, _dir) = test_app().await;
    let admin_cookie = login(&app, "admin", ADMIN_PASSWORD).await;

    // find the admin's id
    let response = app
        .clone()
        .oneshot(get_request("/api/users", Some(&admin_cookie)))
        .await
        .unwrap();
    let body = body_json(response).await;
    let admin_id = body[0]["id"].as_str().unwrap().to_string();

    // demoting the only admin must fail
    let response = app
        .clone()
        .oneshot(json_request(
            "PUT",
            &format!("/api/users/{admin_id}"),
            Some(&admin_cookie),
            json!({ "role": "member" }),
        ))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::CONFLICT);

    // deleting the only admin must fail
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("DELETE")
                .uri(format!("/api/users/{admin_id}"))
                .header(header::COOKIE, &admin_cookie)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::CONFLICT);
}

#[tokio::test]
async fn logout_invalidates_the_session() {
    let (app, _dir) = test_app().await;
    let cookie = login(&app, "admin", ADMIN_PASSWORD).await;

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/auth/logout")
                .header(header::COOKIE, &cookie)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::NO_CONTENT);

    let response = app
        .oneshot(get_request("/api/auth/me", Some(&cookie)))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}
