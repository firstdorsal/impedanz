import * as THREE from "three";
//@ts-ignore
import * as EssentialsPlugin from "@tweakpane/plugin-essentials";
import { BlendFunction, BloomEffect, EffectComposer, EffectPass, RenderPass } from "postprocessing";
import { Component } from "preact";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import { match } from "ts-pattern";
import { Pane } from "tweakpane";

export interface BloomBoomProps {
    readonly bloomIntensity?: number;
    readonly bloomLuminanceSmoothing?: number;
    readonly bloomLuminanceThreshold?: number;
    readonly bloomColor?: THREE.Color;
    readonly bloomBlendFunction?: BlendFunction;
    readonly mipmapBlur?: boolean;
    readonly mipmapBlurLevels?: number;
    readonly mipmapBlurRadius?: number;
    readonly geometryType?: BloomBoomGeometryType;
    readonly geometrySize?: number;
    readonly geometryPolygons?: number;
    readonly wireframe?: boolean;
    readonly name?: string;
    readonly frequencyMultiplier?: number;
    readonly frequencyExponent?: number;
    readonly displayGUI?: boolean;
    readonly microphoneInput?: boolean;
    readonly colorDelta?: number;
    readonly rotationDelta?: number;
    readonly autoRotate?: boolean;
}

export enum BloomBoomGeometryType {
    Sphere,
    Cube,
    Torus,
    Dodecahedron,
    Icosahedron
}

interface BloomBoomState {
    readonly frequencyMultiplier: number;
    readonly frequencyExponent: number;
}

export default class BloomBoom extends Component<BloomBoomProps, BloomBoomState> {
    audio: THREE.Audio | undefined;
    analyser: THREE.AudioAnalyser | undefined;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    clock: THREE.Clock;
    listener: THREE.AudioListener | undefined;
    controls: OrbitControls | undefined;
    gui: GUI | undefined;
    composer: EffectComposer;
    bloomEffect: BloomEffect;
    uniforms: any;

    constructor(props: BloomBoomProps) {
        super();

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });

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

        this.state = {
            frequencyMultiplier: props.frequencyMultiplier ?? 1,
            frequencyExponent: props.frequencyExponent ?? 1
        };

        this.uniforms = {
            u_time: { type: "f", value: 0.0 },
            u_frequency: { type: "f", value: 0.0 },
            u_red: { type: "f", value: props.bloomColor?.r ?? 0.8 },
            u_green: { type: "f", value: props.bloomColor?.g ?? 0.6 },
            u_blue: { type: "f", value: props.bloomColor?.b ?? 0.4 }
        };

        this.composer = new EffectComposer(this.renderer);

        this.bloomEffect = new BloomEffect({
            blendFunction: props.bloomBlendFunction ?? BlendFunction.ADD,
            luminanceThreshold: props.bloomLuminanceThreshold ?? 0.1,
            luminanceSmoothing: props.bloomLuminanceSmoothing ?? 0.5,
            intensity: props.bloomIntensity ?? 3,
            radius: props.mipmapBlurRadius ?? 0.5,
            mipmapBlur: props.mipmapBlur ?? true,
            levels: props.mipmapBlurLevels ?? 3
        });

        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(new EffectPass(this.camera, this.bloomEffect));

        const geometrySize = props.geometrySize ?? 4;
        const geometryPolygons = props.geometryPolygons ?? 32;

        const geometry = match(props.geometryType)
            .with(
                BloomBoomGeometryType.Sphere,
                () => new THREE.SphereGeometry(geometrySize, geometryPolygons, geometryPolygons)
            )
            .with(
                BloomBoomGeometryType.Cube,
                () =>
                    new THREE.BoxGeometry(
                        geometrySize,
                        geometrySize,
                        geometrySize,
                        geometryPolygons,
                        geometryPolygons,
                        geometryPolygons
                    )
            )
            .with(
                BloomBoomGeometryType.Torus,
                () => new THREE.TorusGeometry(geometrySize, 0.4, geometryPolygons, geometryPolygons)
            )
            .with(
                BloomBoomGeometryType.Dodecahedron,
                () => new THREE.DodecahedronGeometry(geometrySize, geometryPolygons)
            )
            .with(
                BloomBoomGeometryType.Icosahedron,
                () => new THREE.IcosahedronGeometry(geometrySize, geometryPolygons)
            )
            .otherwise(() => new THREE.IcosahedronGeometry(geometrySize, geometryPolygons));

        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.material.wireframe = props.wireframe ?? true;

        this.scene.add(mesh);

        if (props.displayGUI) {
            this.createGUI();
        }
    }

    createGUI = () => {
        const pane = new Pane({});
        pane.registerPlugin(EssentialsPlugin);

        // @ts-ignore
        const folder = pane.addFolder({ title: "Settings" });

        folder.addBinding(this.state, "frequencyMultiplier", {
            label: "Frequency Multiplier",
            min: 0,
            max: 10,
            step: 0.01
        });

        folder.addBinding(this.state, "frequencyExponent", {
            label: "Frequency Exponent",
            min: 0,
            max: 5,
            step: 0.01
        });

        const colorFolder = folder.addFolder({ title: "Colors" });

        colorFolder.addBinding(this.uniforms.u_red, "value", {
            label: "Red",
            min: 0,
            max: 1,
            step: 0.01
        });

        colorFolder.addBinding(this.uniforms.u_green, "value", {
            label: "Green",
            min: 0,
            max: 1,
            step: 0.01
        });

        colorFolder.addBinding(this.uniforms.u_blue, "value", {
            label: "Blue",
            min: 0,
            max: 1,
            step: 0.01
        });

        folder.addBinding(this.bloomEffect, "intensity", { min: 0, max: 100, step: 0.01 });
        folder.addBinding(this.bloomEffect.mipmapBlurPass, "radius", {
            min: 0,
            max: 10,
            step: 0.001
        });
        folder.addBinding(this.bloomEffect.mipmapBlurPass, "levels", { min: 1, max: 9, step: 1 });
        folder.addBinding(this.bloomEffect.blendMode.opacity, "value", {
            label: "opacity",
            min: 0,
            max: 1,
            step: 0.01
        });
        folder.addBinding(this.bloomEffect.blendMode, "blendFunction", { options: BlendFunction });

        let subfolder = folder.addFolder({ title: "Luminance Filter" });
        subfolder.addBinding(this.bloomEffect.luminancePass, "enabled");
        subfolder.addBinding(this.bloomEffect.luminanceMaterial, "threshold", {
            min: 0,
            max: 1,
            step: 0.01
        });
        subfolder.addBinding(this.bloomEffect.luminanceMaterial, "smoothing", {
            min: 0,
            max: 5,
            step: 0.01
        });
    };

    init = () => {};

    componentDidMount = async () => {
        if (this.props.microphoneInput !== false) {
            navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then((stream) => {
                this.listener = new THREE.AudioListener();
                this.audio = new THREE.Audio(this.listener);
                const source = this.listener.context.createMediaStreamSource(stream);
                //@ts-ignore
                this.audio.setNodeSource(source);
                this.audio.setVolume(10);
                this.audio.getOutput().disconnect(this.listener.getInput());

                this.analyser = new THREE.AudioAnalyser(this.audio, 32);
                this.camera.add(this.listener);
            });
        }

        const canvasBox = document.getElementById("canvasBox") as HTMLCanvasElement;
        if (this.renderer.domElement) {
            this.renderer.domElement.style.position = "absolute";

            canvasBox.appendChild(this.renderer.domElement);
        }
        // Initialize camera position
        this.camera.position.set(0, 0, 20);
        this.camera.lookAt(this.scene.position);

        // Initialize orbit controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true; // adds smooth damping effect
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 0.5;
        this.controls.maxDistance = 500;

        // auto rotate

        this.controls.autoRotate = this.props.autoRotate ?? false;

        // handle resize
        window.addEventListener("resize", () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.animate();
    };

    animate = () => {
        this.controls?.update();

        if (this.analyser) {
            // update depeding on the multiplier and the curve use the curve to control the exponential growth of higher peaks
            this.uniforms.u_frequency.value =
                Math.pow(this.analyser.getAverageFrequency(), this.state.frequencyExponent) *
                this.state.frequencyMultiplier;
        } else {
            // make it oscillate between getting bigger and smaller when it hits large numbers like 100 seconds

            this.uniforms.u_frequency.value =
                Math.sin(this.uniforms.u_time.value) * 500 + this.uniforms.u_time.value / 10;
        }

        if (this.props.colorDelta) {
            this.uniforms.u_red.value = Math.abs(
                Math.sin(this.uniforms.u_time.value * this.props.colorDelta)
            );
            this.uniforms.u_green.value = Math.abs(
                Math.sin(this.uniforms.u_time.value * this.props.colorDelta + 2)
            );
            this.uniforms.u_blue.value = Math.abs(
                Math.sin(this.uniforms.u_time.value * this.props.colorDelta + 4)
            );
        }

        this.uniforms.u_time.value = this.clock.getElapsedTime();

        this.composer.render();
        this.renderer.render(this.scene, this.camera);

        this.camera.lookAt(this.scene.position);

        requestAnimationFrame(this.animate);
    };

    dispose = () => {};

    render = () => {
        return (
            <>
                <div id="canvasBox" className={"h-full w-full"}></div>
            </>
        );
    };
}

export const vertexShader = `
uniform float u_time;

      vec3 mod289(vec3 x)
      {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
      
      vec4 mod289(vec4 x)
      {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
      
      vec4 permute(vec4 x)
      {
        return mod289(((x*34.0)+10.0)*x);
      }
      
      vec4 taylorInvSqrt(vec4 r)
      {
        return 1.79284291400159 - 0.85373472095314 * r;
      }
      
      vec3 fade(vec3 t) {
        return t*t*t*(t*(t*6.0-15.0)+10.0);
      }

      // Classic Perlin noise, periodic variant
      float pnoise(vec3 P, vec3 rep)
      {
        vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
        vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
        Pi0 = mod289(Pi0);
        Pi1 = mod289(Pi1);
        vec3 Pf0 = fract(P); // Fractional part for interpolation
        vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = Pi0.zzzz;
        vec4 iz1 = Pi1.zzzz;

        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);

        vec4 gx0 = ixy0 * (1.0 / 7.0);
        vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);

        vec4 gx1 = ixy1 * (1.0 / 7.0);
        vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);

        vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
        vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
        vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
        vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
        vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
        vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
        vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
        vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

        vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
        g000 *= norm0.x;
        g010 *= norm0.y;
        g100 *= norm0.z;
        g110 *= norm0.w;
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
        g001 *= norm1.x;
        g011 *= norm1.y;
        g101 *= norm1.z;
        g111 *= norm1.w;

        float n000 = dot(g000, Pf0);
        float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
        float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
        float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
        float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
        float n111 = dot(g111, Pf1);

        vec3 fade_xyz = fade(Pf0);
        vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
        return 2.2 * n_xyz;
      }

      uniform float u_frequency;

      void main() {
          float noise = 3.0 * pnoise(position + u_time, vec3(10.0));
          float displacement = (u_frequency / 30.) * (noise / 10.);
          vec3 newPosition = position + normal * displacement;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
`;

export const fragmentShader = `
        uniform float u_red;
        uniform float u_blue;
        uniform float u_green;
        void main() {
            gl_FragColor = vec4(vec3(u_red, u_green, u_blue), 1. );
        }
`;
