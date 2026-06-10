// Shared shape of the loudspeaker impedance curve |Z|(f):
// resonance peak, minimum, inductive rise. Used by the static SVG
// fallback (build time) and the canvas oscilloscope (runtime) so both
// always draw the same trace.

function gauss(t: number, center: number, width: number): number {
    const d = (t - center) / width;
    return Math.exp(-0.5 * d * d);
}

function smoothstep(edge0: number, edge1: number, t: number): number {
    const x = Math.min(1, Math.max(0, (t - edge0) / (edge1 - edge0)));
    return x * x * (3 - 2 * x);
}

// t in [0, 1] (log frequency axis) -> value in [0, 1] (higher = more ohms)
export function impedanceValue(t: number): number {
    return 0.28 + 0.52 * gauss(t, 0.21, 0.055) + 0.3 * smoothstep(0.45, 1.15, t);
}

export function sampleImpedancePath(
    width: number,
    height: number,
    samples: number
): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        points.push({ x: t * width, y: (1 - impedanceValue(t)) * height });
    }
    return points;
}
