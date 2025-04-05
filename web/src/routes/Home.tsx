import { BlendFunction } from "postprocessing";
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
                className={`Home ${this.props.className ?? ""} relative h-full w-full overflow-hidden`}
            >
                <div
                    className={
                        "absolute left-0 top-0 z-10 flex h-full w-full flex-col items-center justify-center px-4 text-center md:px-8"
                    }
                >
                    <div className={"mt-6 w-full md:mt-10"}>
                        <h1 className={"text-3xl font-bold sm:text-4xl md:text-5xl"}>IMPEDANZ</h1>
                        <h2 className={"mt-2 text-sm sm:text-base md:text-lg"}>Events by</h2>
                    </div>
                    <div className={"mt-4 w-full max-w-screen-lg md:mt-6"}>
                        <Members />
                    </div>
                </div>
                <Visuals
                    className="absolute left-0 top-0 h-full w-full"
                    visuals={[
                        createElement(BloomBoom, {
                            geometryType: BloomBoomGeometryType.Torus,
                            name: "Torus",
                            geometryPolygons: 100,
                            geometrySize: 6,
                            bloomColor: new THREE.Color(1, 0.41, 0),
                            bloomLuminanceThreshold: 0.1,
                            bloomIntensity: 150,
                            bloomLuminanceSmoothing: 2.69,
                            frequencyMultiplier: 0.84,
                            frequencyExponent: 1.3,
                            mipmapBlurRadius: 0.39,
                            bloomBlendFunction: BlendFunction.HARD_LIGHT,
                            mipmapBlurLevels: 2,
                            microphoneInput: false
                        })
                    ]}
                />
            </div>
        );
    };
}
