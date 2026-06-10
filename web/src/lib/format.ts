import type { Locale } from "../i18n";
import { t } from "../i18n";

const dayFormatters = new Map<string, Intl.DateTimeFormat>();
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const timeFormatters = new Map<string, Intl.DateTimeFormat>();

function formatter(
    cache: Map<string, Intl.DateTimeFormat>,
    locale: Locale,
    options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat {
    const intlLocale = t(locale).intlLocale;
    let cached = cache.get(intlLocale);
    if (!cached) {
        cached = new Intl.DateTimeFormat(intlLocale, { ...options, timeZone: "Europe/Berlin" });
        cache.set(intlLocale, cached);
    }
    return cached;
}

export function formatDay(date: Date, locale: Locale): string {
    return formatter(dayFormatters, locale, { weekday: "short" })
        .format(date)
        .toLowerCase()
        .replace(".", "");
}

export function formatDate(date: Date, locale: Locale): string {
    return formatter(dateFormatters, locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(date);
}

export function formatTime(date: Date, locale: Locale): string {
    return formatter(timeFormatters, locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).format(date);
}

export function formatRange(start: Date, end: Date, locale: Locale): string {
    return `${formatDay(start, locale)} ${formatDate(start, locale)} · ${formatTime(start, locale)}–${formatTime(end, locale)}`;
}

export function formatCoordinates(latitude: number, longitude: number): string {
    return `${latitude.toFixed(4)}°n ${longitude.toFixed(4)}°e`;
}
