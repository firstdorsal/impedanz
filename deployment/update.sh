#!/bin/bash
# Pulls the latest impedanz-web image and recreates the container.
# Run on the server after the GitHub pipeline finished.
#
# The -p and --env-file flags matter: mpm deploys under the project
# name "impedanz" and injects the secret env files — a bare
# `docker compose up` in results/ would use the project "results",
# not find the running container (name conflict) and lose the
# bootstrap admin variables.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/results"

COMPOSE=(docker compose -p impedanz
    --env-file provided-secrets.env
    --env-file generated-secrets.env)

"${COMPOSE[@]}" pull web
"${COMPOSE[@]}" up -d web

sleep 2
docker ps --format '{{.Names}}\t{{.Status}}' | grep impedanz-web
docker logs impedanz-web 2>&1 | tail -3
