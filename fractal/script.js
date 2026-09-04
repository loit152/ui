// ========================================
// Mandelbrot Viewer
// WebGL2
// ========================================
const canvas = document.getElementById("canvas");
const coordinates = document.getElementById("coordinates");
const zoomElement = document.getElementById("zoom");
const gl = canvas.getContext("webgl2");
if (!gl) {
    throw new Error("WebGL2 is not supported.");
}
// ========================================
// Camera
// ========================================
let centerX = -0.75;
let centerY = 0.0;
let zoom = 1.0;
// ========================================
// Interaction
// ========================================
let dragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
// ========================================
// Vertex Shader
// ========================================
const vertexShaderSource = `#version 300 es
in vec2 a_position;
out vec2 v_position;
void main() {
    v_position = a_position;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;
// ========================================
// Fragment Shader
// ========================================
const fragmentShaderSource = `#version 300 es
precision highp float;
in vec2 v_position;
out vec4 outColor;
// Camera
uniform vec2 u_center;
uniform float u_zoom;
uniform vec2 u_resolution;
// ========================================
// Mandelbrot
// ========================================
void main() {
    // ------------------------------------
    // Canvas -> complex plane
    // ------------------------------------
    float aspect = u_resolution.x / u_resolution.y;
    vec2 c;
    c.x =
        u_center.x
        + v_position.x
        * aspect
        / u_zoom;
    c.y =
        u_center.y
        + v_position.y
        / u_zoom;
    // ------------------------------------
    // Iteration count
    // ------------------------------------
    float maxIteration =
        100.0
        + log2(u_zoom) * 25.0;
    maxIteration = max(
        100.0,
        min(maxIteration, 2000.0)
    );
    // ------------------------------------
    // Mandelbrot iteration
    // ------------------------------------
    vec2 z = vec2(0.0);
    float iteration = 0.0;
    for (int i = 0; i < 2000; i++) {
        if (float(i) >= maxIteration) {
            break;
        }
        // z^2 + c
        z = vec2(
            z.x * z.x - z.y * z.y,
            2.0 * z.x * z.y
        ) + c;
        // Escape radius
        if (dot(z, z) > 256.0) {
            break;
        }
        iteration++;
    }
    // ------------------------------------
    // Coloring
    // ------------------------------------
    if (iteration >= maxIteration) {
        // Inside the Mandelbrot set
        outColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        // Smooth coloring
        float zn = length(z);
        float smoothIteration =
            iteration
            + 1.0
            - log2(log2(zn));
        float t =
            smoothIteration
            / maxIteration;
        // Black -> white
        float brightness =
            1.0 - pow(t, 0.35);
        outColor =
            vec4(
                brightness,
                brightness,
                brightness,
                1.0
            );
    }
}
`;
// ========================================
// Shader utilities
// ========================================
function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(
            gl.getShaderInfoLog(shader)
        );
        gl.deleteShader(shader);
        throw new Error("Shader compilation failed.");
    }
    return shader;
}
function createProgram(vertexSource, fragmentSource) {
    const vertexShader =
        createShader(
            gl.VERTEX_SHADER,
            vertexSource
        );
    const fragmentShader =
        createShader(
            gl.FRAGMENT_SHADER,
            fragmentSource
        );
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
    if (!gl.getProgramParameter(
        program,
        gl.LINK_STATUS
    )) {
        console.error(
            gl.getProgramInfoLog(program)
        );
        throw new Error(
            "Program linking failed."
        );
    }
    return program;
}
// ========================================
// Create program
// ========================================
const program =
    createProgram(
        vertexShaderSource,
        fragmentShaderSource
    );
gl.useProgram(program);
// ========================================
// Fullscreen rectangle
// ========================================
const vertices = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1
]);
const vertexBuffer =
    gl.createBuffer();
gl.bindBuffer(
    gl.ARRAY_BUFFER,
    vertexBuffer
);
gl.bufferData(
    gl.ARRAY_BUFFER,
    vertices,
    gl.STATIC_DRAW
);
// ========================================
// Attribute
// ========================================
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
// Uniforms
// ========================================
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
const resolutionLocation =
    gl.getUniformLocation(
        program,
        "u_resolution"
    );
// ========================================
// Resize
// ========================================
function resize() {
    const dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );
    canvas.width =
        window.innerWidth * dpr;
    canvas.height =
        window.innerHeight * dpr;
    gl.viewport(
        0,
        0,
        canvas.width,
        canvas.height
    );
    draw();
}
window.addEventListener(
    "resize",
    resize
);
// ========================================
// Draw
// ========================================
function draw() {
    gl.useProgram(program);
    gl.uniform2f(
        centerLocation,
        centerX,
        centerY
    );
    gl.uniform1f(
        zoomLocation,
        zoom
    );
    gl.uniform2f(
        resolutionLocation,
        canvas.width,
        canvas.height
    );
    gl.drawArrays(
        gl.TRIANGLES,
        0,
        6
    );
    updateConsole();
}
// ========================================
// Console
// ========================================
function updateConsole() {
    coordinates.textContent =
        `x: ${centerX.toPrecision(10)}
         y: ${centerY.toPrecision(10)}`;
    zoomElement.textContent =
        `zoom: ${zoom.toExponential(4)}`;
}
// ========================================
// Mouse Drag
// ========================================
canvas.addEventListener(
    "pointerdown",
    event => {
        dragging = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
        canvas.setPointerCapture(
            event.pointerId
        );
    }
);
canvas.addEventListener(
    "pointermove",
    event => {
        if (!dragging) {
            return;
        }
        const dx =
            event.clientX - lastMouseX;
        const dy =
            event.clientY - lastMouseY;
        const scale =
            2.0
            / zoom
            / canvas.clientHeight;
        centerX -=
            dx * scale;
        centerY +=
            dy * scale;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
        draw();
    }
);
canvas.addEventListener(
    "pointerup",
    event => {
        dragging = false;
        canvas.releasePointerCapture(
            event.pointerId
        );
    }
);
// ========================================
// Wheel Zoom
// ========================================
canvas.addEventListener(
    "wheel",
    event => {
        event.preventDefault();
        // Mouse position
        const rect =
            canvas.getBoundingClientRect();
        const mouseX =
            event.clientX - rect.left;
        const mouseY =
            event.clientY - rect.top;
        // Before zoom
        const aspect =
            canvas.clientWidth
            / canvas.clientHeight;
        const oldX =
            centerX
            + (
                mouseX
                / canvas.clientWidth
                * 2
                - 1
            )
            * aspect
            / zoom;
        const oldY =
            centerY
            - (
                mouseY
                / canvas.clientHeight
                * 2
                - 1
            )
            / zoom;
        // Zoom
        const factor =
            Math.exp(
                -event.deltaY * 0.001
            );
        zoom *= factor;
        zoom =
            Math.max(
                0.1,
                Math.min(
                    zoom,
                    1e12
                )
            );
        // After zoom
        const newX =
            centerX
            + (
                mouseX
                / canvas.clientWidth
                * 2
                - 1
            )
            * aspect
            / zoom;
        const newY =
            centerY
            - (
                mouseY
                / canvas.clientHeight
                * 2
                - 1
            )
            / zoom;
        // Keep mouse position fixed
        centerX += oldX - newX;
        centerY += oldY - newY;
        draw();
    },
    { passive: false }
);
// ========================================
// Initial draw
// ========================================
resize();