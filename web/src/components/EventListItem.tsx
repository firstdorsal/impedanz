import { Component } from "preact";
import { CSSProperties } from "preact/compat";
import { Event } from "../types";

interface EventListItemProps {
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly event: Event;
}

const dateTimeFormatter = new Intl.DateTimeFormat(["ban", "de-de", "en"], {
    weekday: "long",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit"
});

interface EventListItemState {}

export default class EventListItem extends Component<EventListItemProps, EventListItemState> {
    constructor(props: EventListItemProps) {
        super(props);
        this.state = {};
    }

    componentDidMount = async () => {};

    render = () => {
        const { event } = this.props;
        const start = dateTimeFormatter.format(Number(event.dateTimeStart));
        return (
            <a
                style={{ ...this.props.style }}
                className={`EventListItem ${this.props.className ?? ""} flex w-full items-center gap-4 border-2 p-4`}
                href={`/events/${event.title}`}
            >
                <img
                    src={event.imageUrl}
                    alt={event.imageAlt}
                    className={""}
                    style={{ maxWidth: "100px", height: "auto" }}
                    width={1080}
                    height={1080}
                    loading={"lazy"}
                />
                <div className={"flex flex-col gap-2"}>
                    <span className={"text-3xl font-bold"}>{event.title}</span>
                    <span>{start}</span>
                </div>
            </a>
        );
    };
}
