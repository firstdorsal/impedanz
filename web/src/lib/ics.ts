import { site } from "../data/site";
import type { ImpedanzEvent } from "./../data/types";

function icsTimestamp(date: Date): string {
    return date
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "");
}

function escapeText(value: string): string {
    return value
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\r?\n/g, "\\n");
}

// RFC 5545: lines longer than 75 octets must be folded.
function foldLine(line: string): string {
    const chunks: string[] = [];
    let rest = line;
    while (rest.length > 73) {
        chunks.push(rest.slice(0, 73));
        rest = " " + rest.slice(73);
    }
    chunks.push(rest);
    return chunks.join("\r\n");
}

export function eventToIcs(event: ImpedanzEvent): string {
    const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//IMPEDANZ//impedanz.net//DE",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        `UID:${event.slug}@impedanz.net`,
        `DTSTAMP:${icsTimestamp(event.dateTimeStart)}`,
        `DTSTART:${icsTimestamp(event.dateTimeStart)}`,
        `DTEND:${icsTimestamp(event.dateTimeEnd)}`,
        `SUMMARY:${escapeText(`IMPEDANZ — ${event.title}`)}`,
        ...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
        `LOCATION:${escapeText(`${event.location.name}, ${event.location.city}`)}`,
        `GEO:${event.location.latitude};${event.location.longitude}`,
        `URL:${site.url}/events/${event.slug}/`,
        "END:VEVENT",
        "END:VCALENDAR"
    ];

    return lines.map(foldLine).join("\r\n") + "\r\n";
}
