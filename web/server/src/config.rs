//! Central configuration for the impedanz server.
//!
//! ALL environment variables used anywhere in this service are read here
//! and only here, then exposed through [`ServerConfig`].
//!
//! Configuration sources, later ones override earlier ones:
//! 1. built-in defaults
//! 2. the YAML config file (single file, mounted into the container)
//! 3. environment variables
//!
//! Environment variables (each also supports the `_FILE` suffix
//! convention: `IMPEDANZ_INITIAL_ADMIN_PASSWORD_FILE=/run/secrets/pw`
//! reads the value from that file instead):
//!
//! | variable                          | default              | meaning                                   |
//! |-----------------------------------|----------------------|-------------------------------------------|
//! | `IMPEDANZ_CONFIG`                 | `/config.yaml`       | path to the YAML config file              |
//! | `IMPEDANZ_BIND_ADDRESS`           | `[::]:80`            | dual-stack socket address to listen on    |
//! | `IMPEDANZ_PUBLIC_DIR`             | `/public`            | directory with the static Astro build     |
//! | `IMPEDANZ_LOG_FILTER`             | `info`               | tracing env-filter directive              |
//! | `IMPEDANZ_DATABASE_PATH`          | `/data/impedanz.db`  | SQLite database file                      |
//! | `IMPEDANZ_MEDIA_DIR`              | `/data/media`        | uploaded event artwork storage            |
//! | `IMPEDANZ_COOKIE_SECURE`          | `true`               | set the Secure flag on session cookies    |
//! | `IMPEDANZ_INITIAL_ADMIN_USERNAME` | unset                | bootstrap admin (only used on empty DB)   |
//! | `IMPEDANZ_INITIAL_ADMIN_PASSWORD` | unset                | bootstrap admin password                  |

use serde::Deserialize;
use std::net::SocketAddr;
use std::path::PathBuf;

#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("failed to read config file {path}: {source}")]
    ReadFile {
        path: String,
        source: std::io::Error,
    },
    #[error("failed to parse config file {path}: {source}")]
    ParseFile {
        path: String,
        source: serde_yaml_neo::Error,
    },
    #[error("failed to read {path} referenced by {variable}: {source}")]
    ReadEnvFile {
        variable: String,
        path: String,
        source: std::io::Error,
    },
    #[error("environment variable {variable} contains invalid unicode")]
    InvalidUnicode { variable: String },
    #[error("invalid value for {variable}: {message}")]
    InvalidValue { variable: String, message: String },
}

/// A string that must never end up in logs (passwords etc.).
#[derive(Clone, Deserialize)]
#[serde(transparent)]
pub struct Secret(pub String);

impl std::fmt::Debug for Secret {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("«redacted»")
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct ServerConfig {
    /// Socket address the HTTP listener binds to. `[::]` binds dual
    /// stack on Linux, so IPv4 stays reachable via mapped addresses.
    pub bind_address: SocketAddr,
    /// Directory containing the static Astro build output.
    pub public_dir: PathBuf,
    /// Directive for `tracing_subscriber::EnvFilter`, e.g.
    /// `info` or `info,impedanz_server=debug`.
    pub log_filter: String,
    /// SQLite database file (created on first start).
    pub database_path: PathBuf,
    /// Directory for uploaded event artwork, served under /media/.
    pub media_dir: PathBuf,
    /// Whether session cookies carry the Secure flag. Disable only for
    /// plain-http local development.
    pub cookie_secure: bool,
    /// Bootstrap admin account, created only when the users table is
    /// empty. Prefer the environment variables for the password.
    pub initial_admin_username: Option<String>,
    pub initial_admin_password: Option<Secret>,
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            bind_address: "[::]:80".parse().expect("static address is valid"),
            public_dir: PathBuf::from("/public"),
            log_filter: String::from("info"),
            database_path: PathBuf::from("/data/impedanz.db"),
            media_dir: PathBuf::from("/data/media"),
            cookie_secure: true,
            initial_admin_username: None,
            initial_admin_password: None,
        }
    }
}

impl ServerConfig {
    pub fn load() -> Result<Self, ConfigError> {
        let config_path =
            read_env("IMPEDANZ_CONFIG")?.unwrap_or_else(|| String::from("/config.yaml"));

        let mut config = match std::fs::read_to_string(&config_path) {
            Ok(contents) => {
                serde_yaml_neo::from_str::<ServerConfig>(&contents).map_err(|source| {
                    ConfigError::ParseFile {
                        path: config_path.clone(),
                        source,
                    }
                })?
            }
            // A missing file is fine (local development); anything else
            // is a real error that must not be silently swallowed.
            Err(source) if source.kind() == std::io::ErrorKind::NotFound => Self::default(),
            Err(source) => {
                return Err(ConfigError::ReadFile {
                    path: config_path,
                    source,
                })
            }
        };

        if let Some(value) = read_env("IMPEDANZ_BIND_ADDRESS")? {
            config.bind_address = value.parse().map_err(|error: std::net::AddrParseError| {
                ConfigError::InvalidValue {
                    variable: String::from("IMPEDANZ_BIND_ADDRESS"),
                    message: error.to_string(),
                }
            })?;
        }
        if let Some(value) = read_env("IMPEDANZ_PUBLIC_DIR")? {
            config.public_dir = PathBuf::from(value);
        }
        if let Some(value) = read_env("IMPEDANZ_LOG_FILTER")? {
            config.log_filter = value;
        }
        if let Some(value) = read_env("IMPEDANZ_DATABASE_PATH")? {
            config.database_path = PathBuf::from(value);
        }
        if let Some(value) = read_env("IMPEDANZ_MEDIA_DIR")? {
            config.media_dir = PathBuf::from(value);
        }
        if let Some(value) = read_env("IMPEDANZ_COOKIE_SECURE")? {
            config.cookie_secure = match value.as_str() {
                "true" | "1" => true,
                "false" | "0" => false,
                other => {
                    return Err(ConfigError::InvalidValue {
                        variable: String::from("IMPEDANZ_COOKIE_SECURE"),
                        message: format!("expected true/false, got {other:?}"),
                    })
                }
            };
        }
        if let Some(value) = read_env("IMPEDANZ_INITIAL_ADMIN_USERNAME")? {
            config.initial_admin_username = Some(value);
        }
        if let Some(value) = read_env("IMPEDANZ_INITIAL_ADMIN_PASSWORD")? {
            config.initial_admin_password = Some(Secret(value));
        }

        Ok(config)
    }
}

/// Reads `variable`, falling back to the `_FILE` suffix convention:
/// if `<variable>_FILE` is set, the value is read from that file.
fn read_env(variable: &str) -> Result<Option<String>, ConfigError> {
    match std::env::var(variable) {
        Ok(value) => return Ok(Some(value)),
        Err(std::env::VarError::NotPresent) => {}
        Err(std::env::VarError::NotUnicode(_)) => {
            return Err(ConfigError::InvalidUnicode {
                variable: variable.to_string(),
            })
        }
    }

    let file_variable = format!("{variable}_FILE");
    match std::env::var(&file_variable) {
        Ok(path) => {
            let contents =
                std::fs::read_to_string(&path).map_err(|source| ConfigError::ReadEnvFile {
                    variable: file_variable,
                    path,
                    source,
                })?;
            Ok(Some(contents.trim_end_matches(['\r', '\n']).to_string()))
        }
        Err(std::env::VarError::NotPresent) => Ok(None),
        Err(std::env::VarError::NotUnicode(_)) => Err(ConfigError::InvalidUnicode {
            variable: file_variable,
        }),
    }
}
