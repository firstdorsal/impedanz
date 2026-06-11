//! Member-facing event publishing: create, edit, list, delete.
//!
//! Events carry a `published` flag — unpublished drafts are only
//! visible to logged-in members. The slug is immutable after creation
//! because it is the event's public URL identity.

use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::Json;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};
use uuid::Uuid;

use crate::auth::{parse_timestamp, AuthSession, Role};
use crate::errors::ApiError;
use crate::state::AppState;

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Artist {
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Act {
    pub artists: Vec<Artist>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub artist_joiner: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub time: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct EventLocation {
    pub name: String,
    pub city: String,
    pub latitude: f64,
    pub longitude: f64,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Event {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub description: String,
    pub date_time_start: DateTime<Utc>,
    pub date_time_end: DateTime<Utc>,
    pub location: EventLocation,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ticket_link: Option<String>,
    pub genre: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub age_restriction: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_alt: Option<String>,
    pub acts: Vec<Act>,
    pub published: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// All mutable fields of an event. Used directly by PUT and embedded
/// in the create request.
#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct EventPayload {
    pub title: String,
    #[serde(default)]
    pub description: String,
    pub date_time_start: DateTime<Utc>,
    pub date_time_end: DateTime<Utc>,
    pub location: EventLocation,
    #[serde(default)]
    pub ticket_link: Option<String>,
    pub genre: String,
    #[serde(default)]
    pub age_restriction: Option<String>,
    #[serde(default)]
    pub image_url: Option<String>,
    #[serde(default)]
    pub image_alt: Option<String>,
    #[serde(default)]
    pub acts: Vec<Act>,
    #[serde(default)]
    pub published: bool,
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateEventRequest {
    /// URL identity of the event (/events/<slug>/). Immutable.
    pub slug: String,
    #[serde(flatten)]
    pub event: EventPayload,
}

#[derive(Deserialize, IntoParams)]
#[serde(rename_all = "camelCase")]
pub struct ListEventsQuery {
    /// Also return unpublished drafts. Requires a session.
    #[serde(default)]
    pub include_unpublished: bool,
}

#[derive(sqlx::FromRow)]
struct EventRow {
    id: String,
    slug: String,
    title: String,
    description: String,
    date_time_start: String,
    date_time_end: String,
    location_name: String,
    location_city: String,
    location_latitude: f64,
    location_longitude: f64,
    ticket_link: Option<String>,
    genre: String,
    age_restriction: Option<String>,
    image_url: Option<String>,
    image_alt: Option<String>,
    acts: String,
    published: i64,
    created_at: String,
    updated_at: String,
}

impl EventRow {
    fn into_event(self) -> Result<Event, ApiError> {
        Ok(Event {
            id: Uuid::parse_str(&self.id).map_err(|_| {
                ApiError::Validation(format!("corrupt event id {:?} in database", self.id))
            })?,
            slug: self.slug,
            title: self.title,
            description: self.description,
            date_time_start: parse_timestamp(&self.date_time_start)?,
            date_time_end: parse_timestamp(&self.date_time_end)?,
            location: EventLocation {
                name: self.location_name,
                city: self.location_city,
                latitude: self.location_latitude,
                longitude: self.location_longitude,
            },
            ticket_link: self.ticket_link,
            genre: self.genre,
            age_restriction: self.age_restriction,
            image_url: self.image_url,
            image_alt: self.image_alt,
            acts: serde_json::from_str(&self.acts)?,
            published: self.published != 0,
            created_at: parse_timestamp(&self.created_at)?,
            updated_at: parse_timestamp(&self.updated_at)?,
        })
    }
}

/// Static SELECT with a literal suffix — sqlx 0.9 only accepts
/// `&'static str` SQL, which rules out runtime `format!`.
macro_rules! select_event {
    ($suffix:literal) => {
        concat!(
            "SELECT id, slug, title, description, date_time_start, date_time_end, ",
            "location_name, location_city, location_latitude, location_longitude, ",
            "ticket_link, genre, age_restriction, image_url, image_alt, acts, ",
            "published, created_at, updated_at FROM events",
            $suffix
        )
    };
}

// --- validation -------------------------------------------------------

fn validate_slug(slug: &str) -> Result<(), ApiError> {
    let length = slug.chars().count();
    if !(1..=64).contains(&length) {
        return Err(ApiError::Validation(String::from(
            "slug must be between 1 and 64 characters",
        )));
    }
    let mut chars = slug.chars();
    let first = chars.next().expect("length checked above");
    if !first.is_ascii_lowercase() && !first.is_ascii_digit() {
        return Err(ApiError::Validation(String::from(
            "slug must start with a-z or 0-9",
        )));
    }
    if !slug.chars().all(|character| {
        character.is_ascii_lowercase() || character.is_ascii_digit() || character == '-'
    }) {
        return Err(ApiError::Validation(String::from(
            "slug may only contain a-z, 0-9 and '-'",
        )));
    }
    Ok(())
}

fn validate_url(field: &str, value: &str, allow_relative: bool) -> Result<(), ApiError> {
    let valid = value.starts_with("https://") || (allow_relative && value.starts_with('/'));
    if !valid {
        return Err(ApiError::Validation(format!(
            "{field} must start with https://{}",
            if allow_relative {
                " or be site-relative (/...)"
            } else {
                ""
            }
        )));
    }
    Ok(())
}

fn validate_payload(payload: &EventPayload) -> Result<(), ApiError> {
    if payload.title.trim().is_empty() || payload.title.chars().count() > 200 {
        return Err(ApiError::Validation(String::from(
            "title must be between 1 and 200 characters",
        )));
    }
    if payload.date_time_end <= payload.date_time_start {
        return Err(ApiError::Validation(String::from(
            "dateTimeEnd must be after dateTimeStart",
        )));
    }
    if !(-90.0..=90.0).contains(&payload.location.latitude)
        || !(-180.0..=180.0).contains(&payload.location.longitude)
    {
        return Err(ApiError::Validation(String::from(
            "location coordinates are out of range",
        )));
    }
    if payload.location.name.trim().is_empty() || payload.location.city.trim().is_empty() {
        return Err(ApiError::Validation(String::from(
            "location name and city must not be empty",
        )));
    }
    if let Some(link) = payload.ticket_link.as_deref() {
        if !link.is_empty() {
            validate_url("ticketLink", link, false)?;
        }
    }
    if let Some(image) = payload.image_url.as_deref() {
        validate_url("imageUrl", image, true)?;
    }
    for act in &payload.acts {
        if act.artists.is_empty() {
            return Err(ApiError::Validation(String::from(
                "every act needs at least one artist",
            )));
        }
        for artist in &act.artists {
            if artist.name.trim().is_empty() {
                return Err(ApiError::Validation(String::from(
                    "artist names must not be empty",
                )));
            }
            if let Some(url) = artist.url.as_deref() {
                validate_url("artist url", url, false)?;
            }
        }
    }
    Ok(())
}

// --- handlers ---------------------------------------------------------

#[utoipa::path(
    get,
    path = "/events",
    tag = "events",
    params(ListEventsQuery),
    responses(
        (status = OK, description = "Events, newest first", body = [Event]),
        (status = UNAUTHORIZED, description = "includeUnpublished without session", body = crate::errors::ErrorBody)
    )
)]
pub async fn list_events(
    State(state): State<AppState>,
    session: Option<AuthSession>,
    Query(query): Query<ListEventsQuery>,
) -> Result<Json<Vec<Event>>, ApiError> {
    let include_unpublished = query.include_unpublished;
    if include_unpublished && session.is_none() {
        return Err(ApiError::Unauthorized);
    }

    let rows = if include_unpublished {
        sqlx::query_as::<_, EventRow>(select_event!(" ORDER BY date_time_start DESC"))
            .fetch_all(&state.pool)
            .await?
    } else {
        sqlx::query_as::<_, EventRow>(select_event!(
            " WHERE published = 1 ORDER BY date_time_start DESC"
        ))
        .fetch_all(&state.pool)
        .await?
    };

    rows.into_iter()
        .map(EventRow::into_event)
        .collect::<Result<Vec<_>, _>>()
        .map(Json)
}

#[utoipa::path(
    get,
    path = "/events/{slug}",
    tag = "events",
    params(("slug" = String, Path, description = "Event slug")),
    responses(
        (status = OK, description = "The event", body = Event),
        (status = NOT_FOUND, description = "No such event (or unpublished draft without session)", body = crate::errors::ErrorBody)
    )
)]
pub async fn get_event(
    State(state): State<AppState>,
    session: Option<AuthSession>,
    Path(slug): Path<String>,
) -> Result<Json<Event>, ApiError> {
    let row = sqlx::query_as::<_, EventRow>(select_event!(" WHERE slug = ?"))
        .bind(&slug)
        .fetch_optional(&state.pool)
        .await?
        .ok_or(ApiError::NotFound)?;

    if row.published == 0 && session.is_none() {
        return Err(ApiError::NotFound);
    }

    row.into_event().map(Json)
}

#[utoipa::path(
    post,
    path = "/events",
    tag = "events",
    security(("session" = [])),
    request_body = CreateEventRequest,
    responses(
        (status = CREATED, description = "Event created", body = Event),
        (status = CONFLICT, description = "Slug already exists", body = crate::errors::ErrorBody),
        (status = UNPROCESSABLE_ENTITY, description = "Validation failed", body = crate::errors::ErrorBody)
    )
)]
pub async fn create_event(
    State(state): State<AppState>,
    session: AuthSession,
    Json(request): Json<CreateEventRequest>,
) -> Result<(StatusCode, Json<Event>), ApiError> {
    validate_slug(&request.slug)?;
    validate_payload(&request.event)?;

    let existing: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events WHERE slug = ?")
        .bind(&request.slug)
        .fetch_one(&state.pool)
        .await?;
    if existing > 0 {
        return Err(ApiError::Conflict(format!(
            "an event with slug {:?} already exists",
            request.slug
        )));
    }

    let payload = request.event;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    sqlx::query(
        "INSERT INTO events (id, slug, title, description, date_time_start, date_time_end, \
         location_name, location_city, location_latitude, location_longitude, ticket_link, \
         genre, age_restriction, image_url, image_alt, acts, published, created_by, \
         created_at, updated_at) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&request.slug)
    .bind(payload.title.trim())
    .bind(&payload.description)
    .bind(payload.date_time_start.to_rfc3339())
    .bind(payload.date_time_end.to_rfc3339())
    .bind(payload.location.name.trim())
    .bind(payload.location.city.trim())
    .bind(payload.location.latitude)
    .bind(payload.location.longitude)
    .bind(
        payload
            .ticket_link
            .as_deref()
            .filter(|link| !link.is_empty()),
    )
    .bind(&payload.genre)
    .bind(&payload.age_restriction)
    .bind(&payload.image_url)
    .bind(&payload.image_alt)
    .bind(serde_json::to_string(&payload.acts)?)
    .bind(i64::from(payload.published))
    .bind(session.user.id.to_string())
    .bind(&now)
    .bind(&now)
    .execute(&state.pool)
    .await?;

    tracing::info!(slug = %request.slug, user = %session.user.username, "event created");

    let row = sqlx::query_as::<_, EventRow>(select_event!(" WHERE id = ?"))
        .bind(&id)
        .fetch_one(&state.pool)
        .await?;
    Ok((StatusCode::CREATED, Json(row.into_event()?)))
}

#[utoipa::path(
    put,
    path = "/events/{slug}",
    tag = "events",
    security(("session" = [])),
    params(("slug" = String, Path, description = "Event slug")),
    request_body = EventPayload,
    responses(
        (status = OK, description = "Event updated", body = Event),
        (status = NOT_FOUND, description = "No such event", body = crate::errors::ErrorBody),
        (status = UNPROCESSABLE_ENTITY, description = "Validation failed", body = crate::errors::ErrorBody)
    )
)]
pub async fn update_event(
    State(state): State<AppState>,
    session: AuthSession,
    Path(slug): Path<String>,
    Json(payload): Json<EventPayload>,
) -> Result<Json<Event>, ApiError> {
    validate_payload(&payload)?;

    let result = sqlx::query(
        "UPDATE events SET title = ?, description = ?, date_time_start = ?, date_time_end = ?, \
         location_name = ?, location_city = ?, location_latitude = ?, location_longitude = ?, \
         ticket_link = ?, genre = ?, age_restriction = ?, image_url = ?, image_alt = ?, \
         acts = ?, published = ?, updated_at = ? WHERE slug = ?",
    )
    .bind(payload.title.trim())
    .bind(&payload.description)
    .bind(payload.date_time_start.to_rfc3339())
    .bind(payload.date_time_end.to_rfc3339())
    .bind(payload.location.name.trim())
    .bind(payload.location.city.trim())
    .bind(payload.location.latitude)
    .bind(payload.location.longitude)
    .bind(
        payload
            .ticket_link
            .as_deref()
            .filter(|link| !link.is_empty()),
    )
    .bind(&payload.genre)
    .bind(&payload.age_restriction)
    .bind(&payload.image_url)
    .bind(&payload.image_alt)
    .bind(serde_json::to_string(&payload.acts)?)
    .bind(i64::from(payload.published))
    .bind(Utc::now().to_rfc3339())
    .bind(&slug)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound);
    }

    tracing::info!(slug = %slug, user = %session.user.username, "event updated");

    let row = sqlx::query_as::<_, EventRow>(select_event!(" WHERE slug = ?"))
        .bind(&slug)
        .fetch_one(&state.pool)
        .await?;
    row.into_event().map(Json)
}

#[utoipa::path(
    delete,
    path = "/events/{slug}",
    tag = "events",
    security(("session" = [])),
    params(("slug" = String, Path, description = "Event slug")),
    responses(
        (status = NO_CONTENT, description = "Event deleted"),
        (status = FORBIDDEN, description = "Requires the admin role", body = crate::errors::ErrorBody),
        (status = NOT_FOUND, description = "No such event", body = crate::errors::ErrorBody)
    )
)]
pub async fn delete_event(
    State(state): State<AppState>,
    session: AuthSession,
    Path(slug): Path<String>,
) -> Result<StatusCode, ApiError> {
    session.require_role(Role::Admin)?;

    let result = sqlx::query("DELETE FROM events WHERE slug = ?")
        .bind(&slug)
        .execute(&state.pool)
        .await?;
    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound);
    }

    tracing::info!(slug = %slug, user = %session.user.username, "event deleted");
    Ok(StatusCode::NO_CONTENT)
}
