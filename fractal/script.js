// ============================================================
// Mandelbrot Viewer
// WebGL2
// ============================================================
// ============================================================
// DOM
// ============================================================
const canvas =
    document.getElementById("canvas");
const statusElement =
    document.getElementById("status");
const coordinatesElement =
    document.getElementById("coordinates");
const zoomElement =
    document.getElementById("zoom");
// ============================================================
// WebGL
// ============================================================
const gl =
    canvas.getContext("webgl2", {
        antialias: false,
        preserveDrawingBuffer: false
    });
if (!gl) {
    throw new Error(
        "WebGL2 is not supported."
    );
}
// ============================================================
// Camera
// ============================================================
let centerX = -0.75;
let centerY = 0.0;
// ============================================================
// Zoom
//
// zoom = mantissa × 10^exponent
//
// 例:
//
// 1
// 10
// 100
// 1.25 × 10^10
//
// のように扱う。
// ============================================================
let zoomMantissa = 1.0;
let zoomExponent = 0;
// ============================================================
// Zoom utilities
// ============================================================
function normalizeZoom() {
    while (zoomMantissa >= 10.0) {
        zoomMantissa /= 10.0;
        zoomExponent++;
    }
    while (
        zoomMantissa < 1.0 &&
        zoomMantissa > 0.0
    ) {
        zoomMantissa *= 10.0;
        zoomExponent--;
    }
}
function getZoom() {
    return zoomMantissa *
        Math.pow(
            10,
            zoomExponent
        );
}
function multiplyZoom(factor) {
    zoomMantissa *= factor;
    normalizeZoom();
}
// ============================================================
// Rendering state
// ============================================================
let renderScale = 1.0;
let moving = false;
let renderTimer = null;
// ============================================================
// Status
// ============================================================
function setStatus(text) {
    statusElement.textContent = text;
}
// ============================================================
// Pointer state
// ============================================================
const pointers =
    new Map();
let dragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let lastPinchDistance = null;
// ============================================================
// Vertex Shader
// ============================================================
const vertexShaderSource = `#version 300 es
in vec2 a_position;
out vec2 v_position;
void main() {
    v_position = a_position;
    gl_Position =
        vec4(
            a_position,
            0.0,
            1.0
        );
}
`;
// ============================================================
// Fragment Shader
// ============================================================
const fragmentShaderSource = `#version 300 es
precision highp float;
in vec2 v_position;
out vec4 outColor;
// Camera
uniform vec2 u_center;
uniform float u_zoom;
uniform vec2 u_resolution;
// ============================================================
// Mandelbrot
// ============================================================
void main() {
    // --------------------------------------------------------
    // Canvas → complex plane
    // --------------------------------------------------------
    float aspect =
        u_resolution.x /
        u_resolution.y;
    vec2 c;
    c.x =
        u_center.x
        +
        v_position.x
        *
        aspect
        /
        u_zoom;
    c.y =
        u_center.y
        +
        v_position.y
        /
        u_zoom;
    // --------------------------------------------------------
    // Iteration count
    // --------------------------------------------------------
    float maxIteration =
        100.0
        +
        log2(u_zoom)
        *
        25.0;
    maxIteration =
        max(
            100.0,
            min(
                maxIteration,
                2000.0
            )
        );
    // --------------------------------------------------------
    // Mandelbrot iteration
    // --------------------------------------------------------
    vec2 z =
        vec2(
            0.0,
            0.0
        );
    float iteration = 0.0;
    for (
        int i = 0;
        i < 2000;
        i++
    ) {
        if (
            float(i)
            >=
            maxIteration
        ) {
            break;
        }
        // z² + c
        z =
            vec2(
                z.x * z.x
                -
                z.y * z.y,
                2.0
                *
                z.x
                *
                z.y
            )
            +
            c;
        // Escape
        if (
            dot(z, z)
            >
            256.0
        ) {
            break;
        }
        iteration++;
    }
    // --------------------------------------------------------
    // Color
    // --------------------------------------------------------
    if (
        iteration
        >=
        maxIteration
    ) {
        // Mandelbrot set
        outColor =
            vec4(
                0.0,
                0.0,
                0.0,
                1.0
            );
    } else {
        // Smooth coloring
        float zn =
            length(z);
        float smoothIteration =
            iteration
            +
            1.0
            -
            log2(
                log2(zn)
            );
        float t =
            smoothIteration
            /
            maxIteration;
        float brightness =
            1.0
            -
            pow(
                t,
                0.35
            );
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
// ============================================================
// Shader creation
// ============================================================
function createShader(
    type,
    source
) {
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
        gl.deleteShader(shader);
        throw new Error(
            "Shader compilation failed."
        );
    }
    return shader;
}
// ============================================================
// Program creation
// ============================================================
function createProgram() {
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
        console.error(
            gl.getProgramInfoLog(program)
        );
        throw new Error(
            "Program linking failed."
        );
    }
    return program;
}
const program =
    createProgram();
gl.useProgram(program);
// ============================================================
// Fullscreen triangle
// ============================================================
const vertices =
    new Float32Array([
        -1.0, -1.0,
         3.0, -1.0,
        -1.0,  3.0
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
// ============================================================
// Uniforms
// ============================================================
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
// ============================================================
// Resize
// ============================================================
function resize() {
    const dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );
    canvas.width =
        Math.floor(
            window.innerWidth
            *
            dpr
        );
    canvas.height =
        Math.floor(
            window.innerHeight
            *
            dpr
        );
    draw();
}
window.addEventListener(
    "resize",
    resize
);
// ============================================================
// Draw
// ============================================================
function draw() {
    gl.useProgram(program);
    /*
     * 移動中は解像度を落とす。
     *
     * 0.5なら面積として約1/4。
     */
    const width =
        Math.max(
            1,
            Math.floor(
                canvas.width
                *
                renderScale
            )
        );
    const height =
        Math.max(
            1,
            Math.floor(
                canvas.height
                *
                renderScale
            )
        );
    gl.viewport(
        0,
        0,
        width,
        height
    );
    gl.uniform2f(
        centerLocation,
        centerX,
        centerY
    );
    gl.uniform1f(
        zoomLocation,
        getZoom()
    );
    gl.uniform2f(
        resolutionLocation,
        width,
        height
    );
    /*
     * WebGLの描画
     */
    gl.drawArrays(
        gl.TRIANGLES,
        0,
        3
    );
    /*
     * 低解像度時には、
     * ブラウザ側のcanvas表示領域で
     * 自動的に拡大される。
     */
    updateConsole();
}
// ============================================================
// Start moving
// ============================================================
function startMoving() {
    moving = true;
    /*
     * 移動中は50%解像度。
     *
     * 1920×1080なら
     *
     * 1920×1080
     * ↓
     * 960×540
     *
     * となり、
     * 計算するピクセル数は約1/4。
     */
    renderScale = 0.5;
    setStatus(
        "● MOVING"
    );
    clearTimeout(
        renderTimer
    );
    draw();
}
// ============================================================
// Stop moving
// ============================================================
function stopMoving() {
    clearTimeout(
        renderTimer
    );
    /*
     * 120ms操作がなければ
     * 移動終了と判断。
     */
    renderTimer =
        setTimeout(
            () => {
                moving = false;
                setStatus(
                    "◐ REFINING..."
                );
                /*
                 * フル解像度
                 */
                renderScale = 1.0;
                /*
                 * 高画質描画
                 */
                draw();
                /*
                 * WebGLへの描画命令を
                 *送ったあと表示をHDへ戻す。
                 */
                requestAnimationFrame(
                    () => {
                        setStatus(
                            "● HD"
                        );
                    }
                );
            },
            120
        );
}
// ============================================================
// Console
// ============================================================
function updateConsole() {
    coordinatesElement.innerHTML =
        `x: ${centerX.toPrecision(12)}<br>` +
        `y: ${centerY.toPrecision(12)}`;
    zoomElement.textContent =
        `zoom: ${zoomMantissa.toPrecision(6)}e${zoomExponent}`;
}
// ============================================================
// Screen → Complex coordinate
// ============================================================
function screenToComplex(
    screenX,
    screenY
) {
    const rect =
        canvas.getBoundingClientRect();
    const x =
        screenX -
        rect.left;
    const y =
        screenY -
        rect.top;
    const aspect =
        canvas.clientWidth
        /
        canvas.clientHeight;
    const zoomValue =
        getZoom();
    return {
        x:
            centerX
            +
            (
                x
                /
                canvas.clientWidth
                *
                2.0
                -
                1.0
            )
            *
            aspect
            /
            zoomValue,
        y:
            centerY
            -
            (
                y
                /
                canvas.clientHeight
                *
                2.0
                -
                1.0
            )
            /
            zoomValue
    };
}
// ============================================================
// Zoom around screen position
// ============================================================
function zoomAround(
    screenX,
    screenY,
    factor
) {
    /*
     * ズーム前の複素平面座標
     */
    const before =
        screenToComplex(
            screenX,
            screenY
        );
    /*
     * zoom変更
     */
    multiplyZoom(factor);
    /*
     * ズーム後の同じ画面位置の座標
     */
    const after =
        screenToComplex(
            screenX,
            screenY
        );
    /*
     * 位置を補正
     *
     * これによって、
     * 指やマウスの位置が
     * ズームの中心になる。
     */
    centerX +=
        before.x -
        after.x;
    centerY +=
        before.y -
        after.y;
}
// ============================================================
// Pointer Down
// ============================================================
canvas.addEventListener(
    "pointerdown",
    event => {
        pointers.set(
            event.pointerId,
            {
                x: event.clientX,
                y: event.clientY
            }
        );
        // ----------------------------
        // 1本指
        // ----------------------------
        if (
            pointers.size === 1
        ) {
            dragging = true;
            lastMouseX =
                event.clientX;
            lastMouseY =
                event.clientY;
            startMoving();
        }
        // ----------------------------
        // 2本指
        // ----------------------------
        if (
            pointers.size === 2
        ) {
            dragging = false;
            const points =
                [
                    ...pointers.values()
                ];
            lastPinchDistance =
                Math.hypot(
                    points[0].x -
                    points[1].x,
                    points[0].y -
                    points[1].y
                );
            startMoving();
        }
        canvas.setPointerCapture(
            event.pointerId
        );
    }
);
// ============================================================
// Pointer Move
// ============================================================
canvas.addEventListener(
    "pointermove",
    event => {
        if (
            !pointers.has(
                event.pointerId
            )
        ) {
            return;
        }
        pointers.set(
            event.pointerId,
            {
                x: event.clientX,
                y: event.clientY
            }
        );
        // ====================================================
        // 1本指 → Pan
        // ====================================================
        if (
            pointers.size === 1
            &&
            dragging
        ) {
            const dx =
                event.clientX -
                lastMouseX;
            const dy =
                event.clientY -
                lastMouseY;
            const zoomValue =
                getZoom();
            const scale =
                2.0
                /
                zoomValue
                /
                canvas.clientHeight;
            centerX -=
                dx * scale;
            centerY +=
                dy * scale;
            lastMouseX =
                event.clientX;
            lastMouseY =
                event.clientY;
            draw();
            return;
        }
        // ====================================================
        // 2本指 → Pinch
        // ====================================================
        if (
            pointers.size === 2
        ) {
            const points =
                [
                    ...pointers.values()
                ];
            const x1 =
                points[0].x;
            const y1 =
                points[0].y;
            const x2 =
                points[1].x;
            const y2 =
                points[1].y;
            const distance =
                Math.hypot(
                    x1 - x2,
                    y1 - y2
                );
            if (
                lastPinchDistance === null
            ) {
                lastPinchDistance =
                    distance;
                return;
            }
            if (
                distance <= 0
            ) {
                return;
            }
            const factor =
                distance /
                lastPinchDistance;
            /*
             * 2本指の中心
             */
            const centerScreenX =
                (x1 + x2) / 2;
            const centerScreenY =
                (y1 + y2) / 2;
            /*
             * ズーム
             */
            zoomAround(
                centerScreenX,
                centerScreenY,
                factor
            );
            lastPinchDistance =
                distance;
            draw();
        }
    }
);
// ============================================================
// Pointer Up
// ============================================================
canvas.addEventListener(
    "pointerup",
    event => {
        pointers.delete(
            event.pointerId
        );
        // 全ての指が離れた
        if (
            pointers.size === 0
        ) {
            dragging = false;
            lastPinchDistance = null;
            stopMoving();
            return;
        }
        /*
         * 2本 → 1本になった場合
         */
        if (
            pointers.size === 1
        ) {
            const point =
                [
                    ...pointers.values()
                ][0];
            dragging = true;
            lastMouseX =
                point.x;
            lastMouseY =
                point.y;
            lastPinchDistance =
                null;
        }
    }
);
// ============================================================
// Pointer Cancel
// ============================================================
canvas.addEventListener(
    "pointercancel",
    event => {
        pointers.delete(
            event.pointerId
        );
        if (
            pointers.size === 0
        ) {
            dragging = false;
            lastPinchDistance = null;
            stopMoving();
        }
    }
);
// ============================================================
// Wheel Zoom
// ============================================================
canvas.addEventListener(
    "wheel",
    event => {
        event.preventDefault();
        startMoving();
        /*
         * Wheelの速度を
         * ズーム倍率に変換
         */
        const factor =
            Math.exp(
                -event.deltaY
                *
                0.001
            );
        zoomAround(
            event.clientX,
            event.clientY,
            factor
        );
        draw();
        stopMoving();
    },
    {
        passive: false
    }
);
// ============================================================
// Prevent context menu
// ============================================================
canvas.addEventListener(
    "contextmenu",
    event => {
        event.preventDefault();
    }
);
// ============================================================
// Initial
// ============================================================
resize();