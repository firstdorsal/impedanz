import { events } from "../data/events";
import type { Artist, ImpedanzEvent } from "../data/types";

// Chronological order defines the series index (za-001, za-002, ...).
export const chronologicalEvents: ImpedanzEvent[] = [...events].sort(
    (a, b) => a.dateTimeStart.getTime() - b.dateTimeStart.getTime()
);

export function seriesIndex(event: ImpedanzEvent): string {
    const position = chronologicalEvents.findIndex((entry) => entry.slug === event.slug) + 1;
    return `za-${String(position).padStart(3, "0")}`;
}

// The split happens at build time. The site is statically generated and
// rebuilt for every release, which is also the cadence at which events
// are added — so a build-time split cannot go stale in practice.
const buildTime = new Date();

export const upcomingEvents: ImpedanzEvent[] = chronologicalEvents.filter(
    (event) => event.dateTimeEnd.getTime() >= buildTime.getTime()
);

export const pastEvents: ImpedanzEvent[] = chronologicalEvents
    .filter((event) => event.dateTimeEnd.getTime() < buildTime.getTime())
    .reverse();

export function eventBySlug(slug: string): ImpedanzEvent | undefined {
    return events.find((event) => event.slug === slug);
}

// Artists that played at least two IMPEDANZ events — derived from the
// actual lineups instead of a manually maintained (and stale) list.
export function regularArtists(): Artist[] {
    const appearances = new Map<string, { artist: Artist; count: number }>();
    for (const event of events) {
        const seenThisEvent = new Set<string>();
        for (const act of event.acts) {
            for (const artist of act.artists) {
                const key = artist.name.toLowerCase();
                if (seenThisEvent.has(key)) continue;
                seenThisEvent.add(key);
                const entry = appearances.get(key);
                if (entry) {
                    entry.count += 1;
                    if (!entry.artist.url && artist.url) {
                        entry.artist = { ...entry.artist, url: artist.url };
                    }
                } else {
                    appearances.set(key, { artist, count: 1 });
                }
            }
        }
    }
    return [...appearances.values()]
        .filter((entry) => entry.count >= 2)
        .sort((a, b) => b.count - a.count)
        .map((entry) => entry.artist);
}
