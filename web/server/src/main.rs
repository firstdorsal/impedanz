//! impedanz-server: serves the static impedanz.net site and hosts the
//! IMPEDANZ API (OpenAPI under /api/openapi.json, docs under /api/docs).

mod api;
mod config;
mod static_files;

use axum::Router;
use tower_http::compression::CompressionLayer;
use tower_http::trace::TraceLayer;
use tracing::info;
use tracing_subscriber::EnvFilter;
use utoipa_swagger_ui::SwaggerUi;

use crate::config::ServerConfig;

#[derive(Debug, thiserror::Error)]
enum ServerError {
    #[error(transparent)]
    Config(#[from] config::ConfigError),
    #[error("invalid log filter: {0}")]
    LogFilter(#[from] tracing_subscriber::filter::ParseError),
    #[error(transparent)]
    StaticFiles(#[from] static_files::StaticFilesError),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
}

#[tokio::main]
async fn main() -> Result<(), ServerError> {
    let config = ServerConfig::load()?;

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_new(&config.log_filter)?)
        .init();
    info!(?config, "starting impedanz-server");

    let (api_router, openapi) = api::router();

    let app = Router::new()
        .merge(api_router)
        .merge(SwaggerUi::new("/api/docs").url("/api/openapi.json", openapi))
        .fallback_service(static_files::router(&config.public_dir).await?)
        // all compression algorithms are enabled (gzip, deflate, br, zstd)
        .layer(CompressionLayer::new())
        .layer(TraceLayer::new_for_http());

    let listener = tokio::net::TcpListener::bind(config.bind_address).await?;
    info!("listening on {}", listener.local_addr()?);

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to install ctrl-c handler");
    };

    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to install SIGTERM handler")
            .recv()
            .await;
    };

    tokio::select! {
        () = ctrl_c => {},
        () = terminate => {},
    }

    info!("shutdown signal received");
}
