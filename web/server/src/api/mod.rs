//! The IMPEDANZ HTTP API: auth, user management, event publishing and
//! artwork upload. Everything is routed through [`OpenApiRouter`] so
//! the OpenAPI document (and any generated client) stays complete.

pub mod events;
pub mod media;
pub mod users;

use axum::extract::DefaultBodyLimit;
use axum::http::header::{HeaderValue, CACHE_CONTROL};
use axum::Json;
use axum::Router;
use serde::Serialize;
use utoipa::openapi::security::{ApiKey, ApiKeyValue, SecurityScheme};
use utoipa::{Modify, OpenApi, ToSchema};
use utoipa_axum::router::OpenApiRouter;
use utoipa_axum::routes;

use crate::auth;
use crate::state::AppState;

struct SessionSecurity;

impl Modify for SessionSecurity {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        let components = openapi
            .components
            .get_or_insert_with(utoipa::openapi::Components::default);
        components.add_security_scheme(
            "session",
            SecurityScheme::ApiKey(ApiKey::Cookie(ApiKeyValue::new(auth::SESSION_COOKIE))),
        );
    }
}

#[derive(OpenApi)]
#[openapi(
    info(
        title = "IMPEDANZ API",
        description = "API of the IMPEDANZ techno collective: member login and event publishing.",
        license(name = "AGPL-3.0-or-later")
    ),
    modifiers(&SessionSecurity)
)]
struct ApiDoc;

#[derive(Serialize, ToSchema)]
pub struct HealthResponse {
    /// Always `ok` while the service is able to respond.
    pub status: &'static str,
    /// The crate version of the running server.
    pub version: &'static str,
}

#[utoipa::path(
    get,
    path = "/health",
    tag = "system",
    responses((status = OK, description = "Service is healthy", body = HealthResponse))
)]
async fn get_health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        version: env!("CARGO_PKG_VERSION"),
    })
}

/// Returns the API router (nested under `/api`) and the OpenAPI
/// document describing it.
pub fn router(state: AppState) -> (Router, utoipa::openapi::OpenApi) {
    let api_routes = OpenApiRouter::new()
        .routes(routes!(get_health))
        .routes(routes!(auth::login))
        .routes(routes!(auth::logout))
        .routes(routes!(auth::me))
        .routes(routes!(auth::change_password))
        .routes(routes!(users::list_users, users::create_user))
        .routes(routes!(users::update_user, users::delete_user))
        .routes(routes!(events::list_events, events::create_event))
        .routes(routes!(
            events::get_event,
            events::update_event,
            events::delete_event
        ))
        .routes(routes!(media::upload_media))
        .layer(DefaultBodyLimit::max(media::MAX_UPLOAD_BYTES))
        // API responses are user-specific or freshly generated — never cache
        .layer(tower_http::set_header::SetResponseHeaderLayer::overriding(
            CACHE_CONTROL,
            HeaderValue::from_static("no-store"),
        ));

    let (router, openapi) = OpenApiRouter::with_openapi(ApiDoc::openapi())
        .nest("/api", api_routes)
        .split_for_parts();

    (router.with_state(state), openapi)
}
