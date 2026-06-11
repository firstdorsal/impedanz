//! Username/password authentication with server-side sessions.
//!
//! - Passwords are hashed with argon2id.
//! - The session cookie holds a random 256-bit token; only its SHA-256
//!   is stored, so a leaked database does not leak valid sessions.
//! - Roles: `admin` (user management, destructive actions) and
//!   `member` (event publishing and editing).

use std::sync::OnceLock;
use std::time::Duration;

use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use axum::extract::{FromRequestParts, OptionalFromRequestParts, State};
use axum::http::request::Parts;
use axum::Json;
use axum_extra::extract::cookie::{Cookie, CookieJar, SameSite};
use chrono::{DateTime, Duration as ChronoDuration, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::SqlitePool;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::errors::ApiError;
use crate::state::AppState;

pub const SESSION_COOKIE: &str = "impedanz_session";
const SESSION_TTL_DAYS: i64 = 30;
/// Uniform delay on failed logins to blunt brute force and timing probes.
const FAILED_LOGIN_DELAY: Duration = Duration::from_millis(500);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    Admin,
    Member,
}

impl Role {
    pub fn as_str(self) -> &'static str {
        match self {
            Role::Admin => "admin",
            Role::Member => "member",
        }
    }

    pub fn parse(value: &str) -> Result<Self, ApiError> {
        match value {
            "admin" => Ok(Role::Admin),
            "member" => Ok(Role::Member),
            other => Err(ApiError::Validation(format!("unknown role {other:?}"))),
        }
    }
}

#[derive(Debug, Clone, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UserResponse {
    pub id: Uuid,
    pub username: String,
    pub role: Role,
    pub created_at: DateTime<Utc>,
}

#[derive(sqlx::FromRow)]
pub struct UserRow {
    pub id: String,
    pub username: String,
    pub password_hash: String,
    pub role: String,
    pub created_at: String,
}

impl UserRow {
    pub fn into_response(self) -> Result<UserResponse, ApiError> {
        Ok(UserResponse {
            id: Uuid::parse_str(&self.id).map_err(|_| {
                ApiError::Validation(format!("corrupt user id {:?} in database", self.id))
            })?,
            username: self.username,
            role: Role::parse(&self.role)?,
            created_at: parse_timestamp(&self.created_at)?,
        })
    }
}

pub fn parse_timestamp(value: &str) -> Result<DateTime<Utc>, ApiError> {
    Ok(DateTime::parse_from_rfc3339(value)?.with_timezone(&Utc))
}

// --- password hashing ------------------------------------------------

pub fn hash_password(password: &str) -> Result<String, ApiError> {
    let salt =
        SaltString::encode_b64(&rand::random::<[u8; 16]>()).map_err(ApiError::PasswordHash)?;
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(ApiError::PasswordHash)
}

pub fn verify_password(password_hash: &str, password: &str) -> bool {
    let Ok(parsed) = PasswordHash::new(password_hash) else {
        return false;
    };
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed)
        .is_ok()
}

/// Hash that is verified for unknown usernames so the response time
/// does not reveal whether an account exists.
fn dummy_hash() -> &'static str {
    static DUMMY: OnceLock<String> = OnceLock::new();
    DUMMY.get_or_init(|| hash_password("dummy-password-for-timing").expect("hashing works"))
}

// --- sessions ---------------------------------------------------------

fn hex_encode(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn token_hash(token: &str) -> String {
    hex_encode(&Sha256::digest(token.as_bytes()))
}

pub async fn create_session(pool: &SqlitePool, user_id: &str) -> Result<String, ApiError> {
    let token = hex_encode(&rand::random::<[u8; 32]>());
    let now = Utc::now();
    let expires = now + ChronoDuration::days(SESSION_TTL_DAYS);

    sqlx::query(
        "INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
    )
    .bind(token_hash(&token))
    .bind(user_id)
    .bind(now.to_rfc3339())
    .bind(expires.to_rfc3339())
    .execute(pool)
    .await?;

    Ok(token)
}

async fn user_for_token(pool: &SqlitePool, token: &str) -> Result<Option<UserRow>, ApiError> {
    let user = sqlx::query_as::<_, UserRow>(
        "SELECT users.id, users.username, users.password_hash, users.role, users.created_at
         FROM sessions JOIN users ON users.id = sessions.user_id
         WHERE sessions.token_hash = ? AND sessions.expires_at > ?",
    )
    .bind(token_hash(token))
    .bind(Utc::now().to_rfc3339())
    .fetch_optional(pool)
    .await?;
    Ok(user)
}

fn session_cookie(token: String, secure: bool, max_age_seconds: i64) -> Cookie<'static> {
    let mut cookie = Cookie::new(SESSION_COOKIE, token);
    cookie.set_http_only(true);
    cookie.set_same_site(SameSite::Strict);
    cookie.set_secure(secure);
    cookie.set_path("/");
    cookie.set_max_age(time::Duration::seconds(max_age_seconds));
    cookie
}

// --- extractor --------------------------------------------------------

/// Extracted for every authenticated route; rejects with 401 when the
/// session cookie is missing, unknown, or expired.
pub struct AuthSession {
    pub user: UserResponse,
    pub token: String,
}

impl AuthSession {
    pub fn require_role(&self, role: Role) -> Result<(), ApiError> {
        if self.user.role == role {
            Ok(())
        } else {
            Err(ApiError::Forbidden)
        }
    }
}

impl FromRequestParts<AppState> for AuthSession {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let jar = CookieJar::from_headers(&parts.headers);
        let token = jar
            .get(SESSION_COOKIE)
            .map(|cookie| cookie.value().to_string())
            .ok_or(ApiError::Unauthorized)?;

        let user = user_for_token(&state.pool, &token)
            .await?
            .ok_or(ApiError::Unauthorized)?;

        Ok(AuthSession {
            user: user.into_response()?,
            token,
        })
    }
}

/// `Option<AuthSession>` yields `None` for missing/invalid sessions but
/// still surfaces real database errors.
impl OptionalFromRequestParts<AppState> for AuthSession {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Option<Self>, Self::Rejection> {
        let jar = CookieJar::from_headers(&parts.headers);
        let Some(token) = jar
            .get(SESSION_COOKIE)
            .map(|cookie| cookie.value().to_string())
        else {
            return Ok(None);
        };

        let Some(user) = user_for_token(&state.pool, &token).await? else {
            return Ok(None);
        };

        Ok(Some(AuthSession {
            user: user.into_response()?,
            token,
        }))
    }
}

// --- bootstrap --------------------------------------------------------

/// Creates the initial admin account when the users table is empty and
/// the credentials are configured. Without it the API has no usable
/// login, which is logged loudly.
pub async fn ensure_initial_admin(
    pool: &SqlitePool,
    config: &crate::config::ServerConfig,
) -> Result<(), ApiError> {
    let user_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users")
        .fetch_one(pool)
        .await?;
    if user_count > 0 {
        return Ok(());
    }

    let (Some(username), Some(password)) = (
        config.initial_admin_username.as_deref(),
        config.initial_admin_password.as_ref(),
    ) else {
        tracing::warn!(
            "users table is empty and IMPEDANZ_INITIAL_ADMIN_USERNAME/_PASSWORD are not set — \
             nobody can log in to the API"
        );
        return Ok(());
    };

    let now = Utc::now().to_rfc3339();
    sqlx::query(
        "INSERT INTO users (id, username, password_hash, role, created_at, updated_at)
         VALUES (?, ?, ?, 'admin', ?, ?)",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(username)
    .bind(hash_password(&password.0)?)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await?;

    tracing::info!(username, "created initial admin account");
    Ok(())
}

// --- handlers ---------------------------------------------------------

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

#[utoipa::path(
    post,
    path = "/auth/login",
    tag = "auth",
    request_body = LoginRequest,
    responses(
        (status = OK, description = "Logged in; session cookie is set", body = UserResponse),
        (status = UNAUTHORIZED, description = "Unknown username or wrong password", body = crate::errors::ErrorBody)
    )
)]
pub async fn login(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(request): Json<LoginRequest>,
) -> Result<(CookieJar, Json<UserResponse>), ApiError> {
    let user = sqlx::query_as::<_, UserRow>(
        "SELECT id, username, password_hash, role, created_at FROM users WHERE username = ?",
    )
    .bind(request.username.trim())
    .fetch_optional(&state.pool)
    .await?;

    let Some(user) = user else {
        // equalize timing with the real verification path
        verify_password(dummy_hash(), &request.password);
        tokio::time::sleep(FAILED_LOGIN_DELAY).await;
        return Err(ApiError::Unauthorized);
    };

    if !verify_password(&user.password_hash, &request.password) {
        tokio::time::sleep(FAILED_LOGIN_DELAY).await;
        return Err(ApiError::Unauthorized);
    }

    // opportunistic cleanup of expired sessions
    sqlx::query("DELETE FROM sessions WHERE expires_at <= ?")
        .bind(Utc::now().to_rfc3339())
        .execute(&state.pool)
        .await?;

    let token = create_session(&state.pool, &user.id).await?;
    let cookie = session_cookie(
        token,
        state.config.cookie_secure,
        SESSION_TTL_DAYS * 24 * 60 * 60,
    );

    tracing::info!(username = %user.username, "user logged in");
    Ok((jar.add(cookie), Json(user.into_response()?)))
}

#[utoipa::path(
    post,
    path = "/auth/logout",
    tag = "auth",
    security(("session" = [])),
    responses(
        (status = NO_CONTENT, description = "Session terminated"),
        (status = UNAUTHORIZED, description = "Not logged in", body = crate::errors::ErrorBody)
    )
)]
pub async fn logout(
    State(state): State<AppState>,
    session: AuthSession,
    jar: CookieJar,
) -> Result<(CookieJar, axum::http::StatusCode), ApiError> {
    sqlx::query("DELETE FROM sessions WHERE token_hash = ?")
        .bind(token_hash(&session.token))
        .execute(&state.pool)
        .await?;

    let removal = session_cookie(String::new(), state.config.cookie_secure, 0);
    Ok((jar.add(removal), axum::http::StatusCode::NO_CONTENT))
}

#[utoipa::path(
    get,
    path = "/auth/me",
    tag = "auth",
    security(("session" = [])),
    responses(
        (status = OK, description = "The logged-in user", body = UserResponse),
        (status = UNAUTHORIZED, description = "Not logged in", body = crate::errors::ErrorBody)
    )
)]
pub async fn me(session: AuthSession) -> Json<UserResponse> {
    Json(session.user)
}

#[utoipa::path(
    put,
    path = "/auth/password",
    tag = "auth",
    security(("session" = [])),
    request_body = ChangePasswordRequest,
    responses(
        (status = OK, description = "Password changed; all other sessions are revoked", body = UserResponse),
        (status = UNAUTHORIZED, description = "Current password is wrong", body = crate::errors::ErrorBody),
        (status = UNPROCESSABLE_ENTITY, description = "New password too weak", body = crate::errors::ErrorBody)
    )
)]
pub async fn change_password(
    State(state): State<AppState>,
    session: AuthSession,
    jar: CookieJar,
    Json(request): Json<ChangePasswordRequest>,
) -> Result<(CookieJar, Json<UserResponse>), ApiError> {
    validate_password(&request.new_password)?;

    let user_id = session.user.id.to_string();
    let current_hash: String = sqlx::query_scalar("SELECT password_hash FROM users WHERE id = ?")
        .bind(&user_id)
        .fetch_one(&state.pool)
        .await?;

    if !verify_password(&current_hash, &request.current_password) {
        tokio::time::sleep(FAILED_LOGIN_DELAY).await;
        return Err(ApiError::Unauthorized);
    }

    sqlx::query("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?")
        .bind(hash_password(&request.new_password)?)
        .bind(Utc::now().to_rfc3339())
        .bind(&user_id)
        .execute(&state.pool)
        .await?;

    // revoke every session (including this one) and hand out a new one
    sqlx::query("DELETE FROM sessions WHERE user_id = ?")
        .bind(&user_id)
        .execute(&state.pool)
        .await?;
    let token = create_session(&state.pool, &user_id).await?;
    let cookie = session_cookie(
        token,
        state.config.cookie_secure,
        SESSION_TTL_DAYS * 24 * 60 * 60,
    );

    Ok((jar.add(cookie), Json(session.user)))
}

pub fn validate_password(password: &str) -> Result<(), ApiError> {
    if password.chars().count() < 12 {
        return Err(ApiError::Validation(String::from(
            "password must be at least 12 characters long",
        )));
    }
    Ok(())
}

pub fn validate_username(username: &str) -> Result<(), ApiError> {
    let length = username.chars().count();
    if !(3..=32).contains(&length) {
        return Err(ApiError::Validation(String::from(
            "username must be between 3 and 32 characters",
        )));
    }
    if !username
        .chars()
        .all(|character| character.is_ascii_alphanumeric() || matches!(character, '.' | '_' | '-'))
    {
        return Err(ApiError::Validation(String::from(
            "username may only contain a-z, 0-9, '.', '_' and '-'",
        )));
    }
    Ok(())
}
