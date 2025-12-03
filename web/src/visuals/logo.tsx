import { CSSProperties, PureComponent, createRef } from "react";

interface logoProps {
    readonly className?: string;
    readonly style?: CSSProperties;
}

interface logoState {
    curvature: number;
    lineCurvature: number;
}

export default class logo extends PureComponent<logoProps, logoState> {
    private canvasRef = createRef<HTMLCanvasElement>();

    constructor(props: logoProps) {
        super(props);
        this.state = {
            curvature: 0.5,
            lineCurvature: 0.5
        };
    }

    componentDidMount = async () => {
        this.drawPolygon();
    };

    drawPolygon = () => {
        const canvas = this.canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate center and radius
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.8;

        // Draw 12-sided polygon (dodecagon) with curved edges
        const sides = 12;
        const angleStep = (Math.PI * 2) / sides;

        // Calculate points (vertices of the polygon)
        const points: { x: number; y: number }[] = [];
        for (let i = 0; i < sides; i++) {
            const angle = i * angleStep - Math.PI / 2;
            points.push({
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            });
        }

        // Draw with curved edges that bend inward
        ctx.beginPath();

        for (let i = 0; i < sides; i++) {
            const current = points[i];
            const next = points[(i + 1) % sides];

            if (i === 0) {
                ctx.moveTo(current.x, current.y);
            }

            // Calculate the midpoint of the edge
            const midX = (current.x + next.x) / 2;
            const midY = (current.y + next.y) / 2;

            // Calculate the angle from center to midpoint
            const angleToMid = Math.atan2(midY - centerY, midX - centerX);

            // Calculate how far inward the control point should be
            const edgeLength = Math.sqrt(
                Math.pow(next.x - current.x, 2) + Math.pow(next.y - current.y, 2)
            );
            const inwardDistance = edgeLength * this.state.curvature * 0.5;

            // Control point is the midpoint pushed inward toward the center
            const controlX = midX - inwardDistance * Math.cos(angleToMid);
            const controlY = midY - inwardDistance * Math.sin(angleToMid);

            // Draw quadratic curve from current to next, bending at control point
            ctx.quadraticCurveTo(controlX, controlY, next.x, next.y);
        }

        ctx.closePath();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw lines from vertices (corners) to center with curvature
        for (let i = 0; i < sides; i++) {
            const vertex = points[i];

            // Calculate the angle from center to vertex
            const angleToVertex = Math.atan2(vertex.y - centerY, vertex.x - centerX);

            // Calculate distance from center to vertex
            const distance = Math.sqrt(
                Math.pow(vertex.x - centerX, 2) + Math.pow(vertex.y - centerY, 2)
            );

            // Calculate midpoint between center and vertex
            const midX = (centerX + vertex.x) / 2;
            const midY = (centerY + vertex.y) / 2;

            // First line - curves to the left (counter-clockwise)
            const offset = distance * this.state.lineCurvature * 0.5;
            const controlX1 = midX + offset * Math.cos(angleToVertex + Math.PI / 2);
            const controlY1 = midY + offset * Math.sin(angleToVertex + Math.PI / 2);

            ctx.beginPath();
            ctx.moveTo(vertex.x, vertex.y);
            ctx.quadraticCurveTo(controlX1, controlY1, centerX, centerY);
            ctx.stroke();

            // Second line - curves to the right (clockwise)
            const controlX2 = midX + offset * Math.cos(angleToVertex - Math.PI / 2);
            const controlY2 = midY + offset * Math.sin(angleToVertex - Math.PI / 2);

            ctx.beginPath();
            ctx.moveTo(vertex.x, vertex.y);
            ctx.quadraticCurveTo(controlX2, controlY2, centerX, centerY);
            ctx.stroke();
        }
    };

    handleCurvatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ curvature: parseFloat(e.target.value) }, () => {
            this.drawPolygon();
        });
    };

    handleLineCurvatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ lineCurvature: parseFloat(e.target.value) }, () => {
            this.drawPolygon();
        });
    };

    render = () => {
        return (
            <div
                style={{
                    ...this.props.style,
                    width: "100vw",
                    height: "100vh",
                    overflow: "hidden",
                    position: "fixed",
                    top: 0,
                    left: 0,
                    margin: 0,
                    padding: 0
                }}
                className={`logo ${this.props.className ?? ""}`}
            >
                <canvas
                    ref={this.canvasRef}
                    width={2000}
                    height={2000}
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: "contain"
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: "20px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        background: "rgba(0, 0, 0, 0.5)",
                        padding: "10px 20px",
                        borderRadius: "8px"
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <label style={{ color: "white", fontSize: "14px", minWidth: "120px" }}>
                            Edge Curvature:
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={this.state.curvature}
                            onChange={this.handleCurvatureChange}
                            style={{ width: "200px" }}
                        />
                        <span style={{ color: "white", fontSize: "14px", minWidth: "40px" }}>
                            {this.state.curvature.toFixed(2)}
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <label style={{ color: "white", fontSize: "14px", minWidth: "120px" }}>
                            Line Curvature:
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={this.state.lineCurvature}
                            onChange={this.handleLineCurvatureChange}
                            style={{ width: "200px" }}
                        />
                        <span style={{ color: "white", fontSize: "14px", minWidth: "40px" }}>
                            {this.state.lineCurvature.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        );
    };
}
