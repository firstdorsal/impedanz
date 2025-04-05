import { BlendFunction } from "postprocessing";
import { Component, createElement, VNode } from "preact";
import { CSSProperties } from "preact/compat";
import * as THREE from "three";
import BloomBoom, { BloomBoomGeometryType } from "../visuals/BloomBoom";

interface VisualsProps {
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly visuals?: VNode[];
}

interface VisualsState {
    readonly word: string;
}

export default class Visuals extends Component<VisualsProps, VisualsState> {
    visuals: VNode[] = [];
    constructor(props: VisualsProps) {
        super(props);
        this.state = {
            word: words[0]
        };

        if (props.visuals) {
            this.visuals = props.visuals;
        } else {
            this.visuals.push(
                createElement(BloomBoom, {
                    geometryType: BloomBoomGeometryType.Icosahedron,
                    name: "Icosahedron",
                    geometryPolygons: 5,
                    geometrySize: 6,
                    bloomColor: new THREE.Color(1, 0.41, 0),
                    bloomLuminanceThreshold: 0.1,
                    bloomIntensity: 100,
                    bloomLuminanceSmoothing: 2,
                    frequencyMultiplier: 0.84,
                    frequencyExponent: 1.3,
                    mipmapBlurRadius: 1.6,

                    bloomBlendFunction: BlendFunction.HARD_LIGHT,
                    mipmapBlurLevels: 2,
                    displayGUI: true
                })
            );
        }
    }

    setRandomWord = () => {
        this.setState({
            word: words[Math.floor(Math.random() * words.length)]
        });
    };

    render = () => {
        return (
            <div
                style={{ ...this.props.style }}
                className={`Visuals ${this.props.className ?? ""}bg-[black] relative h-full w-full`}
            >
                {this.visuals.map((visual, index) => (
                    <div
                        key={index}
                        className={`absolute left-0 top-0 h-full w-full ${index === 0 ? "z-10" : ""}`}
                    >
                        {visual}
                    </div>
                ))}
            </div>
        );
    };
}

/*
 <div className={"select-none text-9xl"}>{this.state.word}</div>

                    <div className={"select-none text-9xl"}>{this.state.word}</div>
                    <div className={"text-8xl"}>GENESIS</div>
                    <div className={"mt-10"}>25.04</div>
                    <div className={""}> City Club Augsburg</div>

       <div className={"w-full"}>25.04</div>
                    <div className={"w-full"}> City Club Augsburg</div>


<div className={"select-none text-9xl"}>{this.state.word}</div>

*/

const words = [
    "IMPEDANCE", // English
    "IMPÉDANCE", // French
    "IMPEDANZ", // German
    "IMPEDANCIA", // Spanish
    "IMPEDENZA", // Italian
    "ИМПЕДАНС", // Russian
    "インピーダンス", // Japanese
    "阻抗", // Chinese
    "IMPEDANTIE", // Dutch
    "EMPEDANS", // Turkish
    "IMPEDANCJA", // Polish
    "ΕΜΠΕΔΗΣΗ" // Greek
];
