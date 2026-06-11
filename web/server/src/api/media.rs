//! Event artwork upload. Files are stored under the media directory
//! with a random name and served immutably at /media/<name>.

use axum::extract::{Multipart, State};
use axum::http::StatusCode;
use axum::Json;
use serde::Serialize;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::auth::AuthSession;
use crate::errors::ApiError;
use crate::state::AppState;

pub const MAX_UPLOAD_BYTES: usize = 15 * 1024 * 1024;

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct MediaResponse {
    /// Site-relative URL of the uploaded file, usable as an event's
    /// imageUrl.
    pub url: String,
}

const ALLOWED_TYPES: &[(&str, &str)] = &[
    ("image/jpeg", "jpg"),
    ("image/png", "png"),
    ("image/webp", "webp"),
    ("image/avif", "avif"),
];

#[utoipa::path(
    post,
    path = "/media",
    tag = "media",
    security(("session" = [])),
    request_body(content_type = "multipart/form-data", description = "A single `file` field with the image"),
    responses(
        (status = CREATED, description = "File stored", body = MediaResponse),
        (status = UNPROCESSABLE_ENTITY, description = "Not an accepted image type", body = crate::errors::ErrorBody),
        (status = UNAUTHORIZED, description = "Not logged in", body = crate::errors::ErrorBody)
    )
)]
pub async fn upload_media(
    State(state): State<AppState>,
    session: AuthSession,
    mut multipart: Multipart,
) -> Result<(StatusCode, Json<MediaResponse>), ApiError> {
    let mut data: Option<Vec<u8>> = None;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|error| ApiError::Validation(format!("invalid multipart body: {error}")))?
    {
        if field.name() == Some("file") {
            let bytes = field
                .bytes()
                .await
                .map_err(|error| ApiError::Validation(format!("failed to read upload: {error}")))?;
            data = Some(bytes.to_vec());
            break;
        }
    }

    let data = data
        .ok_or_else(|| ApiError::Validation(String::from("multipart body needs a `file` field")))?;
    if data.is_empty() {
        return Err(ApiError::Validation(String::from("uploaded file is empty")));
    }

    // sniff the real content type — the client-provided one is untrusted
    let kind = infer::get(&data)
        .ok_or_else(|| ApiError::Validation(String::from("could not detect file type")))?;
    let extension = ALLOWED_TYPES
        .iter()
        .find(|(mime, _)| *mime == kind.mime_type())
        .map(|(_, extension)| *extension)
        .ok_or_else(|| {
            ApiError::Validation(format!(
                "file type {} is not allowed (jpeg, png, webp, avif)",
                kind.mime_type()
            ))
        })?;

    let file_name = format!("{}.{extension}", Uuid::new_v4());
    let path = state.config.media_dir.join(&file_name);
    tokio::fs::write(&path, &data).await?;

    tracing::info!(file = %file_name, user = %session.user.username, bytes = data.len(), "media uploaded");

    Ok((
        StatusCode::CREATED,
        Json(MediaResponse {
            url: format!("/media/{file_name}"),
        }),
    ))
}
