import { Component } from "preact";
import Router from "preact-router";
import { CSSProperties } from "preact/compat";
import Home from "./routes/Home";
import Vis from "./routes/Vis";

interface AppProps {
    readonly className?: string;
    readonly style?: CSSProperties;
}

interface AppState {}

export default class App extends Component<AppProps, AppState> {
    constructor(props: AppProps) {
        super(props);
        this.state = {};
    }

    componentDidMount = async () => {};

    render = () => {
        return (
            <div
                style={{ ...this.props.style }}
                className={`App ${this.props.className ?? ""} h-full w-full`}
            >
                <Router>
                    <Home path="/"></Home>
                    <Vis path="/visuals"></Vis>
                </Router>
            </div>
        );
    };
}
