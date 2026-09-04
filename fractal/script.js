// ========================================
// Mandelbrot Viewer
// WebGL2 + Perturbation
// ========================================
const canvas = document.getElementById("canvas");
const consoleElement = document.getElementById("console");
const gl = canvas.getContext("webgl2");
if (!gl) {
    throw new Error("WebGL2 is not supported.");
}
// ========================================
// Console
// ========================================
function updateConsole(mode = "CPU") {
    consoleElement.textContent =
`Mandelbrot Viewer
mode: ${mode}
zoom: ${formatZoom()}
centerX: ${centerX}
centerY: ${centerY}
`;
}
// ========================================
// Canvas
// ========================================
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(
        0,
        0,
        canvas.width,
        canvas.height
    );
    draw();
}
window.addEventListener("resize", resizeCanvas);
// ========================================
// Camera
// ========================================
let centerX = -0.75;
let centerY = 0;
let logZoom = 0;
function getZoom() {
    return Math.pow(2, logZoom);
}
function formatZoom() {
    if (logZoom < 1000) {
        return getZoom().toExponential(4);
    }
    return `2^${logZoom.toFixed(2)}`;
}
// ========================================
// Touch
// ========================================
let dragging = false;
let lastX = 0;
let lastY = 0;
let pinchDistance = 0;
// ========================================
// Vertex Shader
// ========================================
const vertexShaderSource = `#version 300 es
in vec2 a_position;
void main() {
    gl_Position = vec4(
        a_position,
        0.0,
        1.0
    );
}
`;
// ========================================
// Fragment Shader
// ========================================
const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_zoom;
uniform int u_maxIteration;
void main() {
    vec2 uv =
        gl_FragCoord.xy /
        u_resolution;
    // 画面中央を原点にする
    vec2 p =
        uv -
        vec2(0.5);
    // 複素平面の表示範囲
    float rangeX =
        3.5 / u_zoom;
    float rangeY =
        2.0 / u_zoom;
    // ピクセル → 複素数
    vec2 c =
        u_center +
        vec2(
            p.x * rangeX,
            p.y * rangeY
        );
    // Mandelbrot
    vec2 z =
        vec2(0.0);
    int iteration = 0;
    for (int i = 0; i < 2000; i++) {
        if (i >= u_maxIteration) {
            break;
        }
        float zr = z.x;
        float zi = z.y;
        z.x =
            zr * zr -
            zi * zi +
            c.x;
        z.y =
            2.0 * zr * zi +
            c.y;
        iteration = i + 1;
        if (
            z.x * z.x +
            z.y * z.y
            > 4.0
        ) {
            break;
        }
    }
    // ========================================
    // 白黒表示
    // ========================================
    // Mandelbrot集合内部
    if (iteration >= u_maxIteration) {
        outColor =
            vec4(
                0.0,
                0.0,
                0.0,
                1.0
            );
        return;
    }
    // ========================================
    // Smooth Coloring
    // ========================================
    float r2 =
        dot(z, z);
    float smoothIteration =
        float(iteration)
        + 1.0
        - log2(
            log2(r2)
        );
    float t =
        smoothIteration /
        float(u_maxIteration);
    t =
        clamp(
            t,
            0.0,
            1.0
        );
    // コントラスト
    t =
        pow(t, 0.4);
    // ========================================
    // グレースケール
    // ========================================
    outColor =
        vec4(
            vec3(t),
            1.0
        );
}
`;
// ========================================
// Shader Compile
// ========================================
function createShader(type, source) {
    const shader =
        gl.createShader(type);
    gl.shaderSource(
        shader,
        source
    );
    gl.compileShader(shader);
    if (
        !gl.getShaderParameter(
            shader,
            gl.COMPILE_STATUS
        )
    ) {
        console.error(
            gl.getShaderInfoLog(shader)
        );
        throw new Error(
            "Shader compilation failed."
        );
    }
    return shader;
}
const vertexShader =
    createShader(
        gl.VERTEX_SHADER,
        vertexShaderSource
    );
const fragmentShader =
    createShader(
        gl.FRAGMENT_SHADER,
        fragmentShaderSource
    );
// ========================================
// Program
// ========================================
const program =
    gl.createProgram();
gl.attachShader(
    program,
    vertexShader
);
gl.attachShader(
    program,
    fragmentShader
);
gl.linkProgram(program);
if (
    !gl.getProgramParameter(
        program,
        gl.LINK_STATUS
    )
) {
    throw new Error(
        gl.getProgramInfoLog(program)
    );
}
gl.useProgram(program);
// ========================================
// Fullscreen Triangle
// ========================================
const vertices =
    new Float32Array([
        -1, -1,
         3, -1,
        -1,  3
    ]);
const buffer =
    gl.createBuffer();
gl.bindBuffer(
    gl.ARRAY_BUFFER,
    buffer
);
gl.bufferData(
    gl.ARRAY_BUFFER,
    vertices,
    gl.STATIC_DRAW
);
const positionLocation =
    gl.getAttribLocation(
        program,
        "a_position"
    );
gl.enableVertexAttribArray(
    positionLocation
);
gl.vertexAttribPointer(
    positionLocation,
    2,
    gl.FLOAT,
    false,
    0,
    0
);
// ========================================
// Uniform
// ========================================
const resolutionLocation =
    gl.getUniformLocation(
        program,
        "u_resolution"
    );
const centerLocation =
    gl.getUniformLocation(
        program,
        "u_center"
    );
const zoomLocation =
    gl.getUniformLocation(
        program,
        "u_zoom"
    );
const iterationLocation =
    gl.getUniformLocation(
        program,
        "u_maxIteration"
    );
// ========================================
// Draw
// ========================================
function draw() {
    const zoom =
        getZoom();
    const maxIteration =
        Math.min(
            2000,
            Math.floor(
                50 +
                logZoom * 20
            )
        );
    gl.useProgram(program);
    gl.uniform2f(
        resolutionLocation,
        canvas.width,
        canvas.height
    );
    gl.uniform2f(
        centerLocation,
        centerX,
        centerY
    );
    gl.uniform1f(
        zoomLocation,
        zoom
    );
    gl.uniform1i(
        iterationLocation,
        maxIteration
    );
    gl.drawArrays(
        gl.TRIANGLES,
        0,
        3
    );
    updateConsole("WebGL");
}
// ========================================
// Initial
// ========================================
canvas.width =
    window.innerWidth;
canvas.height =
    window.innerHeight;
gl.viewport(
    0,
    0,
    canvas.width,
    canvas.height
);
draw();
// ========================================
// Touch Start
// ========================================
canvas.addEventListener(
    "touchstart",
    (e) => {
        if (e.touches.length === 1) {
            dragging = true;
            lastX =
                e.touches[0].clientX;
            lastY =
                e.touches[0].clientY;
        }
        if (e.touches.length === 2) {
            dragging = false;
            const dx =
                e.touches[0].clientX -
                e.touches[1].clientX;
            const dy =
                e.touches[0].clientY -
                e.touches[1].clientY;
            pinchDistance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );
        }
    },
    { passive: false }
);
// ========================================
// Touch Move
// ========================================
canvas.addEventListener(
    "touchmove",
    (e) => {
        e.preventDefault();
        // ====================================
        // 1本指 → 移動
        // ====================================
        if (
            e.touches.length === 1 &&
            dragging
        ) {
            const touch =
                e.touches[0];
            const dx =
                touch.clientX -
                lastX;
            const dy =
                touch.clientY -
                lastY;
            lastX =
                touch.clientX;
            lastY =
                touch.clientY;
            const rangeX =
                3.5 / getZoom();
            const rangeY =
                2.0 / getZoom();
            centerX -=
                dx /
                canvas.width *
                rangeX;
            centerY -=
                dy /
                canvas.height *
                rangeY;
            draw();
        }
        // ====================================
        // 2本指 → ズーム
        // ====================================
        if (
            e.touches.length === 2
        ) {
            const dx =
                e.touches[0].clientX -
                e.touches[1].clientX;
            const dy =
                e.touches[0].clientY -
                e.touches[1].clientY;
            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );
            if (pinchDistance > 0) {
                const ratio =
                    distance /
                    pinchDistance;
                logZoom +=
                    Math.log2(ratio);
                logZoom =
                    Math.max(
                        -20,
                        Math.min(
                            logZoom,
                            1000
                        )
                    );
                draw();
            }
            pinchDistance =
                distance;
        }
    },
    { passive: false }
);
// ========================================
// Touch End
// ========================================
canvas.addEventListener(
    "touchend",
    () => {
        dragging = false;
        pinchDistance = 0;
        draw();
    }
);