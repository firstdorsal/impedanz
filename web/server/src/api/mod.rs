//! The IMPEDANZ HTTP API.
//!
//! Today this only exposes a health endpoint plus the OpenAPI document
//! and Swagger UI. The planned member-facing event publishing API will
//! grow here as additional modules (`events`, `auth`, ...), all routed
//! through the same [`OpenApiRouter`] so the OpenAPI spec and generated
//! TypeScript client stay complete.

use axum::{Json, Router};
use serde::Serialize;
use utoipa::{OpenApi, ToSchema};
use utoipa_axum::router::OpenApiRouter;
use utoipa_axum::routes;

#[derive(OpenApi)]
#[openapi(info(
    title = "IMPEDANZ API",
    description = "API of the IMPEDANZ techno collective. Serves the static site and will host member event publishing in the future.",
    license(name = "AGPL-3.0-or-later")
))]
struct ApiDoc;

#[derive(Serialize, ToSchema)]
pub struct HealthResponse {
    /// Always `ok` while the service is able to respond.
    pub status: &'static str,
    /// The crate version of the running server.
    pub version: &'static str,
}

#[utoipa::path(
    get,
    path = "/health",
    tag = "system",
    responses((status = OK, description = "Service is healthy", body = HealthResponse))
)]
async fn get_health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        version: env!("CARGO_PKG_VERSION"),
    })
}

/// Returns the API router (nested under `/api`) and the OpenAPI document
/// describing it.
pub fn router() -> (Router, utoipa::openapi::OpenApi) {
    let (router, openapi) = OpenApiRouter::with_openapi(ApiDoc::openapi())
        .nest("/api", OpenApiRouter::new().routes(routes!(get_health)))
        .split_for_parts();
    (router, openapi)
}
