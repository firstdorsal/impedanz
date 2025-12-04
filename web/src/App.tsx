import { Component } from "preact";
import { Route, Router } from "preact-router";
import { CSSProperties } from "preact/compat";
import About from "./routes/About";
import Awareness from "./routes/Awareness";
import EventPage from "./routes/EventPage";
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
                className={`App ${this.props.className ?? ""} min-h-full w-full bg-zinc-950 pb-10`}
            >
                <Router>
                    <Route path="/" component={Home} />
                    <Route path="/events/:name/" component={EventPage} />
                    <Route path="/visuals/" component={Vis} />
                    <Route path="/awareness/" component={Awareness} />
                    <Route path="/about/" component={About} />
                </Router>
            </div>
        );
    };
}
