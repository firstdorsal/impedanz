import { Component } from "preact";
import { CSSProperties } from "preact/compat";
import EventDetail from "../components/EventDetail";
import { events } from "../events";

interface EventPageProps {
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly name: string;
}

interface EventPageState {}

export default class EventPage extends Component<EventPageProps, EventPageState> {
    constructor(props: EventPageProps) {
        super(props);
        this.state = {};
    }

    componentDidMount = async () => {};

    render = () => {
        const event = events.find(
            (event) => event.name.toLowerCase() === this.props.name.toLowerCase()
        );
        console.log("EventPage", event);
        return (
            <div
                style={{ ...this.props.style }}
                className={`EventPage ${this.props.className ?? ""}`}
            >
                {event ? (
                    <EventDetail className="px-6 pt-6 md:px-8" event={event} />
                ) : (
                    <div className="text-center text-xl">Event not found</div>
                )}
            </div>
        );
    };
}
