export interface EventLocation {
    readonly name: string;
    readonly city: string;
    readonly latitude: number;
    readonly longitude: number;
}

export interface Artist {
    readonly name: string;
    readonly url?: string;
}

export interface Act {
    readonly artists: Artist[];
    readonly artistJoiner?: string;
    readonly time?: string;
}

export interface ImpedanzEvent {
    readonly slug: string;
    readonly title: string;
    readonly image?: ImageMetadata;
    readonly imageAlt?: string;
    readonly description: string;
    readonly dateTimeStart: Date;
    readonly dateTimeEnd: Date;
    readonly location: EventLocation;
    readonly ticketLink?: string;
    readonly genre: string;
    readonly ageRestriction?: string;
    readonly acts: Act[];
}
