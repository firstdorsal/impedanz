import { Component } from "preact";
import { CSSProperties } from "preact/compat";
import EventDetail from "../components/EventDetail";
import Nav from "../components/Nav";
import { events } from "../events";

interface EventPageProps {
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly name: string;
    readonly path: string;
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
            (event) => event.title.toLowerCase() === this.props.name.toLowerCase()
        );
        return (
            <div
                style={{ ...this.props.style }}
                className={`EventPage ${this.props.className ?? ""} `}
            >
                <Nav />
                <div className={"flex flex-col items-center"}>
                    <div className={"max-w-[500px]"}>
                        {event ? (
                            <EventDetail className="" event={event} />
                        ) : (
                            <div className="text-center text-xl">Event not found</div>
                        )}
                    </div>
                </div>
            </div>
        );
    };
}
