import { Component } from "preact";
import { CSSProperties } from "preact/compat";
import Nav from "../components/Nav";

interface AboutProps {
    readonly className?: string;
    readonly style?: CSSProperties;
}

interface AboutState {}

export default class About extends Component<AboutProps, AboutState> {
    constructor(props: AboutProps) {
        super(props);
        this.state = {};
    }

    componentDidMount = async () => {};

    render = () => {
        return (
            <div style={{ ...this.props.style }} className={`About ${this.props.className ?? ""}`}>
                <Nav />
            </div>
        );
    };
}
