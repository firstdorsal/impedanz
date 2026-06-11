import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
    site: "https://impedanz.net",
    trailingSlash: "ignore",
    i18n: {
        defaultLocale: "de",
        locales: ["de", "en"]
    },
    build: {
        // The production server CSP only allows style-src 'self',
        // so stylesheets must never be inlined into the HTML.
        inlineStylesheets: "never"
    },
    redirects: {
        // Old SPA routes — both live as sections on the start page now.
        "/about/": "/#kollektiv",
        "/awareness/": "/#awareness"
    },
    integrations: [sitemap()],
    vite: {
        plugins: [tailwindcss()],
        build: {
            // The CSP only allows script-src/img-src 'self': nothing may
            // be inlined into the HTML (scripts) or CSS (data: urls) —
            // Astro inlines bundled scripts below this limit otherwise.
            assetsInlineLimit: 0
        }
    }
});
