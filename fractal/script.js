// ============================================================
// Mandelbrot Viewer
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
// Decimal
// ============================================================

Decimal.set({
    precision: 80,
    rounding: Decimal.ROUND_HALF_UP
});


// ============================================================
// WebGL2
// ============================================================

const gl =
    canvas.getContext("webgl2", {
        antialias: false,
        preserveDrawingBuffer: false
    });

if (!gl) {
    throw new Error("WebGL2 is not supported.");
}


// ============================================================
// Camera
// ============================================================

let centerX =
    new Decimal("-0.75");

let centerY =
    new Decimal("0");


// ============================================================
// Zoom
//
// zoom = mantissa × 10^exponent
// ============================================================

let zoomMantissa = 1.0;
let zoomExponent = 0;


// ============================================================
// Zoom
// ============================================================

function normalizeZoom() {

    while (zoomMantissa >= 10) {

        zoomMantissa /= 10;

        zoomExponent++;
    }

    while (
        zoomMantissa < 1 &&
        zoomMantissa > 0
    ) {

        zoomMantissa *= 10;

        zoomExponent--;
    }
}


function getZoomDecimal() {

    return new Decimal(
        zoomMantissa
    ).times(
        new Decimal(10).pow(
            zoomExponent
        )
    );
}


function multiplyZoom(factor) {

    zoomMantissa *= factor;

    normalizeZoom();
}


// ============================================================
// Rendering state
// ============================================================

let moving = false;

let renderScale = 1.0;

let renderTimer = null;


// ============================================================
// Pointer
// ============================================================

const pointers =
    new Map();

let dragging = false;

let lastMouseX = 0;
let lastMouseY = 0;

let lastPinchDistance = null;


// ============================================================
// Shader
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
// Mandelbrot Fragment Shader
// ============================================================

const fragmentShaderSource = `#version 300 es

precision highp float;

in vec2 v_position;

out vec4 outColor;


// ------------------------------------------------------------
// Camera
// ------------------------------------------------------------

uniform vec2 u_centerHigh;
uniform vec2 u_centerLow;

uniform float u_zoom;

uniform vec2 u_resolution;


// ------------------------------------------------------------
// Mandelbrot
// ------------------------------------------------------------

void main() {

    float aspect =
        u_resolution.x /
        u_resolution.y;


    // ----------------------------------------
    // pixel offset
    // ----------------------------------------

    vec2 offset =
        vec2(
            v_position.x
            * aspect
            / u_zoom,

            v_position.y
            / u_zoom
        );


    // ----------------------------------------
    // high + low
    //
    // centerを2つのfloatに分けて保持する
    // ----------------------------------------

    vec2 c =
        u_centerHigh
        +
        u_centerLow
        +
        offset;


    // ----------------------------------------
    // iteration
    // ----------------------------------------

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


    // ----------------------------------------
    // Mandelbrot
    // ----------------------------------------

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


        if (
            dot(z, z)
            >
            256.0
        ) {

            break;
        }


        iteration++;
    }


    // ----------------------------------------
    // Color
    // ----------------------------------------

    if (
        iteration
        >=
        maxIteration
    ) {

        outColor =
            vec4(
                0.0,
                0.0,
                0.0,
                1.0
            );

    } else {

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
// Texture upscale shader
// ============================================================

const upscaleFragmentShaderSource = `#version 300 es

precision highp float;

in vec2 v_position;

out vec4 outColor;

uniform sampler2D u_texture;

void main() {

    vec2 uv =
        v_position * 0.5
        + 0.5;

    outColor =
        texture(
            u_texture,
            uv
        );
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

        throw new Error(
            "Shader compilation failed."
        );
    }

    return shader;
}


// ============================================================
// Program creation
// ============================================================

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


// ============================================================
// Programs
// ============================================================

const mandelbrotProgram =
    createProgram(
        vertexShaderSource,
        fragmentShaderSource
    );


const upscaleProgram =
    createProgram(
        vertexShaderSource,
        upscaleFragmentShaderSource
    );


// ============================================================
// Fullscreen triangle
// ============================================================

const vertices =
    new Float32Array([

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


// ============================================================
// Attribute
// ============================================================

const mandelbrotPosition =
    gl.getAttribLocation(
        mandelbrotProgram,
        "a_position"
    );


const upscalePosition =
    gl.getAttribLocation(
        upscaleProgram,
        "a_position"
    );


// ============================================================
// Mandelbrot uniforms
// ============================================================

const centerHighLocation =
    gl.getUniformLocation(
        mandelbrotProgram,
        "u_centerHigh"
    );

const centerLowLocation =
    gl.getUniformLocation(
        mandelbrotProgram,
        "u_centerLow"
    );

const mandelbrotZoomLocation =
    gl.getUniformLocation(
        mandelbrotProgram,
        "u_zoom"
    );

const mandelbrotResolutionLocation =
    gl.getUniformLocation(
        mandelbrotProgram,
        "u_resolution"
    );


// ============================================================
// Upscale uniform
// ============================================================

const textureLocation =
    gl.getUniformLocation(
        upscaleProgram,
        "u_texture"
    );


// ============================================================
// FBO
// ============================================================

let renderTexture = null;

let renderFramebuffer = null;

let renderWidth = 0;
let renderHeight = 0;


// ============================================================
// Create / resize FBO
// ============================================================

function createRenderTarget(
    width,
    height
) {

    if (
        renderWidth === width &&
        renderHeight === height &&
        renderFramebuffer !== null
    ) {

        return;
    }


    if (renderTexture !== null) {
        gl.deleteTexture(
            renderTexture
        );
    }

    if (renderFramebuffer !== null) {
        gl.deleteFramebuffer(
            renderFramebuffer
        );
    }


    renderTexture =
        gl.createTexture();

    gl.bindTexture(
        gl.TEXTURE_2D,
        renderTexture
    );


    gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR
    );

    gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MAG_FILTER,
        gl.LINEAR
    );

    gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_S,
        gl.CLAMP_TO_EDGE
    );

    gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_T,
        gl.CLAMP_TO_EDGE
    );


    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA8,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
    );


    renderFramebuffer =
        gl.createFramebuffer();

    gl.bindFramebuffer(
        gl.FRAMEBUFFER,
        renderFramebuffer
    );


    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        renderTexture,
        0
    );


    if (
        gl.checkFramebufferStatus(
            gl.FRAMEBUFFER
        )
        !==
        gl.FRAMEBUFFER_COMPLETE
    ) {

        throw new Error(
            "Framebuffer is incomplete."
        );
    }


    gl.bindFramebuffer(
        gl.FRAMEBUFFER,
        null
    );


    renderWidth = width;
    renderHeight = height;
}


// ============================================================
// Decimal → high / low float
// ============================================================

function decimalToHighLow(value) {

    /*
     * Decimalの値を
     *
     * high = 大きい部分
     * low  = 残り
     *
     * に分ける。
     */

    const number =
        Number(value.toString());


    const high =
        Math.fround(number);


    const low =
        Number(
            value
                .minus(
                    new Decimal(
                        high.toString()
                    )
                )
                .toString()
        );


    return {
        high,
        low
    };
}


// ============================================================
// Camera uniforms
// ============================================================

function updateCameraUniforms() {

    const x =
        decimalToHighLow(
            centerX
        );

    const y =
        decimalToHighLow(
            centerY
        );


    gl.uniform2f(
        centerHighLocation,
        x.high,
        y.high
    );


    gl.uniform2f(
        centerLowLocation,
        x.low,
        y.low
    );


    gl.uniform1f(
        mandelbrotZoomLocation,
        Number(
            getZoomDecimal()
                .toSignificantDigits(15)
                .toString()
        )
    );
}


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
// Draw Mandelbrot
// ============================================================

function drawMandelbrot(
    width,
    height
) {

    gl.bindFramebuffer(
        gl.FRAMEBUFFER,
        renderFramebuffer
    );


    gl.viewport(
        0,
        0,
        width,
        height
    );


    gl.useProgram(
        mandelbrotProgram
    );


    gl.bindBuffer(
        gl.ARRAY_BUFFER,
        vertexBuffer
    );


    gl.enableVertexAttribArray(
        mandelbrotPosition
    );


    gl.vertexAttribPointer(
        mandelbrotPosition,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );


    updateCameraUniforms();


    gl.uniform2f(
        mandelbrotResolutionLocation,
        width,
        height
    );


    gl.drawArrays(
        gl.TRIANGLES,
        0,
        3
    );
}


// ============================================================
// Draw upscale
// ============================================================

function drawUpscale() {

    gl.bindFramebuffer(
        gl.FRAMEBUFFER,
        null
    );


    gl.viewport(
        0,
        0,
        canvas.width,
        canvas.height
    );


    gl.useProgram(
        upscaleProgram
    );


    gl.bindBuffer(
        gl.ARRAY_BUFFER,
        vertexBuffer
    );


    gl.enableVertexAttribArray(
        upscalePosition
    );


    gl.vertexAttribPointer(
        upscalePosition,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );


    gl.activeTexture(
        gl.TEXTURE0
    );


    gl.bindTexture(
        gl.TEXTURE_2D,
        renderTexture
    );


    gl.uniform1i(
        textureLocation,
        0
    );


    gl.drawArrays(
        gl.TRIANGLES,
        0,
        3
    );
}


// ============================================================
// Draw
// ============================================================

function draw() {

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


    createRenderTarget(
        width,
        height
    );


    drawMandelbrot(
        width,
        height
    );


    drawUpscale();


    updateConsole();
}


// ============================================================
// Moving
// ============================================================

function startMoving() {

    moving = true;

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
// Refining
// ============================================================

function stopMoving() {

    clearTimeout(
        renderTimer
    );


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
                 * 高品質描画
                 */

                draw();


                /*
                 * 次のフレームで
                 * 完了表示
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
// Status
// ============================================================

function setStatus(text) {

    statusElement.textContent =
        text;
}


// ============================================================
// Console
// ============================================================

function updateConsole() {

    coordinatesElement.innerHTML =
        `x: ${centerX.toSignificantDigits(15).toString()}<br>` +
        `y: ${centerY.toSignificantDigits(15).toString()}`;


    zoomElement.textContent =
        `zoom: ${zoomMantissa.toPrecision(6)}e${zoomExponent}`;
}


// ============================================================
// Screen → Complex
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


    const width =
        canvas.clientWidth;


    const height =
        canvas.clientHeight;


    const aspect =
        width /
        height;


    const zoom =
        getZoomDecimal();


    const normalizedX =
        new Decimal(x)
            .div(width)
            .times(2)
            .minus(1);


    const normalizedY =
        new Decimal(y)
            .div(height)
            .times(2)
            .minus(1);


    const complexX =
        centerX.plus(
            normalizedX
                .times(aspect)
                .div(zoom)
        );


    const complexY =
        centerY.minus(
            normalizedY
                .div(zoom)
        );


    return {
        x: complexX,
        y: complexY
    };
}


// ============================================================
// Zoom around point
// ============================================================

function zoomAround(
    screenX,
    screenY,
    factor
) {

    /*
     * ズーム前
     */

    const before =
        screenToComplex(
            screenX,
            screenY
        );


    /*
     * ズーム
     */

    multiplyZoom(
        factor
    );


    /*
     * ズーム後
     */

    const after =
        screenToComplex(
            screenX,
            screenY
        );


    /*
     * 中心を補正
     */

    centerX =
        centerX.plus(
            before.x.minus(
                after.x
            )
        );


    centerY =
        centerY.plus(
            before.y.minus(
                after.y
            )
        );
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
        // Pan
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


            const zoom =
                getZoomDecimal();


            const scale =
                new Decimal(2)
                    .div(
                        zoom
                    )
                    .div(
                        canvas.clientHeight
                    );


            centerX =
                centerX.minus(
                    new Decimal(dx)
                        .times(scale)
                );


            centerY =
                centerY.plus(
                    new Decimal(dy)
                        .times(scale)
                );


            lastMouseX =
                event.clientX;


            lastMouseY =
                event.clientY;


            draw();

            return;
        }


        // ====================================================
        // Pinch
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


            const centerScreenX =
                (x1 + x2) / 2;


            const centerScreenY =
                (y1 + y2) / 2;


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


        if (
            pointers.size === 0
        ) {

            dragging = false;

            lastPinchDistance = null;

            stopMoving();

            return;
        }


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

            lastPinchDistance = null;
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
// Wheel
// ============================================================

canvas.addEventListener(
    "wheel",
    event => {

        event.preventDefault();

        startMoving();


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
// Context menu
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