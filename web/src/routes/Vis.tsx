import { Component } from "preact";
import { CSSProperties } from "preact/compat";
import Visuals from "../components/Visuals";

interface VisProps {
    readonly className?: string;
    readonly style?: CSSProperties;
}

interface VisState {}

export default class Vis extends Component<VisProps, VisState> {
    constructor(props: VisProps) {
        super(props);
        this.state = {};
    }

    componentDidMount = async () => {};

    render = () => {
        return (
            <div
                style={{ ...this.props.style }}
                className={`Vis ${this.props.className ?? ""}h-full w-full`}
            >
                <Visuals></Visuals>
            </div>
        );
    };
}
