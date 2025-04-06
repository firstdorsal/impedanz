import { Component } from "preact";
import { CSSProperties } from "preact/compat";

interface AwarenessProps {
    readonly className?: string;
    readonly style?: CSSProperties;
}

interface AwarenessState {}

export default class Awareness extends Component<AwarenessProps, AwarenessState> {
    constructor(props: AwarenessProps) {
        super(props);
        this.state = {};
    }

    componentDidMount = async () => {};

    render = () => {
        return (
            <div
                style={{ ...this.props.style }}
                className={`Awareness ${this.props.className ?? ""}`}
            ></div>
        );
    };
}
