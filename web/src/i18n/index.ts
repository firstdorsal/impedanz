// Typed translations. German is the default locale and lives at /,
// English at /en/. Legal pages (Impressum/Datenschutz) stay German —
// they are the legally authoritative texts.

export const locales = ["de", "en"] as const;
export type Locale = (typeof locales)[number];

export interface Translations {
    readonly intlLocale: string;
    readonly ogLocale: string;

    readonly homeTitle: string;
    readonly homeDescription: string;
    readonly siteDescription: string;

    readonly tagline: string;
    readonly nextPrefix: string;
    readonly nextTba: string;
    readonly tickerCollective: string;
    readonly tickerClosing: string;

    readonly upcomingTitle: string;
    readonly upcomingEmptyTitle: string;
    readonly upcomingNote: string;
    readonly tbaText: string;
    readonly tbaTextContact: string;

    readonly archiveTitle: string;
    readonly archiveNote: (count: number) => string;

    readonly collectiveTitle: string;
    readonly collectiveNote: string;
    readonly collectiveIntro: string;
    readonly collectiveClaim: string;
    readonly regularsLabel: string;

    readonly awarenessNote: string;
    readonly awarenessIntro: string;
    readonly awarenessContact: string;
    readonly awarenessCta: string;
    readonly awarenessPrinciples: readonly { title: string; text: string }[];

    readonly bookingTitle: string;
    readonly bookingNote: string;
    readonly bookingHeadline: string;
    readonly bookingText: string;
    readonly bookingCta: string;
    readonly bookingInstagram: string;

    readonly eventAllEvents: string;
    readonly eventArchived: string;
    readonly eventArchivedBadge: string;
    readonly eventDate: string;
    readonly eventDoors: string;
    readonly eventLocation: string;
    readonly eventGenre: string;
    readonly eventActs: string;
    readonly eventNoAgeRestriction: string;
    readonly eventTickets: string;
    readonly eventDetails: string;
    readonly eventIcalTitle: string;
    readonly eventMetaDescription: (title: string, venue: string, genre: string) => string;

    readonly footerLegal: string;
    readonly footerPrivacy: string;
    readonly languageSwitch: string;

    readonly notFoundTitle: string;
    readonly notFoundHeading: string;
    readonly notFoundText: string;
    readonly notFoundBack: string;
}

const de: Translations = {
    intlLocale: "de-DE",
    ogLocale: "de_DE",

    homeTitle: "IMPEDANZ — Techno-Kollektiv Augsburg",
    homeDescription:
        "IMPEDANZ ist ein Techno-Kollektiv aus Augsburg. Hypnotic, Minimal und Hardgroove — Events mit Fokus auf Sound, Detail und Awareness. Alle Events, Lineups und Infos.",
    siteDescription:
        "IMPEDANZ ist ein Techno-Kollektiv aus Augsburg. Hypnotic, Minimal und Hardgroove — Events mit Fokus auf Sound, Detail und Awareness.",

    tagline: "techno-kollektiv · augsburg",
    nextPrefix: "next",
    nextTba: "next transmission: tba",
    tickerCollective: "techno-kollektiv augsburg",
    tickerClosing: "driven by detail · shaped by sound · grounded in awareness",

    upcomingTitle: "upcoming",
    upcomingEmptyTitle: "next transmission",
    upcomingNote: "kommende events",
    tbaText: "Das nächste Event ist noch nicht angekündigt. Es lohnt sich, wiederzukommen —",
    tbaTextContact: "oder schreib uns direkt:",

    archiveTitle: "archiv",
    archiveNote: (count) => `${count} messungen abgeschlossen`,

    collectiveTitle: "kollektiv",
    collectiveNote: "wer wir sind",
    collectiveIntro:
        "IMPEDANZ ist ein Techno-Kollektiv aus Augsburg. Wir veranstalten Events mit Fokus auf Sound, Detail und Awareness — hypnotisch, minimal, hardgroove. Was als Impuls begann, ist eine Messreihe geworden: Jedes Event eine eigene Frequenz, jeder Floor ein eigener Schwingkreis.",
    collectiveClaim: "Widerstand ist frequenzabhängig. Wir auch.",
    regularsLabel: "öfter bei uns am pult",

    awarenessNote: "safer space, kein nice-to-have",
    awarenessIntro:
        "Eine gute Nacht funktioniert nur, wenn sich alle sicher fühlen. Awareness ist bei uns kein Aufkleber am Eingang, sondern Teil der Planung jedes Events: vom Line-up über das Personal bis zur Rückzugsmöglichkeit.",
    awarenessContact:
        "Wenn dir auf einem unserer Events etwas passiert oder du dich unwohl fühlst: Wende dich an unser Awareness-Team, an die Bar oder direkt an uns. Dir wird geglaubt, du bestimmst, was als Nächstes passiert — und ob überhaupt etwas passiert.",
    awarenessCta: "auch im nachhinein: schreib uns →",
    awarenessPrinciples: [
        {
            title: "konsens",
            text: "Nur ja heißt ja. Das gilt fürs Tanzen, fürs Anfassen, fürs Ansprechen, fürs Fotografieren. Wer ein Nein nicht akzeptiert, fliegt."
        },
        {
            title: "keine diskriminierung",
            text: "Rassismus, Sexismus, Queerfeindlichkeit, Transfeindlichkeit, Ableismus und jede andere Form von Abwertung haben auf unseren Floors keinen Platz."
        },
        {
            title: "aufeinander achten",
            text: "Schau hin, nicht weg. Wenn jemand neben dir Hilfe braucht — wegen Substanzen, Überforderung oder anderen Menschen — hol uns oder das Personal."
        },
        {
            title: "keine fotos ohne zustimmung",
            text: "Der Floor ist ein Schutzraum. Fotografiere und filme niemanden ohne ausdrückliches Okay. In manchen Locations ist Fotografieren außerdem generell verboten — die Hausregeln gelten immer."
        },
        {
            title: "dein tempo",
            text: "Niemand muss irgendetwas. Pausen sind gut, Wasser ist besser, und der Heimweg ist keine Niederlage."
        }
    ],

    bookingTitle: "booking",
    bookingNote: "cta für djs",
    bookingHeadline: "du legst auf",
    bookingText:
        "Wir suchen immer nach neuen Signalen. Schick uns deinen Mix, dein Set, deine SoundCloud — wenn es schwingt, stehst du beim nächsten Event mit am Pult.",
    bookingCta: "mix einsenden →",
    bookingInstagram: "oder via instagram",

    eventAllEvents: "← alle events",
    eventArchived: " · archiviert",
    eventArchivedBadge: "archiv",
    eventDate: "datum",
    eventDoors: "einlass",
    eventLocation: "location",
    eventGenre: "genre",
    eventActs: "acts",
    eventNoAgeRestriction: "keine altersbeschränkung",
    eventTickets: "tickets →",
    eventDetails: "details →",
    eventIcalTitle: "ICS-Datei herunterladen (zum Kalender hinzufügen)",
    eventMetaDescription: (title, venue, genre) =>
        `IMPEDANZ ${title} — Techno-Event in Augsburg im ${venue}. ${genre}.`,

    footerLegal: "impressum",
    footerPrivacy: "datenschutz",
    languageSwitch: "english",

    notFoundTitle: "404 — IMPEDANZ",
    notFoundHeading: "kein signal",
    notFoundText:
        "Auf dieser Frequenz sendet nichts. Die Seite existiert nicht oder wurde verschoben.",
    notFoundBack: "zurück zum start →"
};

const en: Translations = {
    intlLocale: "en-GB",
    ogLocale: "en_GB",

    homeTitle: "IMPEDANZ — Techno Collective Augsburg",
    homeDescription:
        "IMPEDANZ is a techno collective from Augsburg, Germany. Hypnotic, minimal and hardgroove — events focused on sound, detail and awareness. All events, lineups and info.",
    siteDescription:
        "IMPEDANZ is a techno collective from Augsburg, Germany. Hypnotic, minimal and hardgroove — events focused on sound, detail and awareness.",

    tagline: "techno collective · augsburg",
    nextPrefix: "next",
    nextTba: "next transmission: tba",
    tickerCollective: "techno collective augsburg",
    tickerClosing: "driven by detail · shaped by sound · grounded in awareness",

    upcomingTitle: "upcoming",
    upcomingEmptyTitle: "next transmission",
    upcomingNote: "upcoming events",
    tbaText: "The next event hasn't been announced yet. Worth checking back —",
    tbaTextContact: "or write to us directly:",

    archiveTitle: "archive",
    archiveNote: (count) => `${count} measurements completed`,

    collectiveTitle: "collective",
    collectiveNote: "who we are",
    collectiveIntro:
        "IMPEDANZ is a techno collective from Augsburg. We organize events focused on sound, detail and awareness — hypnotic, minimal, hardgroove. What started as an impulse has become a series of measurements: every event its own frequency, every floor its own resonant circuit.",
    collectiveClaim: "Resistance depends on frequency. So do we.",
    regularsLabel: "regulars behind the decks",

    awarenessNote: "safer space, not a nice-to-have",
    awarenessIntro:
        "A good night only works if everyone feels safe. For us, awareness is not a sticker at the entrance but part of planning every event: from the line-up to the staff to a place to retreat to.",
    awarenessContact:
        "If something happens to you at one of our events or you feel unsafe: reach out to our awareness team, the bar staff or us directly. You will be believed, and you decide what happens next — and whether anything happens at all.",
    awarenessCta: "also after the fact: write to us →",
    awarenessPrinciples: [
        {
            title: "consent",
            text: "Only yes means yes. That goes for dancing, touching, approaching people and taking pictures. Anyone who can't accept a no is out."
        },
        {
            title: "no discrimination",
            text: "Racism, sexism, queerphobia, transphobia, ableism and every other form of degradation have no place on our floors."
        },
        {
            title: "look out for each other",
            text: "Look, don't look away. If someone next to you needs help — because of substances, overwhelm or other people — get us or the staff."
        },
        {
            title: "no photos without consent",
            text: "The floor is a safe space. Don't photograph or film anyone without an explicit okay. Some venues prohibit photography altogether — house rules always apply."
        },
        {
            title: "your pace",
            text: "Nobody has to do anything. Breaks are good, water is better, and heading home is not a defeat."
        }
    ],

    bookingTitle: "booking",
    bookingNote: "call for djs",
    bookingHeadline: "you dj",
    bookingText:
        "We're always scanning for new signals. Send us your mix, your set, your SoundCloud — if it resonates, you'll be behind the decks at one of our next events.",
    bookingCta: "send your mix →",
    bookingInstagram: "or via instagram",

    eventAllEvents: "← all events",
    eventArchived: " · archived",
    eventArchivedBadge: "archive",
    eventDate: "date",
    eventDoors: "doors",
    eventLocation: "location",
    eventGenre: "genre",
    eventActs: "acts",
    eventNoAgeRestriction: "no age restriction",
    eventTickets: "tickets →",
    eventDetails: "details →",
    eventIcalTitle: "Download ICS file (add to calendar)",
    eventMetaDescription: (title, venue, genre) =>
        `IMPEDANZ ${title} — techno event in Augsburg, Germany at ${venue}. ${genre}.`,

    footerLegal: "impressum",
    footerPrivacy: "privacy",
    languageSwitch: "deutsch",

    notFoundTitle: "404 — IMPEDANZ",
    notFoundHeading: "no signal",
    notFoundText: "Nothing transmits on this frequency. The page doesn't exist or has moved.",
    notFoundBack: "back to start →"
};

const translations: Record<Locale, Translations> = { de, en };

export function t(locale: Locale): Translations {
    return translations[locale];
}

export function resolveLocale(value: string | undefined): Locale {
    return value === "en" ? "en" : "de";
}

/// Prefixes a site-absolute path with the locale segment.
export function localePath(locale: Locale, path: string): string {
    if (locale === "de") return path;
    return path === "/" ? "/en/" : `/en${path}`;
}
