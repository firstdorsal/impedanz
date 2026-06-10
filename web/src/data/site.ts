// Central place for everything about the collective itself.
// Contact channels live ONLY here — pages render them conditionally.
export const site = {
    name: "IMPEDANZ",
    url: "https://impedanz.net",
    // Sichtbare Texte (Tagline, Beschreibung) liegen in src/i18n/index.ts.
    city: "Augsburg",
    coordinates: { latitude: 48.3668, longitude: 10.8986 },
    // TODO(paul): Mailbox anlegen/bestätigen bevor live — zentral hier pflegen.
    bookingEmail: "booking@impedanz.net",
    // Instagram-Handle des Kollektivs; leer lassen = wird nirgends gerendert.
    instagram: "impedanz.kollektiv",
    legalUrl: "/impressum/",
    privacyUrl: "/datenschutz/",
    // Verantwortlicher für Impressum und Datenschutz
    legalContact: {
        name: "Paul Hennig",
        street: "Imhofstraße 12",
        city: "86159 Augsburg",
        country: "Deutschland"
    }
} as const;
