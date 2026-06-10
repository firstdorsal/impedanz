# impedanz.net

Website des IMPEDANZ Techno-Kollektivs (Augsburg). Statische Astro-Seite,
geserved von einem eigenen Axum-Backend, SEO-first: alle Inhalte als
vorgerendertes HTML, zweisprachig (de unter `/`, en unter `/en/`), JSON-LD
(`MusicEvent` + `PerformingGroup`), hreflang, Sitemap, OpenGraph,
optimierte Bilder.

## Stack

- [Astro 6](https://astro.build) (statischer Output, kein Client-JS außer
  Hero-Oszilloskop und `/visuals/`)
- Tailwind CSS 4 (`@tailwindcss/vite`)
- Space Mono + Open Sans, self-hosted via `@fontsource`
- Three.js + postprocessing für die `/visuals/`-Seite
- [`server/`](server/): Rust/Axum-Backend (`impedanz-server`), serviert
  `dist/` mit CSP/HSTS/Caching/Kompression (gzip, deflate, br, zstd),
  dual-stack auf `[::]:80`. API-Fundament mit utoipa/OpenAPI:
  `/api/health`, `/api/openapi.json`, Swagger UI unter `/api/docs`.
  Hier entsteht die Mitglieder-API zum Veröffentlichen von Events.

## Entwicklung

```sh
pnpm install
pnpm dev      # astro dev server
pnpm build    # astro check + production build nach dist/
pnpm format   # prettier

# backend (serviert dist/, daher vorher pnpm build):
cd server
IMPEDANZ_BIND_ADDRESS="[::]:8080" IMPEDANZ_PUBLIC_DIR=../dist cargo run
```

Konfiguration des Backends: eine YAML-Datei (`server/config.yaml`, im
Container nach `/config.yaml` gemountet bzw. eingebacken). Alle
Umgebungsvariablen werden zentral in `server/src/config.rs` gelesen und
sind dort dokumentiert; jede unterstützt die `_FILE`-Suffix-Konvention.

## Inhalte pflegen

| Was                                 | Wo                                                  |
| ----------------------------------- | --------------------------------------------------- |
| Events (inkl. Lineup, Links)        | `src/data/events.ts` + Artwork `src/assets/events/` |
| Crew & Rollen                       | `src/data/crew.ts`                                  |
| Kontakt, Instagram, Impressumsdaten | `src/data/site.ts`                                  |
| Alle Texte beider Sprachen          | `src/i18n/index.ts`                                 |

Events bekommen ihre Seriennummer (`za-00n`) automatisch aus der
chronologischen Reihenfolge. Vergangene/kommende Events werden zur
Buildzeit getrennt — die Seite wird bei jedem Release neu gebaut, deshalb
kann das nicht veralten. Pro Event entstehen `/events/<slug>/`,
`/en/events/<slug>/` und `/events/<slug>.ics` (Kalender-Download).

Impressum (`/impressum/`) und Datenschutz (`/datenschutz/`) sind bewusst
nur auf Deutsch — sie sind die rechtlich maßgeblichen Texte.

## Build & Deployment

```sh
bash build.sh                      # baut ghcr.io/firstdorsal/impedanz-web:local
APP_STAGE_IMAGE=alpine bash build.sh   # debugbare Variante mit Shell
```

Multi-Stage-Build: Node baut `dist/`, muslrust baut das statisch
gelinkte, upx-komprimierte `impedanz-server`-Binary, Finalimage ist
`scratch`. CI (`.github/workflows/build-web.yml`) pusht bei `v*`-Tags
nach GHCR; Deployment per mows-cli/mpm aus `../deployment`.

Hinweis: Der frühere Static-Server (pektin/feoco) konnte keine
verschachtelten `index.html`-Pfade auflösen und hätte alle Unterseiten
als Soft-404 (Startseite mit Status 200) ausgeliefert — daher das eigene
Backend.
