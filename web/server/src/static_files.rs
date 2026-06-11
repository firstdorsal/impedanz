//! Serves the static Astro build with the security headers and cache
//! rules the site relies on (the CSP here is why the Astro config sets
//! `build.inlineStylesheets: "never"`).

use std::convert::Infallible;
use std::path::Path;

use axum::body::{Body, Bytes};
use axum::http::{header, HeaderValue, Request, Response, StatusCode};
use axum::middleware::{self, Next};
use axum::Router;
use tower_http::services::ServeDir;

#[derive(Debug, thiserror::Error)]
pub enum StaticFilesError {
    #[error("failed to read 404 page {path}: {source}")]
    NotFoundPage {
        path: String,
        source: std::io::Error,
    },
}

const STRICT_TRANSPORT_SECURITY: HeaderValue =
    HeaderValue::from_static("max-age=315360000; includeSubdomains; preload");
const CONTENT_SECURITY_POLICY: HeaderValue = HeaderValue::from_static(
    "default-src 'none'; script-src 'self'; style-src 'self'; manifest-src 'self'; \
     connect-src 'self'; img-src 'self'; font-src 'self'; base-uri 'none'; \
     form-action 'none'; frame-ancestors 'none'",
);
// microphone=(self) is required by the audio-reactive /visuals/ page
const PERMISSIONS_POLICY: HeaderValue = HeaderValue::from_static(
    "accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), \
     display-capture=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), \
     magnetometer=(), microphone=(self), midi=(), payment=(), picture-in-picture=(), \
     publickey-credentials-get=(), screen-wake-lock=(), serial=(), usb=(), web-share=(), \
     xr-spatial-tracking=()",
);
const X_FRAME_OPTIONS: HeaderValue = HeaderValue::from_static("DENY");
const X_CONTENT_TYPE_OPTIONS: HeaderValue = HeaderValue::from_static("nosniff");
const X_PERMITTED_CROSS_DOMAIN_POLICIES: HeaderValue = HeaderValue::from_static("none");
const REFERRER_POLICY: HeaderValue = HeaderValue::from_static("no-referrer");

/// Astro content-hashes everything under /_astro/, so those files can be
/// cached forever; documents and other unhashed files revalidate quickly.
const CACHE_IMMUTABLE: HeaderValue =
    HeaderValue::from_static("public, max-age=31536000, immutable");
const CACHE_SHORT: HeaderValue = HeaderValue::from_static("public, max-age=300, must-revalidate");

pub async fn router(public_dir: &Path) -> Result<Router, StaticFilesError> {
    let not_found_path = public_dir.join("404.html");
    let not_found_page: Bytes = tokio::fs::read(&not_found_path)
        .await
        .map_err(|source| StaticFilesError::NotFoundPage {
            path: not_found_path.display().to_string(),
            source,
        })?
        .into();

    // ServeDir's not_found_service would reply 200 — serve the Astro
    // 404 page with a real 404 status instead.
    let not_found_service = tower::service_fn(move |_request: Request<Body>| {
        let page = not_found_page.clone();
        async move {
            Ok::<_, Infallible>(
                Response::builder()
                    .status(StatusCode::NOT_FOUND)
                    .header(
                        header::CONTENT_TYPE,
                        HeaderValue::from_static("text/html; charset=utf-8"),
                    )
                    .body(Body::from(page))
                    .expect("static 404 response is always valid"),
            )
        }
    });

    let serve_dir = ServeDir::new(public_dir)
        .append_index_html_on_directories(true)
        .not_found_service(not_found_service);

    Ok(Router::new()
        .fallback_service(serve_dir)
        .layer(middleware::from_fn(apply_headers)))
}

/// For routers that serve only content-addressed files (uploaded media
/// with random names): security headers plus an immutable cache.
pub async fn immutable_headers(request: Request<Body>, next: Next) -> Response<Body> {
    let mut response = next.run(request).await;
    let headers = response.headers_mut();
    headers.insert(header::STRICT_TRANSPORT_SECURITY, STRICT_TRANSPORT_SECURITY);
    headers.insert(header::X_FRAME_OPTIONS, X_FRAME_OPTIONS);
    headers.insert(header::X_CONTENT_TYPE_OPTIONS, X_CONTENT_TYPE_OPTIONS);
    headers.insert(header::REFERRER_POLICY, REFERRER_POLICY);
    headers.insert(header::CACHE_CONTROL, CACHE_IMMUTABLE);
    response
}

async fn apply_headers(request: Request<Body>, next: Next) -> Response<Body> {
    let is_hashed_asset = request.uri().path().starts_with("/_astro/");
    let mut response = next.run(request).await;

    let is_html = response
        .headers()
        .get(header::CONTENT_TYPE)
        .is_some_and(|value| value.as_bytes().starts_with(b"text/html"));

    let headers = response.headers_mut();
    headers.insert(header::STRICT_TRANSPORT_SECURITY, STRICT_TRANSPORT_SECURITY);
    headers.insert(header::X_FRAME_OPTIONS, X_FRAME_OPTIONS);
    headers.insert(header::X_CONTENT_TYPE_OPTIONS, X_CONTENT_TYPE_OPTIONS);
    headers.insert(
        "x-permitted-cross-domain-policies",
        X_PERMITTED_CROSS_DOMAIN_POLICIES,
    );
    headers.insert(header::REFERRER_POLICY, REFERRER_POLICY);
    headers.insert("permissions-policy", PERMISSIONS_POLICY);

    if is_html {
        headers.insert(header::CONTENT_SECURITY_POLICY, CONTENT_SECURITY_POLICY);
    }

    headers.insert(
        header::CACHE_CONTROL,
        if is_hashed_asset {
            CACHE_IMMUTABLE
        } else {
            CACHE_SHORT
        },
    );

    response
}
