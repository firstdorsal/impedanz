use impedanz_server::config::ServerConfig;
use impedanz_server::ServerError;
use tower_http::compression::CompressionLayer;
use tower_http::trace::TraceLayer;
use tracing::info;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> Result<(), ServerError> {
    let config = ServerConfig::load()?;

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_new(&config.log_filter)?)
        .init();
    info!(?config, "starting impedanz-server");

    let bind_address = config.bind_address;
    let state = impedanz_server::init_state(config).await?;
    let app = impedanz_server::app(state)
        .await?
        // all compression algorithms are enabled (gzip, deflate, br, zstd)
        .layer(CompressionLayer::new())
        .layer(TraceLayer::new_for_http());

    let listener = tokio::net::TcpListener::bind(bind_address).await?;
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
