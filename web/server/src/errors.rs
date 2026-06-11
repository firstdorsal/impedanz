//! API-wide error type. Every handler returns `Result<_, ApiError>`;
//! the `IntoResponse` impl maps variants to status codes and a JSON
//! body. 5xx details are logged, never sent to the client.

use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Serialize;
use utoipa::ToSchema;

#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("authentication required")]
    Unauthorized,
    #[error("insufficient permissions")]
    Forbidden,
    #[error("not found")]
    NotFound,
    #[error("{0}")]
    Conflict(String),
    #[error("{0}")]
    Validation(String),
    #[error("database error")]
    Database(#[from] sqlx::Error),
    #[error("stored data is corrupt")]
    CorruptData(#[from] serde_json::Error),
    #[error("timestamp in database is not RFC 3339")]
    CorruptTimestamp(#[from] chrono::ParseError),
    #[error("password hashing failed")]
    PasswordHash(argon2::password_hash::Error),
    #[error("io error")]
    Io(#[from] std::io::Error),
}

#[derive(Serialize, ToSchema)]
pub struct ErrorBody {
    /// Human readable error message.
    pub error: String,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let status = match &self {
            ApiError::Unauthorized => StatusCode::UNAUTHORIZED,
            ApiError::Forbidden => StatusCode::FORBIDDEN,
            ApiError::NotFound => StatusCode::NOT_FOUND,
            ApiError::Conflict(_) => StatusCode::CONFLICT,
            ApiError::Validation(_) => StatusCode::UNPROCESSABLE_ENTITY,
            ApiError::Database(sqlx::Error::RowNotFound) => StatusCode::NOT_FOUND,
            ApiError::Database(_)
            | ApiError::CorruptData(_)
            | ApiError::CorruptTimestamp(_)
            | ApiError::PasswordHash(_)
            | ApiError::Io(_) => StatusCode::INTERNAL_SERVER_ERROR,
        };

        if status.is_server_error() {
            tracing::error!(error = ?self, "api request failed");
        }

        let message = if status.is_server_error() {
            String::from("internal error")
        } else {
            self.to_string()
        };

        (status, Json(ErrorBody { error: message })).into_response()
    }
}
