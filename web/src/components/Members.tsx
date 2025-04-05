import { Component } from "preact";
import { CSSProperties } from "preact/compat";

interface MembersProps {
    readonly className?: string;
    readonly style?: CSSProperties;
}

interface MembersState {}

const members = ["Paul", "Pepe", "Milan"];

export default class Members extends Component<MembersProps, MembersState> {
    constructor(props: MembersProps) {
        super(props);
        this.state = {};
    }

    componentDidMount = async () => {};

    render = () => {
        // randomize the order of the members
        members.sort(() => Math.random() - 0.5);
        return (
            <div
                style={{ ...this.props.style }}
                className={`Members ${this.props.className ?? ""}`}
            >
                <div className={"w-full"}>
                    {members.map((member) => (
                        <span className={"m-2 uppercase"}>{member}</span>
                    ))}
                </div>
            </div>
        );
    };
}
