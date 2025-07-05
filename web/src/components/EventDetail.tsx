import { Component } from "preact";
import { CSSProperties } from "preact/compat";
import ICalendarLink from "react-icalendar-link";
import { IoChevronDown, IoChevronForward, IoTicketOutline } from "react-icons/io5";
import { PiCalendarPlus } from "react-icons/pi";
import { Event } from "../types";
import LocationComp from "./LocationComp";

interface EventDetailProps {
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly event: Event;
}

interface EventDetailState {
    readonly locationExpanded?: boolean;
}

const formatter = new Intl.DateTimeFormat(["ban", "de-de"], {
    weekday: "long",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "numeric"
});

export default class EventDetail extends Component<EventDetailProps, EventDetailState> {
    constructor(props: EventDetailProps) {
        super(props);
        this.state = {
            locationExpanded: false
        };
    }

    componentDidMount = async () => {};

    render = () => {
        const { event } = this.props;
        const start = formatter.format(Number(event.dateTimeStart));
        const end = formatter.format(Number(event.dateTimeEnd));
        return (
            <div
                style={{ ...this.props.style }}
                className={`EventDetail ${this.props.className ?? ""} flex flex-col gap-4 bg-zinc-900 p-6 text-left`}
            >
                <h1 className={"text-6xl font-bold"}>{event.title}</h1>
                {event.imageUrl && (
                    <img
                        src={event.imageUrl}
                        alt={event.imageAlt}
                        className={""}
                        style={{ maxWidth: "100%", height: "auto" }}
                        width={1080}
                        height={1080}
                        loading={"lazy"}
                    />
                )}
                <div className={"flex gap-8 font-bold underline"}>
                    <ICalendarLink
                        event={{
                            title: "IMPEDANZ - " + event.title,
                            description: event.description,
                            location:
                                event.location.name +
                                ", " +
                                event.location.latitude +
                                ", " +
                                event.location.longitude,
                            startTime: event.dateTimeStart.toISOString(),
                            endTime: event.dateTimeEnd.toISOString()
                        }}
                        filename={event.title + ".ics"}
                    >
                        <div
                            className={"flex items-center gap-2"}
                            title={"ICS Datei herunterladen (Zum Kalender hinzufügen)"}
                        >
                            <PiCalendarPlus size={20} />
                            <span>iCal</span>
                        </div>
                    </ICalendarLink>

                    {event.ticketLink && (
                        <div className={"flex items-center gap-2"}>
                            <IoTicketOutline size={20} />

                            <a href={event.ticketLink} rel="no-referrer">
                                Tickets
                            </a>
                        </div>
                    )}
                </div>
                <p>{event.description}</p>
                <div className={"flex flex-col"}>
                    <div>
                        <div className={"opacity-50"}>start</div>
                        <div>{start}</div>
                    </div>
                    <div>
                        <div className={"opacity-50"}>end</div>
                        <div>{end}</div>
                    </div>
                </div>
                <div>
                    <div className={"opacity-50"}>location</div>
                    <div
                        className={"flex cursor-pointer items-center gap-1 underline"}
                        onClick={() => {
                            this.setState({ locationExpanded: !this.state.locationExpanded });
                        }}
                    >
                        <span>{event.location.name}</span>
                        {this.state.locationExpanded ? (
                            <IoChevronDown size={16} />
                        ) : (
                            <IoChevronForward size={16} />
                        )}
                    </div>
                    {this.state.locationExpanded && <LocationComp location={event.location} />}
                </div>
                <div>
                    <div className={"opacity-50"}>genre</div>
                    <div>{event.genre}</div>
                </div>
                <div>
                    <div className={"opacity-50"}>age restriction</div>
                    <div>{event.ageRestriction ?? "None"}</div>
                </div>
                {event.acts && event.acts.length > 0 && (
                    <div>
                        <div className={"opacity-50"}>acts</div>
                        <div className={"flex flex-col gap-4"}>
                            {event.acts?.map((act) => {
                                return (
                                    <div key={act} className={"flex flex-col"}>
                                        {act.time && <span>{act.time}</span>}
                                        <div className={"flex gap-2"}>
                                            {act.artists?.map((artist, index) => {
                                                return (
                                                    <div key={artist.name} className={"flex gap-2"}>
                                                        {index > 0 && (
                                                            <span>{act.artistJoiner}</span>
                                                        )}
                                                        <a
                                                            href={artist.url}
                                                            rel="noreferrer"
                                                            className={
                                                                artist.url ? "underline" : ""
                                                            }
                                                        >
                                                            {artist.name}
                                                        </a>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };
}
