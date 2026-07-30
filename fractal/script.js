const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const width = canvas.width;
const height = canvas.height;

const maxIteration = 100;

// 表示する複素平面
let centerX = -0.75;
let centerY = 0;
let zoom = 1;

function draw() {

    const image = ctx.createImageData(width, height);
    const pixels = image.data;

    const rangeX = 3.5 / zoom;
    const rangeY = 2.0 / zoom;

    for (let y = 0; y < height; y++) {

        for (let x = 0; x < width; x++) {

            // キャンバス座標 → 複素平面
            const real = centerX + (x / width - 0.5) * rangeX;
            const imag = centerY + (y / height - 0.5) * rangeY;

            let zr = 0;
            let zi = 0;
            let iteration = 0;

            while (iteration < maxIteration) {

                const newZR = zr * zr - zi * zi + real;
                const newZI = 2 * zr * zi + imag;

                zr = newZR;
                zi = newZI;

                if (zr * zr + zi * zi > 4) {
                    break;
                }

                iteration++;
            }

            const index = (y * width + x) * 4;

            if (iteration === maxIteration) {
                pixels[index] = 0;
                pixels[index + 1] = 0;
                pixels[index + 2] = 0;
            } else {
                const color = Math.floor(255 * iteration / maxIteration);

                pixels[index] = color;
                pixels[index + 1] = color;
                pixels[index + 2] = color;
            }

            pixels[index + 3] = 255;
        }
    }

    ctx.putImageData(image, 0, 0);
}

draw();

// マウスホイールでズーム
canvas.addEventListener("wheel", function (event) {

    event.preventDefault();

    const mx = event.offsetX;
    const my = event.offsetY;

    const oldRangeX = 3.5 / zoom;
    const oldRangeY = 2.0 / zoom;

    // ズーム前のカーソル位置の複素数
    const beforeReal = centerX + (mx / width - 0.5) * oldRangeX;
    const beforeImag = centerY + (my / height - 0.5) * oldRangeY;

    if (event.deltaY < 0) {
        zoom *= 1.2;
    } else {
        zoom /= 1.2;
    }

    const newRangeX = 3.5 / zoom;
    const newRangeY = 2.0 / zoom;

    // カーソル位置が変わらないように中心を調整
    centerX = beforeReal - (mx / width - 0.5) * newRangeX;
    centerY = beforeImag - (my / height - 0.5) * newRangeY;

    draw();

}, { passive: false });