import { impedanceValue } from "../lib/impedance-curve";

// Canvas oscilloscope for the hero: the impedance curve as carrier
// signal, a ripple that follows the pointer, a phosphor-style sweep
// and a slowly panning measurement grid.

const ACID = "#c8ff00";
const LINE = "#232328";

const GRID_SPACING_X = 160;
const GRID_SPACING_Y = 75;
const GRID_PAN_SPEED = 7; // px/s
const SWEEP_DURATION = 4.5; // s per left-to-right pass
const SAMPLES = 240;

export class Oscilloscope {
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly container: HTMLElement;
    private readonly observer: ResizeObserver;
    private width = 0;
    private height = 0;
    private dpr = 1;
    private animationFrame = 0;
    private lastTime = 0;
    private elapsed = 0;
    private gridOffset = 0;

    // pointer state, normalized to [0,1]; targets are lerped for smoothness
    private pointerActive = false;
    private pointerT = 0.5;
    private pointerY = 0.5;
    private excitation = 0; // 0 = idle, 1 = pointer fully engaged

    constructor(canvas: HTMLCanvasElement, container: HTMLElement) {
        this.canvas = canvas;
        this.container = container;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("canvas 2d context unavailable");
        }
        this.ctx = ctx;

        this.observer = new ResizeObserver(() => this.resize());
        this.observer.observe(container);
        this.resize();

        container.addEventListener("pointermove", this.handlePointerMove);
        container.addEventListener("pointerleave", this.handlePointerLeave);
        container.addEventListener("pointerdown", this.handlePointerMove);
    }

    start = (): void => {
        this.lastTime = performance.now();
        this.animationFrame = requestAnimationFrame(this.frame);
    };

    dispose = (): void => {
        cancelAnimationFrame(this.animationFrame);
        this.observer.disconnect();
        this.container.removeEventListener("pointermove", this.handlePointerMove);
        this.container.removeEventListener("pointerleave", this.handlePointerLeave);
        this.container.removeEventListener("pointerdown", this.handlePointerMove);
    };

    private resize = (): void => {
        const rect = this.container.getBoundingClientRect();
        this.dpr = window.devicePixelRatio || 1;
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = Math.round(rect.width * this.dpr);
        this.canvas.height = Math.round(rect.height * this.dpr);
    };

    private handlePointerMove = (event: PointerEvent): void => {
        const rect = this.container.getBoundingClientRect();
        this.pointerT = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
        this.pointerY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
        this.pointerActive = true;
    };

    private handlePointerLeave = (): void => {
        this.pointerActive = false;
    };

    private traceY = (t: number): number => {
        const carrier = (1 - impedanceValue(t)) * this.height;

        // ripple frequency follows the pointer's vertical position
        const rippleFrequency = 10 + this.pointerY * 22;
        // local excitation around the pointer, small idle ripple otherwise
        const distance = (t - this.pointerT) / 0.09;
        const local = Math.exp(-0.5 * distance * distance);
        const amplitude = this.height * (0.012 + 0.075 * this.excitation * local);

        const phase = rippleFrequency * t * Math.PI * 2 - this.elapsed * 2.6;
        return carrier + Math.sin(phase) * amplitude;
    };

    private frame = (now: number): void => {
        const dt = Math.min(0.05, (now - this.lastTime) / 1000);
        this.lastTime = now;
        this.elapsed += dt;

        // ease pointer engagement in and out
        const target = this.pointerActive ? 1 : 0;
        this.excitation += (target - this.excitation) * Math.min(1, dt * 4);

        this.gridOffset = (this.gridOffset + GRID_PAN_SPEED * dt) % GRID_SPACING_X;

        this.draw();
        this.animationFrame = requestAnimationFrame(this.frame);
    };

    private draw = (): void => {
        const { ctx, width, height } = this;
        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        // measurement grid
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = -this.gridOffset; x <= width; x += GRID_SPACING_X) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = GRID_SPACING_Y; y < height; y += GRID_SPACING_Y) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

        // full trace, dimmed like decayed phosphor
        ctx.strokeStyle = ACID;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.38;
        this.strokeTrace(0, 1);

        // bright segment trailing the sweep position
        const sweep = (this.elapsed % SWEEP_DURATION) / SWEEP_DURATION;
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2.2;
        ctx.shadowColor = ACID;
        ctx.shadowBlur = 14;
        this.strokeTrace(Math.max(0, sweep - 0.16), sweep);
        ctx.shadowBlur = 0;

        // sweep cursor line
        ctx.globalAlpha = 0.18;
        ctx.beginPath();
        ctx.moveTo(sweep * width, 0);
        ctx.lineTo(sweep * width, height);
        ctx.stroke();
        ctx.globalAlpha = 1;
    };

    private strokeTrace = (from: number, to: number): void => {
        const { ctx, width } = this;
        const start = Math.floor(from * SAMPLES);
        const end = Math.ceil(to * SAMPLES);
        ctx.beginPath();
        for (let i = start; i <= end; i++) {
            const t = i / SAMPLES;
            const x = t * width;
            const y = this.traceY(t);
            if (i === start) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    };
}

export function mountOscilloscope(): void {
    const container = document.querySelector<HTMLElement>("[data-scope]");
    const canvas = container?.querySelector<HTMLCanvasElement>("[data-scope-canvas]");
    const fallback = container?.querySelector<SVGElement>("[data-scope-fallback]");
    if (!container || !canvas) return;

    // With reduced motion the static SVG fallback stays in place.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    fallback?.classList.add("hidden");
    canvas.classList.remove("hidden");
    new Oscilloscope(canvas, container).start();
}
