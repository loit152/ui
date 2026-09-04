// ========================================
// Mandelbrot Viewer (Minimalist Black & White)
// ========================================
const canvas = document.getElementById("canvas");
const consoleElement = document.getElementById("console");
const gl = canvas.getContext("webgl2");

if (!gl) throw new Error("WebGL2 is not supported.");

// --- Camera & State ---
let centerX = -0.75;
let centerY = 0;
let logZoom = 0;

let dragging = false;
let lastX = 0, lastY = 0;
let pinchDistance = 0;

// --- Shaders ---
const vertexShaderSource = `#version 300 es
in vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 outColor;

uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_zoom;
uniform int u_maxIteration;

void main() {
    // スクリーン座標 -> 複素数平面座標への変換
    vec2 p = (gl_FragCoord.xy / u_resolution - 0.5);
    vec2 c = u_center + vec2(p.x * (3.5 / u_zoom), p.y * (2.0 / u_zoom));

    // マンデルブロ集合の判定ループ
    vec2 z = vec2(0.0);
    bool inside = true;

    for (int i = 0; i < u_maxIteration; i++) {
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        if (dot(z, z) > 4.0) {
            inside = false;
            break;
        }
    }

    // 白黒表示（集合内: 黒 / 集合外: 白）
    outColor = inside ? vec4(0.0, 0.0, 0.0, 1.0) : vec4(1.0);
}`;

// --- Shader Helper ---
function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

const program = gl.createProgram();
gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexShaderSource));
gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentShaderSource));
gl.linkProgram(program);
gl.useProgram(program);

// --- Geometry (Fullscreen Triangle) ---
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

const posLoc = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(posLoc);
gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

// --- Uniform Locations ---
const uRes = gl.getUniformLocation(program, "u_resolution");
const uCenter = gl.getUniformLocation(program, "u_center");
const uZoom = gl.getUniformLocation(program, "u_zoom");
const uMaxIter = gl.getUniformLocation(program, "u_maxIteration");

// --- Helpers ---
const getZoom = () => Math.pow(2, logZoom);

function updateConsole() {
    if (!consoleElement) return;
    const zoomStr = logZoom < 1000 ? getZoom().toExponential(4) : `2^${logZoom.toFixed(2)}`;
    consoleElement.textContent = `Mandelbrot Viewer\nmode: WebGL (B&W)\nzoom: ${zoomStr}\ncenterX: ${centerX}\ncenterY: ${centerY}`;
}

// --- Draw ---
function draw() {
    const zoom = getZoom();
    const maxIteration = Math.min(2000, Math.floor(50 + logZoom * 20));

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform2f(uCenter, centerX, centerY);
    gl.uniform1f(uZoom, zoom);
    gl.uniform1i(uMaxIter, maxIteration);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    updateConsole();
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    draw();
}
window.addEventListener("resize", resizeCanvas);

// --- Touch Events ---
canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
        dragging = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
        dragging = false;
        pinchDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
    }
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && dragging) {
        const touch = e.touches[0];
        const dx = touch.clientX - lastX;
        const dy = touch.clientY - lastY;
        lastX = touch.clientX;
        lastY = touch.clientY;

        const zoom = getZoom();
        centerX -= (dx / canvas.width) * (3.5 / zoom);
        centerY -= (dy / canvas.height) * (2.0 / zoom);
        draw();
    } else if (e.touches.length === 2 && pinchDistance > 0) {
        const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        logZoom = Math.max(-20, Math.min(logZoom + Math.log2(dist / pinchDistance), 1000));
        pinchDistance = dist;
        draw();
    }
}, { passive: false });

canvas.addEventListener("touchend", () => {
    dragging = false;
    pinchDistance = 0;
    draw();
});

// --- Initialize ---
resizeCanvas();
