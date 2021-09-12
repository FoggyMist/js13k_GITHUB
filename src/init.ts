export const canvas = document.getElementById("canvas") as HTMLCanvasElement;
export const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
    depth: true,
    desynchronized: true,
}) as WebGL2RenderingContext;


