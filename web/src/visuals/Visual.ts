import * as THREE from "three";

export default abstract class Visual {
    public abstract init: () => void;
    public abstract animate: () => void;
    public abstract dispose: () => void;
    public abstract setAnalyser: (analyser: THREE.AudioAnalyser | undefined) => void;
}
