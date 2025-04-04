import { Component } from "preact";
import { CSSProperties } from "preact/compat";
import * as THREE from "three";
//@ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import BloomBoom, { BloomBoomGeometryType } from "../visuals/BloomBoom";
import Visual from "../visuals/Visual";

interface VisualsProps {
    readonly className?: string;
    readonly style?: CSSProperties;
}

interface VisualsState {
    readonly word: string;
}

export default class Visuals extends Component<VisualsProps, VisualsState> {
    audio: THREE.Audio | undefined;
    analyser: THREE.AudioAnalyser | undefined;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    clock: THREE.Clock;
    listener: THREE.AudioListener | undefined;
    visuals: Visual[] = [];
    controls: OrbitControls | undefined;
    gui: GUI | undefined;

    constructor(props: VisualsProps) {
        super(props);
        this.state = {
            word: words[0]
        };

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.clock = new THREE.Clock();

        this.gui = new GUI();

        this.visuals.push(
            new BloomBoom(this, {
                geometryType: BloomBoomGeometryType.Sphere,
                name: "Sphere",
                geometryPolygons: 10,
                geometrySize: 6,
                bloomColor: new THREE.Color(0x9922ff),
                bloomThreshold: 0.1,
                bloomStrength: 4,
                bloomRadius: 0.1,
                frequencyMultiplier: 5
            })
        );
    }

    componentDidMount = async () => {
        navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then((stream) => {
            this.listener = new THREE.AudioListener();
            this.audio = new THREE.Audio(this.listener);
            const source = this.listener.context.createMediaStreamSource(stream);
            //@ts-ignore
            this.audio.setNodeSource(source);
            this.audio.setVolume(10);
            //abc
            this.audio.getOutput().disconnect(this.listener.getInput());

            this.analyser = new THREE.AudioAnalyser(this.audio, 32);
            this.camera.add(this.listener);

            this.visuals.forEach((visual) => {
                visual.setAnalyser(this.analyser);
            });
        });

        const canvasBox = document.getElementById("canvasBox") as HTMLCanvasElement;
        canvasBox.appendChild(this.renderer.domElement);

        // Initialize camera position
        this.camera.position.set(15, 15, 15);
        this.camera.lookAt(this.scene.position);

        // Initialize orbit controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true; // adds smooth damping effect
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 50;

        // handle resize
        window.addEventListener("resize", () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.animate();
    };

    setRandomWord = () => {
        this.setState({
            word: words[Math.floor(Math.random() * words.length)]
        });
    };

    animate = () => {
        // Update the orbit controls
        this.controls?.update();

        this.renderer.render(this.scene, this.camera);

        // every 5 seconds, change the word
        if (this.clock.getElapsedTime() % 4 < 0.5) {
            this.setRandomWord();
        }

        this.visuals.forEach((visual) => {
            visual.animate();
        });

        requestAnimationFrame(this.animate);
    };

    render = () => {
        return (
            <div
                style={{ ...this.props.style }}
                className={`Visuals ${this.props.className ?? ""} relative h-full w-full`}
            >
                <div id="canvasBox" className={"h-full w-full"}></div>{" "}
                <div
                    className={
                        "absolute top-0 flex h-full w-full flex-col items-center justify-center gap-6 text-center text-8xl"
                    }
                >
                    <div>impedanz.net</div>
                </div>
            </div>
        );
    };
}

/*
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
