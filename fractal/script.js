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
// Rendering
// ========================================

// 通常時
let renderScale = 1.0;

// 移動中は低品質にする
let moving = false;

// 移動終了後の再描画タイマー
let renderTimer = null;


// ========================================
// Interaction
// ========================================

let dragging = false;

let lastMouseX = 0;
let lastMouseY = 0;

const pointers = new Map();

let lastPinchDistance = null;


// ========================================
// Vertex Shader
// ========================================

const vertexShaderSource = `#version 300 es

in vec2 a_position;

out vec2 v_position;

void main() {

    v_position = a_position;

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

in vec2 v_position;

out vec4 outColor;

uniform vec2 u_center;
uniform float u_zoom;
uniform vec2 u_resolution;


// ========================================
// Mandelbrot
// ========================================

void main() {

    float aspect =
        u_resolution.x /
        u_resolution.y;

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


    // -------------------------------
    // iteration
    // -------------------------------

    float maxIteration =
        100.0
        + log2(u_zoom) * 25.0;

    maxIteration =
        max(
            100.0,
            min(
                maxIteration,
                2000.0
            )
        );


    vec2 z = vec2(0.0);

    float iteration = 0.0;

    for (int i = 0; i < 2000; i++) {

        if (float(i) >= maxIteration) {
            break;
        }

        z = vec2(
            z.x * z.x - z.y * z.y,
            2.0 * z.x * z.y
        ) + c;

        if (dot(z, z) > 256.0) {
            break;
        }

        iteration++;
    }


    // -------------------------------
    // color
    // -------------------------------

    if (iteration >= maxIteration) {

        outColor =
            vec4(
                0.0,
                0.0,
                0.0,
                1.0
            );

    } else {

        float zn = length(z);

        float smoothIteration =
            iteration
            + 1.0
            - log2(log2(zn));

        float t =
            smoothIteration /
            maxIteration;

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
// Shader
// ========================================

function createShader(type, source) {

    const shader =
        gl.createShader(type);

    gl.shaderSource(
        shader,
        source
    );

    gl.compileShader(shader);

    if (!gl.getShaderParameter(
        shader,
        gl.COMPILE_STATUS
    )) {

        console.error(
            gl.getShaderInfoLog(shader)
        );

        throw new Error(
            "Shader compilation failed."
        );
    }

    return shader;
}


function createProgram(
    vertexSource,
    fragmentSource
) {

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


const program =
    createProgram(
        vertexShaderSource,
        fragmentShaderSource
    );

gl.useProgram(program);


// ========================================
// Fullscreen triangle
// ========================================

const vertices = new Float32Array([
    -1, -1,
     3, -1,
    -1,  3
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
        Math.floor(
            window.innerWidth * dpr
        );

    canvas.height =
        Math.floor(
            window.innerHeight * dpr
        );

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

    /*
     * renderScaleによって、
     * 実際に描画する解像度を下げる。
     *
     * 例:
     *
     * 1.0  → フル解像度
     * 0.5  → 1/4のピクセル数
     * 0.25 → 1/16のピクセル数
     */

    const width =
        Math.max(
            1,
            Math.floor(
                canvas.width * renderScale
            )
        );

    const height =
        Math.max(
            1,
            Math.floor(
                canvas.height * renderScale
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
        zoom
    );

    gl.uniform2f(
        resolutionLocation,
        width,
        height
    );


    gl.drawArrays(
        gl.TRIANGLES,
        0,
        3
    );


    /*
     * 描画した低解像度画像を
     * canvas全体へ拡大する
     */

    if (renderScale !== 1.0) {

        gl.viewport(
            0,
            0,
            canvas.width,
            canvas.height
        );

        gl.blitFramebuffer(
            0,
            0,
            width,
            height,
            0,
            0,
            canvas.width,
            canvas.height,
            gl.COLOR_BUFFER_BIT,
            gl.LINEAR
        );
    }


    updateConsole();
}


// ========================================
// 移動開始
// ========================================

function startMoving() {

    moving = true;

    /*
     * 移動中は計算量を落とす。
     *
     * 0.5ならピクセル数は約1/4。
     */

    renderScale = 0.5;

    draw();


    clearTimeout(renderTimer);
}


// ========================================
// 移動終了
// ========================================

function stopMoving() {

    clearTimeout(renderTimer);

    renderTimer = setTimeout(() => {

        moving = false;

        // 完全な解像度へ戻す
        renderScale = 1.0;

        draw();

    }, 120);
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
// Pointer Down
// ========================================

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


        // 1本指
        if (pointers.size === 1) {

            dragging = true;

            lastMouseX =
                event.clientX;

            lastMouseY =
                event.clientY;

            startMoving();
        }


        // 2本指
        if (pointers.size === 2) {

            dragging = false;

            const points =
                [...pointers.values()];

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


// ========================================
// Pointer Move
// ========================================

canvas.addEventListener(
    "pointermove",
    event => {

        if (!pointers.has(
            event.pointerId
        )) {
            return;
        }


        pointers.set(
            event.pointerId,
            {
                x: event.clientX,
                y: event.clientY
            }
        );


        // =================================
        // 1本指移動
        // =================================

        if (
            pointers.size === 1 &&
            dragging
        ) {

            const dx =
                event.clientX -
                lastMouseX;

            const dy =
                event.clientY -
                lastMouseY;


            const scale =
                2.0 /
                zoom /
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


        // =================================
        // 2本指ピンチ
        // =================================

        if (pointers.size === 2) {

            const points =
                [...pointers.values()];


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


            const factor =
                distance /
                lastPinchDistance;


            // 指2本の中心
            const mouseX =
                (x1 + x2) / 2;

            const mouseY =
                (y1 + y2) / 2;


            const rect =
                canvas.getBoundingClientRect();


            const px =
                mouseX - rect.left;

            const py =
                mouseY - rect.top;


            const aspect =
                canvas.clientWidth /
                canvas.clientHeight;


            // ズーム前
            const beforeX =
                centerX
                +
                (
                    px /
                    canvas.clientWidth
                    * 2
                    - 1
                )
                * aspect
                / zoom;


            const beforeY =
                centerY
                -
                (
                    py /
                    canvas.clientHeight
                    * 2
                    - 1
                )
                / zoom;


            // ズーム
            zoom *= factor;

            zoom =
                Math.max(
                    0.1,
                    Math.min(
                        zoom,
                        1e12
                    )
                );


            // ズーム後
            const afterX =
                centerX
                +
                (
                    px /
                    canvas.clientWidth
                    * 2
                    - 1
                )
                * aspect
                / zoom;


            const afterY =
                centerY
                -
                (
                    py /
                    canvas.clientHeight
                    * 2
                    - 1
                )
                / zoom;


            // 指の中心を固定
            centerX +=
                beforeX - afterX;

            centerY +=
                beforeY - afterY;


            lastPinchDistance =
                distance;


            draw();
        }
    }
);


// ========================================
// Pointer Up
// ========================================

canvas.addEventListener(
    "pointerup",
    event => {

        pointers.delete(
            event.pointerId
        );


        if (pointers.size === 0) {

            dragging = false;

            lastPinchDistance = null;

            stopMoving();
        }


        if (pointers.size === 1) {

            const point =
                [...pointers.values()][0];


            dragging = true;

            lastMouseX = point.x;
            lastMouseY = point.y;

            lastPinchDistance = null;
        }
    }
);


canvas.addEventListener(
    "pointercancel",
    event => {

        pointers.delete(
            event.pointerId
        );

        if (pointers.size === 0) {

            dragging = false;

            lastPinchDistance = null;

            stopMoving();
        }
    }
);


// ========================================
// Wheel Zoom
// ========================================

canvas.addEventListener(
    "wheel",
    event => {

        event.preventDefault();

        startMoving();


        const rect =
            canvas.getBoundingClientRect();


        const mouseX =
            event.clientX -
            rect.left;

        const mouseY =
            event.clientY -
            rect.top;


        const aspect =
            canvas.clientWidth /
            canvas.clientHeight;


        const beforeX =
            centerX
            +
            (
                mouseX /
                canvas.clientWidth
                * 2
                - 1
            )
            * aspect
            / zoom;


        const beforeY =
            centerY
            -
            (
                mouseY /
                canvas.clientHeight
                * 2
                - 1
            )
            / zoom;


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


        const afterX =
            centerX
            +
            (
                mouseX /
                canvas.clientWidth
                * 2
                - 1
            )
            * aspect
            / zoom;


        const afterY =
            centerY
            -
            (
                mouseY /
                canvas.clientHeight
                * 2
                - 1
            )
            / zoom;


        centerX +=
            beforeX - afterX;

        centerY +=
            beforeY - afterY;


        draw();

        stopMoving();
    },
    {
        passive: false
    }
);


// ========================================
// Initial
// ========================================

resize();