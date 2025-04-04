import { Component } from "preact";
import { CSSProperties } from "preact/compat";
import Members from "../components/Members";

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
                className={`Home ${this.props.className ?? ""} flex h-full w-full flex-col items-center text-center`}
            >
                <div className={"mt-10 w-full"}>
                    <h1 className={"text-5xl"}>IMPEDANZ</h1>
                    <h2>Events</h2>
                </div>
                <div className={"w-full"}>
                    <Members />
                </div>
            </div>
        );
    };
}
