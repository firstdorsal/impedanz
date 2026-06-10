#!/bin/bash
# Local build of the impedanz-web image — CI must produce the exact same
# artifact by calling this same docker build.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

IMAGE="${IMAGE:-ghcr.io/firstdorsal/impedanz-web}"
TAG="${TAG:-local}"
# set APP_STAGE_IMAGE=alpine for a debuggable image with a shell
APP_STAGE_IMAGE="${APP_STAGE_IMAGE:-scratch}"

docker build \
    --build-arg "APP_STAGE_IMAGE=${APP_STAGE_IMAGE}" \
    -t "${IMAGE}:${TAG}" \
    "${SCRIPT_DIR}"

echo "built ${IMAGE}:${TAG}"
