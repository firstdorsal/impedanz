//! User management, admin only. The guards make sure the system can
//! never end up without an admin.

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use chrono::Utc;
use serde::Deserialize;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::auth::{
    hash_password, validate_password, validate_username, AuthSession, Role, UserResponse, UserRow,
};
use crate::errors::ApiError;
use crate::state::AppState;

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateUserRequest {
    pub username: String,
    pub password: String,
    pub role: Role,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserRequest {
    /// New role; omit to keep the current one.
    pub role: Option<Role>,
    /// New password; omit to keep the current one. Setting it revokes
    /// all of the user's sessions.
    pub password: Option<String>,
}

/// Static SELECT with a literal suffix — sqlx 0.9 only accepts
/// `&'static str` SQL, which rules out runtime `format!`.
macro_rules! select_user {
    ($suffix:literal) => {
        concat!(
            "SELECT id, username, password_hash, role, created_at FROM users",
            $suffix
        )
    };
}

async fn admin_count(state: &AppState) -> Result<i64, ApiError> {
    Ok(
        sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE role = 'admin'")
            .fetch_one(&state.pool)
            .await?,
    )
}

#[utoipa::path(
    get,
    path = "/users",
    tag = "users",
    security(("session" = [])),
    responses(
        (status = OK, description = "All users", body = [UserResponse]),
        (status = FORBIDDEN, description = "Requires the admin role", body = crate::errors::ErrorBody)
    )
)]
pub async fn list_users(
    State(state): State<AppState>,
    session: AuthSession,
) -> Result<Json<Vec<UserResponse>>, ApiError> {
    session.require_role(Role::Admin)?;

    let rows = sqlx::query_as::<_, UserRow>(select_user!(" ORDER BY username"))
        .fetch_all(&state.pool)
        .await?;
    rows.into_iter()
        .map(UserRow::into_response)
        .collect::<Result<Vec<_>, _>>()
        .map(Json)
}

#[utoipa::path(
    post,
    path = "/users",
    tag = "users",
    security(("session" = [])),
    request_body = CreateUserRequest,
    responses(
        (status = CREATED, description = "User created", body = UserResponse),
        (status = CONFLICT, description = "Username already taken", body = crate::errors::ErrorBody),
        (status = FORBIDDEN, description = "Requires the admin role", body = crate::errors::ErrorBody),
        (status = UNPROCESSABLE_ENTITY, description = "Validation failed", body = crate::errors::ErrorBody)
    )
)]
pub async fn create_user(
    State(state): State<AppState>,
    session: AuthSession,
    Json(request): Json<CreateUserRequest>,
) -> Result<(StatusCode, Json<UserResponse>), ApiError> {
    session.require_role(Role::Admin)?;

    let username = request.username.trim().to_lowercase();
    validate_username(&username)?;
    validate_password(&request.password)?;

    let existing: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE username = ?")
        .bind(&username)
        .fetch_one(&state.pool)
        .await?;
    if existing > 0 {
        return Err(ApiError::Conflict(format!(
            "username {username:?} is already taken"
        )));
    }

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    sqlx::query(
        "INSERT INTO users (id, username, password_hash, role, created_at, updated_at) \
         VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&username)
    .bind(hash_password(&request.password)?)
    .bind(request.role.as_str())
    .bind(&now)
    .bind(&now)
    .execute(&state.pool)
    .await?;

    tracing::info!(username = %username, role = request.role.as_str(), admin = %session.user.username, "user created");

    let row = sqlx::query_as::<_, UserRow>(select_user!(" WHERE id = ?"))
        .bind(&id)
        .fetch_one(&state.pool)
        .await?;
    Ok((StatusCode::CREATED, Json(row.into_response()?)))
}

#[utoipa::path(
    put,
    path = "/users/{id}",
    tag = "users",
    security(("session" = [])),
    params(("id" = Uuid, Path, description = "User id")),
    request_body = UpdateUserRequest,
    responses(
        (status = OK, description = "User updated", body = UserResponse),
        (status = CONFLICT, description = "Would remove the last admin", body = crate::errors::ErrorBody),
        (status = FORBIDDEN, description = "Requires the admin role", body = crate::errors::ErrorBody),
        (status = NOT_FOUND, description = "No such user", body = crate::errors::ErrorBody)
    )
)]
pub async fn update_user(
    State(state): State<AppState>,
    session: AuthSession,
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateUserRequest>,
) -> Result<Json<UserResponse>, ApiError> {
    session.require_role(Role::Admin)?;

    let id = id.to_string();
    let target = sqlx::query_as::<_, UserRow>(select_user!(" WHERE id = ?"))
        .bind(&id)
        .fetch_optional(&state.pool)
        .await?
        .ok_or(ApiError::NotFound)?;

    if let Some(new_role) = request.role {
        let target_is_admin = target.role == "admin";
        if target_is_admin && new_role == Role::Member && admin_count(&state).await? <= 1 {
            return Err(ApiError::Conflict(String::from(
                "cannot demote the last remaining admin",
            )));
        }
        sqlx::query("UPDATE users SET role = ?, updated_at = ? WHERE id = ?")
            .bind(new_role.as_str())
            .bind(Utc::now().to_rfc3339())
            .bind(&id)
            .execute(&state.pool)
            .await?;
    }

    if let Some(password) = request.password.as_deref() {
        validate_password(password)?;
        sqlx::query("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?")
            .bind(hash_password(password)?)
            .bind(Utc::now().to_rfc3339())
            .bind(&id)
            .execute(&state.pool)
            .await?;
        // a password set by an admin revokes the user's sessions
        sqlx::query("DELETE FROM sessions WHERE user_id = ?")
            .bind(&id)
            .execute(&state.pool)
            .await?;
    }

    tracing::info!(target = %target.username, admin = %session.user.username, "user updated");

    let row = sqlx::query_as::<_, UserRow>(select_user!(" WHERE id = ?"))
        .bind(&id)
        .fetch_one(&state.pool)
        .await?;
    row.into_response().map(Json)
}

#[utoipa::path(
    delete,
    path = "/users/{id}",
    tag = "users",
    security(("session" = [])),
    params(("id" = Uuid, Path, description = "User id")),
    responses(
        (status = NO_CONTENT, description = "User deleted"),
        (status = CONFLICT, description = "Would remove the last admin", body = crate::errors::ErrorBody),
        (status = FORBIDDEN, description = "Requires the admin role", body = crate::errors::ErrorBody),
        (status = NOT_FOUND, description = "No such user", body = crate::errors::ErrorBody)
    )
)]
pub async fn delete_user(
    State(state): State<AppState>,
    session: AuthSession,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, ApiError> {
    session.require_role(Role::Admin)?;

    let id = id.to_string();
    let target = sqlx::query_as::<_, UserRow>(select_user!(" WHERE id = ?"))
        .bind(&id)
        .fetch_optional(&state.pool)
        .await?
        .ok_or(ApiError::NotFound)?;

    if target.role == "admin" && admin_count(&state).await? <= 1 {
        return Err(ApiError::Conflict(String::from(
            "cannot delete the last remaining admin",
        )));
    }

    sqlx::query("DELETE FROM users WHERE id = ?")
        .bind(&id)
        .execute(&state.pool)
        .await?;

    tracing::info!(target = %target.username, admin = %session.user.username, "user deleted");
    Ok(StatusCode::NO_CONTENT)
}
