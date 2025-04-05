import { Component, createElement } from "preact";
import { CSSProperties } from "preact/compat";
import * as THREE from "three";
import Members from "../components/Members";
import Visuals from "../components/Visuals";
import BloomBoom, { BloomBoomGeometryType } from "../visuals/BloomBoom";

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
                className={`Home ${this.props.className ?? ""} relative h-full w-full`}
            >
                <div
                    className={
                        "absolute left-0 top-0 flex h-full w-full flex-col items-center justify-center text-center"
                    }
                >
                    <div className={"mt-10 w-full"}>
                        <h1 className={"text-5xl"}>IMPEDANZ</h1>
                        <h2>Events by</h2>
                    </div>
                    <div className={"w-full"}>
                        <Members />
                    </div>
                </div>
                <Visuals
                    className="absolute left-0 top-0"
                    visuals={[
                        createElement(BloomBoom, {
                            geometryType: BloomBoomGeometryType.Torus,
                            name: "Torus",
                            geometryPolygons: 100,
                            geometrySize: 6,
                            bloomColor: new THREE.Color(0.3, 0.7, 1),
                            bloomLuminanceThreshold: 0,
                            bloomIntensity: 4,
                            bloomLuminanceSmoothing: 0.1,
                            frequencyMultiplier: 5,
                            microphoneInput: false
                        })
                    ]}
                />
            </div>
        );
    };
}
