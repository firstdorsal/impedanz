//! impedanz-server: serves the static impedanz.net site and hosts the
//! IMPEDANZ API (member login, event publishing, artwork upload).

pub mod api;
pub mod auth;
pub mod config;
pub mod db;
pub mod errors;
pub mod state;
pub mod static_files;

use std::sync::Arc;

use axum::middleware;
use axum::Router;
use tower_http::services::ServeDir;
use utoipa_swagger_ui::SwaggerUi;

use crate::config::ServerConfig;
use crate::state::AppState;

#[derive(Debug, thiserror::Error)]
pub enum ServerError {
    #[error(transparent)]
    Config(#[from] config::ConfigError),
    #[error("invalid log filter: {0}")]
    LogFilter(#[from] tracing_subscriber::filter::ParseError),
    #[error(transparent)]
    Db(#[from] db::DbError),
    #[error(transparent)]
    StaticFiles(#[from] static_files::StaticFilesError),
    #[error("api bootstrap failed: {0}")]
    Bootstrap(#[from] errors::ApiError),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
}

/// Connects the database, runs migrations, ensures the bootstrap admin
/// and returns the application state.
pub async fn init_state(config: ServerConfig) -> Result<AppState, ServerError> {
    if let Some(parent) = config.database_path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::create_dir_all(&config.media_dir)?;

    let pool = db::connect(&config.database_path).await?;
    auth::ensure_initial_admin(&pool, &config).await?;

    Ok(AppState {
        pool,
        config: Arc::new(config),
    })
}

/// The API part of the application (everything under /api plus the
/// swagger ui). Used directly by the integration tests.
pub fn api_app(state: AppState) -> Router {
    let (api_router, openapi) = api::router(state);
    api_router.merge(SwaggerUi::new("/api/docs").url("/api/openapi.json", openapi))
}

/// The full application: API, uploaded media and the static site.
pub async fn app(state: AppState) -> Result<Router, ServerError> {
    let media_dir = state.config.media_dir.clone();
    let public_dir = state.config.public_dir.clone();

    let media_router = Router::new()
        .fallback_service(ServeDir::new(media_dir))
        .layer(middleware::from_fn(static_files::immutable_headers));

    Ok(api_app(state)
        .nest("/media", media_router)
        .fallback_service(static_files::router(&public_dir).await?))
}
