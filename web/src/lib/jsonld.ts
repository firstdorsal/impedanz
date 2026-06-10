import { site } from "../data/site";
import type { ImpedanzEvent } from "../data/types";
import type { Locale } from "../i18n";
import { t } from "../i18n";

export function organizationSchema(logoUrl: string, locale: Locale): object {
    return {
        "@context": "https://schema.org",
        "@type": "PerformingGroup",
        name: site.name,
        url: site.url,
        logo: logoUrl,
        description: t(locale).siteDescription,
        location: {
            "@type": "City",
            name: site.city
        },
        ...(site.instagram ? { sameAs: [`https://www.instagram.com/${site.instagram}/`] } : {})
    };
}

export function musicEventSchema(event: ImpedanzEvent, imageUrl?: string): object {
    const performers = event.acts
        .flatMap((act) => act.artists)
        .map((artist) => ({
            "@type": "MusicGroup",
            name: artist.name,
            ...(artist.url ? { sameAs: [artist.url] } : {})
        }));

    return {
        "@context": "https://schema.org",
        "@type": "MusicEvent",
        name: `${site.name} — ${event.title}`,
        startDate: event.dateTimeStart.toISOString(),
        endDate: event.dateTimeEnd.toISOString(),
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        ...(event.description ? { description: event.description } : {}),
        ...(imageUrl ? { image: [imageUrl] } : {}),
        location: {
            "@type": "Place",
            name: event.location.name,
            address: {
                "@type": "PostalAddress",
                addressLocality: event.location.city,
                addressCountry: "DE"
            },
            geo: {
                "@type": "GeoCoordinates",
                latitude: event.location.latitude,
                longitude: event.location.longitude
            }
        },
        organizer: {
            "@type": "PerformingGroup",
            name: site.name,
            url: site.url
        },
        ...(performers.length > 0 ? { performer: performers } : {}),
        ...(event.ticketLink
            ? {
                  offers: {
                      "@type": "Offer",
                      url: event.ticketLink,
                      availability: "https://schema.org/InStock"
                  }
              }
            : {})
    };
}
