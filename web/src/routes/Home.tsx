import { Component } from "preact";
import { CSSProperties } from "preact/compat";
import EventListItem from "../components/EventListItem";
import Nav from "../components/Nav";
import { events } from "../events";

interface HomeProps {
    readonly className?: string;
    readonly style?: CSSProperties;
}

interface HomeState {}

export default class Home extends Component<HomeProps, HomeState> {
    constructor(props: HomeProps) {
        super(props);
        this.state = {};
    }

    componentDidMount = async () => {};

    render = () => {
        return (
            <div
                style={{ ...this.props.style }}
                className={`Home ${this.props.className ?? ""} h-full w-full`}
            >
                <Nav></Nav>
                <div
                    className={"flex h-full w-full flex-col items-center justify-center gap-4 p-4"}
                >
                    {events.map((event) => {
                        return <EventListItem event={event} />;
                    })}
                </div>
            </div>
        );
    };
}

/*


                  

*/
