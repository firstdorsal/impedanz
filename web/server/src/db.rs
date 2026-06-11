use std::path::Path;
use std::str::FromStr;

use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions};
use sqlx::SqlitePool;

#[derive(Debug, thiserror::Error)]
pub enum DbError {
    #[error("invalid database path {path}")]
    InvalidPath { path: String },
    #[error("failed to connect to database: {0}")]
    Connect(#[source] sqlx::Error),
    #[error("failed to run migrations: {0}")]
    Migrate(#[from] sqlx::migrate::MigrateError),
}

/// Opens (and creates if missing) the SQLite database and runs all
/// embedded migrations.
pub async fn connect(database_path: &Path) -> Result<SqlitePool, DbError> {
    let path = database_path.to_str().ok_or_else(|| DbError::InvalidPath {
        path: database_path.display().to_string(),
    })?;

    let options = SqliteConnectOptions::from_str(&format!("sqlite://{path}"))
        .map_err(DbError::Connect)?
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .foreign_keys(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(8)
        .connect_with(options)
        .await
        .map_err(DbError::Connect)?;

    sqlx::migrate!("./migrations").run(&pool).await?;

    Ok(pool)
}
