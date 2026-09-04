const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const consoleElement = document.getElementById("console");
// ==============================
// Canvas
// ==============================
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const width = canvas.width;
const height = canvas.height;
// ==============================
// Mandelbrot
// ==============================
// 表示する複素平面の中心
let centerX = -0.75;
let centerY = 0;
// ズーム倍率
let zoom = 1;
// ==============================
// Touch
// ==============================
let dragging = false;
let lastX = 0;
let lastY = 0;
let pinchDistance = 0;
// ==============================
// Console
// ==============================
// ログを追加する
function log(...messages) {
    consoleElement.textContent +=
        messages.join(" ") + "\n";
}
// 現在の状態を表示する
function updateConsole() {
    const rangeX = 3.5 / zoom;
    const rangeY = 2.0 / zoom;
    const maxIteration =
        Math.floor(50 + Math.log2(zoom) * 20);
    consoleElement.textContent =
`Mandelbrot Viewer
--------------------
zoom      : ${zoom.toFixed(4)}
centerX   : ${centerX.toFixed(8)}
centerY   : ${centerY.toFixed(8)}
rangeX    : ${rangeX.toFixed(8)}
rangeY    : ${rangeY.toFixed(8)}
iteration : ${maxIteration}
canvas    : ${width} × ${height}`;
}
// ==============================
// Drawing
// ==============================
function draw(step = 1) {
    const image =
        ctx.createImageData(width, height);
    const pixels = image.data;
    // ズームするほど計算回数を増やす
    const maxIteration =
        Math.floor(50 + Math.log2(zoom) * 20);
    // 現在表示している複素平面の範囲
    const rangeX = 3.5 / zoom;
    const rangeY = 2.0 / zoom;
    // ==========================
    // Pixel
    // ==========================
    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
            // --------------------------
            // Canvas座標 → 複素平面
            // --------------------------
            const real =
                centerX +
                (x / width - 0.5) * rangeX;
            const imag =
                centerY +
                (y / height - 0.5) * rangeY;
            // --------------------------
            // z = 0
            // --------------------------
            let zr = 0;
            let zi = 0;
            let iteration = 0;
            // --------------------------
            // Mandelbrot計算
            //
            // z(n+1) = z(n)^2 + c
            // --------------------------
            while (iteration < maxIteration) {
                const newZR =
                    zr * zr -
                    zi * zi +
                    real;
                const newZI =
                    2 * zr * zi +
                    imag;
                zr = newZR;
                zi = newZI;
                // |z| > 2
                // → 発散
                if (zr * zr + zi * zi > 4) {
                    break;
                }
                iteration++;
            }
            // ==========================
            // Color
            // ==========================let color;

if (iteration === maxIteration) {

    color = 0;

} else {

    const logZn =
        Math.log(zr * zr + zi * zi) / 2;

    const nu =
        Math.log(logZn / Math.log(2)) / Math.log(2);

    const smoothIteration =
        iteration + 1 - nu;

    color =
        Math.floor(
            255 * smoothIteration / maxIteration
        );
}
            // ==========================
            // step分のピクセルを塗る
            // ==========================
            for (let dy = 0; dy < step; dy++) {
                for (let dx = 0; dx < step; dx++) {
                    const px = x + dx;
                    const py = y + dy;
                    if (
                        px >= width ||
                        py >= height
                    ) {
                        continue;
                    }
                    const index =
                        (py * width + px) * 4;
                    pixels[index] =
                        color;
                    pixels[index + 1] =
                        color;
                    pixels[index + 2] =
                        color;
                    pixels[index + 3] =
                        255;
                }
            }
        }
    }
    // ==========================
    // Canvasへ描画
    // ==========================
    ctx.putImageData(image, 0, 0);
    // ==========================
    // Console更新
    // ==========================
    updateConsole();
}
// ==============================
// Initial draw
// ==============================
draw();
// ==============================
// Touch Start
// ==============================
canvas.addEventListener(
    "touchstart",
    (e) => {
        // --------------------------
        // 1本指
        // --------------------------
        if (e.touches.length === 1) {
            dragging = true;
            lastX =
                e.touches[0].clientX;
            lastY =
                e.touches[0].clientY;
        }
        // --------------------------
        // 2本指
        // --------------------------
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
    }
);
// ==============================
// Touch Move
// ==============================
canvas.addEventListener(
    "touchmove",
    (e) => {
        e.preventDefault();
        // ==========================
        // 1本指 → パン
        // ==========================
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
            // 現在の複素平面の範囲
            const rangeX =
                3.5 / zoom;
            const rangeY =
                2.0 / zoom;
            // Canvas上の移動量を
            // 複素平面上の移動量へ変換
            centerX -=
                dx / width * rangeX;
            centerY -=
                dy / height * rangeY;
            // 高速描画
            draw(4);
        }
        // ==========================
        // 2本指 → ピンチズーム
        // ==========================
        if (e.touches.length === 2) {
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
                // 指が離れる
                if (distance > pinchDistance) {
                    zoom *= 1.05;
                }
                // 指が近づく
                else {
                    zoom /= 1.05;
                }
                // 高速描画
                draw(4);
            }
            pinchDistance =
                distance;
        }
    },
    {
        passive: false
    }
);
// ==============================
// Touch End
// ==============================
canvas.addEventListener(
    "touchend",
    () => {
        dragging = false;
        pinchDistance = 0;
        // 最終的に高画質で描画
        draw(1);
    }
);