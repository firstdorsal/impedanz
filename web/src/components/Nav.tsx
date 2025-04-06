import { Component } from "preact";
import { Link } from "preact-router";
import { CSSProperties } from "preact/compat";

interface NavProps {
    readonly className?: string;
    readonly style?: CSSProperties;
}

interface NavState {}

export default class Nav extends Component<NavProps, NavState> {
    constructor(props: NavProps) {
        super(props);
        this.state = {};
    }

    componentDidMount = async () => {};

    render = () => {
        return (
            <nav
                style={{ ...this.props.style }}
                className={`Nav ${this.props.className ?? ""} flex gap-2 p-4`}
            >
                {/*@ts-ignore*/}
                <Link activeClassName="active" href="/" className={"font-bold"}>
                    IMPEDANZ
                </Link>
                {/*@ts-ignore*/}
                <Link activeClassName="active" href="/awareness" className={"underline"}>
                    awareness
                </Link>
                <a href="https://vindelicum.eu/impressum/" className={"underline"}>
                    legal
                </a>
                <a href="https://vindelicum.eu/datenschutz/" className={"underline"}>
                    privacy
                </a>
            </nav>
        );
    };
}
