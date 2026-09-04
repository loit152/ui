// ============================================================
// Mandelbrot Deep Zoom Viewer
// WebGL2 + BigInt fixed point + Perturbation
// ============================================================


// ============================================================
// Canvas
// ============================================================

const canvas = document.getElementById("canvas");

const gl = canvas.getContext("webgl2", {
    antialias: false,
    preserveDrawingBuffer: false
});

const consoleElement =
    document.getElementById("console");


if (!gl) {
    consoleElement.textContent =
        "WebGL2 is not supported.";
    throw new Error("WebGL2 is not supported.");
}


// ============================================================
// Console
// ============================================================

function updateConsole(extra = "") {

    consoleElement.textContent =
`Mandelbrot Viewer
--------------------
mode      : ${renderMode}
zoom      : ${formatZoom(zoom)}
centerX   : ${centerX.toString()}
centerY   : ${centerY.toString()}
iterations: ${maxIteration}
canvas    : ${canvas.width} × ${canvas.height}
${extra}`;
}


function formatZoom(z) {

    if (z < 100000) {
        return z.toFixed(2);
    }

    return z.toExponential(3);
}


// ============================================================
// Canvas size
// ============================================================

function resizeCanvas() {

    const dpr =
        Math.min(window.devicePixelRatio || 1, 2);

    canvas.width =
        Math.floor(window.innerWidth * dpr);

    canvas.height =
        Math.floor(window.innerHeight * dpr);

    canvas.style.width =
        window.innerWidth + "px";

    canvas.style.height =
        window.innerHeight + "px";

    gl.viewport(
        0,
        0,
        canvas.width,
        canvas.height
    );
}

resizeCanvas();


// ============================================================
// High precision fixed point
// ============================================================
//
// value = integer / 10^PRECISION
//
// BigIntを使うことでNumberより遥かに細かい
// 座標を保持する。
// ============================================================

const PRECISION = 120;

const SCALE =
    10n ** BigInt(PRECISION);


// 文字列 → BigInt固定小数点
function fp(str) {

    let negative = false;

    str = String(str);

    if (str.startsWith("-")) {
        negative = true;
        str = str.slice(1);
    }

    let [a, b = ""] =
        str.split(".");

    b =
        (b + "0".repeat(PRECISION))
        .slice(0, PRECISION);

    let value =
        BigInt(a || "0") * SCALE +
        BigInt(b || "0");

    return negative ? -value : value;
}


// BigInt固定小数点 → 文字列
function fpString(value, digits = 30) {

    const negative =
        value < 0n;

    if (negative) {
        value = -value;
    }

    const integer =
        value / SCALE;

    const fraction =
        value % SCALE;

    let fractionString =
        fraction.toString().padStart(
            PRECISION,
            "0"
        );

    fractionString =
        fractionString.slice(0, digits);

    return (
        negative ? "-" : ""
    ) +
    integer.toString() +
    "." +
    fractionString;
}


// BigInt → Number
//
// GPUへ渡すための近似値。
// 深層ズームでも「差分」は小さいので、
// ここでは基準点との差分に対して使用する。
// ============================================================

function fpToNumber(value) {

    return Number(
        value.toString()
    ) / Number(SCALE);
}


// ============================================================
// View
// ============================================================

let centerX = fp("-0.75");
let centerY = fp("0");

let zoom = 1;


// 表示範囲
const BASE_RANGE_X = 3.5;
const BASE_RANGE_Y = 2.0;


// ============================================================
// Iteration
// ============================================================

let maxIteration = 50;


function calculateIterations() {

    maxIteration =
        Math.floor(
            50 +
            Math.max(
                0,
                Math.log2(zoom)
            ) * 20
        );

    // GPU shader側の固定配列上限
    maxIteration =
        Math.min(maxIteration, 2000);
}


// ============================================================
// Render mode
// ============================================================

let renderMode = "direct";


// Number計算から摂動へ切り替える目安
//
// 実際には画面解像度・座標位置によって変わる。
// まずはかなり余裕を持たせる。
function updateRenderMode() {

    if (zoom < 1e10) {
        renderMode = "direct";
    }
    else {
        renderMode = "perturbation";
    }
}


// ============================================================
// Vertex Shader
// ============================================================

const vertexShaderSource = `#version 300 es

in vec2 position;

void main() {

    gl_Position =
        vec4(position, 0.0, 1.0);
}
`;


// ============================================================
// Fragment Shader
// ============================================================
//
// direct:
//     通常の Mandelbrot
//
// perturbation:
//     z = Z + dz
//
//     Z は基準軌道
//     dz は各ピクセル固有の微小な差
//
//     dz(n+1)
//       = 2 Z(n) dz(n)
//         + dz(n)^2
//         + dc
//
// ============================================================

const fragmentShaderSource = `#version 300 es

precision highp float;
precision highp int;

uniform vec2 resolution;

uniform vec2 center;

uniform float rangeX;
uniform float rangeY;

uniform int maxIteration;

uniform int mode;


// 基準軌道
uniform sampler2D referenceOrbit;

uniform int referenceLength;


// ============================================================
// Smooth coloring
// ============================================================

float smoothColor(
    int iteration,
    vec2 z
) {

    float mag2 =
        dot(z, z);

    float logZn =
        log(mag2) * 0.5;

    float nu =
        log(logZn / log(2.0))
        / log(2.0);

    return
        float(iteration) +
        1.0 -
        nu;
}


// ============================================================
// Palette
// ============================================================

vec3 palette(float t) {

    // コントラストを上げる
    t = pow(
        clamp(t, 0.0, 1.0),
        0.35
    );

    // 滑らかな周期色
    return 0.5 +
        0.5 *
        cos(
            6.2831853 *
            (t * 3.0 +
             vec3(0.0, 0.33, 0.67))
        );
}


// ============================================================
// Main
// ============================================================

out vec4 outColor;

void main() {

    vec2 pixel =
        gl_FragCoord.xy;

    vec2 uv =
        pixel / resolution;


    // ========================================================
    // Direct
    // ========================================================

    if (mode == 0) {

        float real =
            center.x +
            (uv.x - 0.5) *
            rangeX;

        float imag =
            center.y +
            (uv.y - 0.5) *
            rangeY;


        vec2 c =
            vec2(real, imag);

        vec2 z =
            vec2(0.0);

        int iteration = 0;


        for (
            int i = 0;
            i < 2000;
            i++
        ) {

            if (i >= maxIteration) {
                break;
            }


            z =
                vec2(
                    z.x * z.x -
                    z.y * z.y,

                    2.0 *
                    z.x *
                    z.y
                ) + c;


            if (dot(z, z) > 4.0) {
                iteration = i;
                break;
            }


            iteration = i + 1;
        }


        if (iteration >= maxIteration) {

            outColor =
                vec4(0.0, 0.0, 0.0, 1.0);

            return;
        }


        float value =
            smoothColor(
                iteration,
                z
            );


        float t =
            value /
            float(maxIteration);


        outColor =
            vec4(
                palette(t),
                1.0
            );

        return;
    }


    // ========================================================
    // Perturbation
    // ========================================================

    // 現在のピクセルと画面中心との距離
    vec2 dc =
        vec2(
            (uv.x - 0.5) * rangeX,
            (uv.y - 0.5) * rangeY
        );


    vec2 dz =
        vec2(0.0);


    vec2 z =
        vec2(0.0);


    int iteration = 0;


    // --------------------------------------------------------
    // 基準軌道を texture から取得
    // --------------------------------------------------------

    for (
        int i = 0;
        i < 2000;
        i++
    ) {

        if (i >= maxIteration) {
            break;
        }


        float fi =
            (float(i) + 0.5)
            / float(referenceLength);


        vec2 reference =
            texture(
                referenceOrbit,
                vec2(fi, 0.5)
            ).xy;


        // 摂動方程式
        dz =
            2.0 *
            vec2(
                reference.x * dz.x -
                reference.y * dz.y,

                reference.x * dz.y +
                reference.y * dz.x
            )
            +
            dz * dz
            +
            dc;


        z =
            reference +
            dz;


        if (dot(z, z) > 4.0) {

            iteration = i;
            break;
        }


        iteration = i + 1;
    }


    if (iteration >= maxIteration) {

        outColor =
            vec4(
                0.0,
                0.0,
                0.0,
                1.0
            );

        return;
    }


    float value =
        smoothColor(
            iteration,
            z
        );


    float t =
        value /
        float(maxIteration);


    outColor =
        vec4(
            palette(t),
            1.0
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


gl.useProgram(program);


// ============================================================
// Fullscreen quad
// ============================================================

const vertices = new Float32Array([

    -1, -1,
     1, -1,
    -1,  1,

    -1,  1,
     1, -1,
     1,  1
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
        "position"
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

const uniforms = {

    resolution:
        gl.getUniformLocation(
            program,
            "resolution"
        ),

    center:
        gl.getUniformLocation(
            program,
            "center"
        ),

    rangeX:
        gl.getUniformLocation(
            program,
            "rangeX"
        ),

    rangeY:
        gl.getUniformLocation(
            program,
            "rangeY"
        ),

    maxIteration:
        gl.getUniformLocation(
            program,
            "maxIteration"
        ),

    mode:
        gl.getUniformLocation(
            program,
            "mode"
        ),

    referenceOrbit:
        gl.getUniformLocation(
            program,
            "referenceOrbit"
        ),

    referenceLength:
        gl.getUniformLocation(
            program,
            "referenceLength"
        )
};


// ============================================================
// Reference orbit
// ============================================================
//
// CPU側で基準点の軌道を計算する。
//
// 本来はここを任意精度BigIntで完全に計算する。
// ============================================================

let referenceTexture = null;

let referenceData = null;

let referenceLength = 0;


// BigInt固定小数点による複素数演算
function mulFP(a, b) {

    return (
        a * b
    ) / SCALE;
}


function squareComplex(
    zr,
    zi
) {

    return {

        r:
            mulFP(zr, zr) -
            mulFP(zi, zi),

        i:
            2n *
            mulFP(zr, zi)
    };
}


// ============================================================
// Reference orbit generation
// ============================================================

function generateReferenceOrbit() {

    calculateIterations();


    referenceLength =
        maxIteration + 1;


    referenceData =
        new Float32Array(
            referenceLength * 2
        );


    let zr = 0n;
    let zi = 0n;


    for (
        let i = 0;
        i < referenceLength;
        i++
    ) {

        referenceData[i * 2] =
            fpToNumber(zr - centerX);

        referenceData[i * 2 + 1] =
            fpToNumber(zi - centerY);


        const squared =
            squareComplex(
                zr,
                zi
            );


        zr =
            squared.r +
            centerX;

        zi =
            squared.i +
            centerY;


        // 発散
        if (
            zr * zr +
            zi * zi >
            4n * SCALE * SCALE
        ) {

            for (
                let j = i + 1;
                j < referenceLength;
                j++
            ) {

                referenceData[j * 2] =
                    fpToNumber(
                        zr - centerX
                    );

                referenceData[j * 2 + 1] =
                    fpToNumber(
                        zi - centerY
                    );
            }

            break;
        }
    }


    // ========================================================
    // Texture
    // ========================================================

    if (!referenceTexture) {

        referenceTexture =
            gl.createTexture();
    }


    gl.bindTexture(
        gl.TEXTURE_2D,
        referenceTexture
    );


    gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.NEAREST
    );

    gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MAG_FILTER,
        gl.NEAREST
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
        gl.RG32F,
        referenceLength,
        1,
        0,
        gl.RG,
        gl.FLOAT,
        referenceData
    );
}


// ============================================================
// GPU render
// ============================================================

function render(step = 1) {

    updateRenderMode();

    calculateIterations();


    // WebGLでは現在のcenterの
    // Number近似を使用。
    //
    // 深いズームではここは基準点との差分のみ
    // 使用するようにする。


    const cx =
        fpToNumber(centerX);

    const cy =
        fpToNumber(centerY);


    const rangeX =
        BASE_RANGE_X / zoom;

    const rangeY =
        BASE_RANGE_Y / zoom;


    if (
        renderMode === "perturbation"
    ) {

        generateReferenceOrbit();


        gl.activeTexture(
            gl.TEXTURE0
        );

        gl.bindTexture(
            gl.TEXTURE_2D,
            referenceTexture
        );

        gl.uniform1i(
            uniforms.referenceOrbit,
            0
        );

        gl.uniform1i(
            uniforms.referenceLength,
            referenceLength
        );
    }


    gl.uniform2f(
        uniforms.resolution,
        canvas.width,
        canvas.height
    );


    gl.uniform2f(
        uniforms.center,
        cx,
        cy
    );


    gl.uniform1f(
        uniforms.rangeX,
        rangeX
    );


    gl.uniform1f(
        uniforms.rangeY,
        rangeY
    );


    gl.uniform1i(
        uniforms.maxIteration,
        maxIteration
    );


    gl.uniform1i(
        uniforms.mode,
        renderMode === "direct"
            ? 0
            : 1
    );


    gl.drawArrays(
        gl.TRIANGLES,
        0,
        6
    );


    updateConsole(
        `step      : ${step}`
    );
}


// ============================================================
// Initial
// ============================================================

render(1);


// ============================================================
// Touch control
// ============================================================

let dragging = false;

let lastX = 0;
let lastY = 0;

let pinchDistance = 0;


// ============================================================
// Touch Start
// ============================================================

canvas.addEventListener(
    "touchstart",
    (e) => {

        if (
            e.touches.length === 1
        ) {

            dragging = true;

            lastX =
                e.touches[0].clientX;

            lastY =
                e.touches[0].clientY;
        }


        if (
            e.touches.length === 2
        ) {

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
    }
);


// ============================================================
// Touch Move
// ============================================================

canvas.addEventListener(
    "touchmove",
    (e) => {

        e.preventDefault();


        // ====================================================
        // 1 finger → pan
        // ====================================================

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
                BASE_RANGE_X / zoom;

            const rangeY =
                BASE_RANGE_Y / zoom;


            // BigInt固定小数点へ変換
            const moveX =
                fp(
                    String(
                        dx /
                        window.innerWidth *
                        rangeX
                    )
                );

            const moveY =
                fp(
                    String(
                        dy /
                        window.innerHeight *
                        rangeY
                    )
                );


            centerX -= moveX;
            centerY -= moveY;


            // 再描画
            render(4);
        }


        // ====================================================
        // 2 fingers → pinch
        // ====================================================

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


            if (
                pinchDistance > 0
            ) {

                if (
                    distance >
                    pinchDistance
                ) {

                    zoom *= 1.05;

                } else {

                    zoom /= 1.05;
                }


                render(4);
            }


            pinchDistance =
                distance;
        }
    },
    {
        passive: false
    }
);


// ============================================================
// Touch End
// ============================================================

canvas.addEventListener(
    "touchend",
    () => {

        dragging = false;

        pinchDistance = 0;


        // 高精細再描画
        render(1);
    }
);


// ============================================================
// Resize
// ============================================================

window.addEventListener(
    "resize",
    () => {

        resizeCanvas();

        render(1);
    }
);