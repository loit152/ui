const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const width = canvas.width;
const height = canvas.height;

const image = ctx.createImageData(width, height);
const pixels = image.data;

const maxIteration = 100;

for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {

        // キャンバス座標 → 複素平面
        const real = x / width * 3.5 - 2.5;
        const imag = y / height * 2 - 1;

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

        const color = iteration === maxIteration ? 0 : 255;

        pixels[index] = color;
        pixels[index + 1] = color;
        pixels[index + 2] = color;
        pixels[index + 3] = 255;
    }
}

ctx.putImageData(image, 0, 0);
canvas.addEventListener("wheel", function (event) {

    event.preventDefault();

    const mx = event.offsetX;
    const my = event.offsetY;

    const rangeX = 3.5 / zoom;
    const rangeY = 2 / zoom;

    const beforeReal = centerX + (mx / width - 0.5) * rangeX;
    const beforeImag = centerY + (my / height - 0.5) * rangeY;

    if (event.deltaY < 0)
        zoom *= 1.2;
    else
        zoom /= 1.2;

    const newRangeX = 3.5 / zoom;
    const newRangeY = 2 / zoom;

    centerX = beforeReal - (mx / width - 0.5) * newRangeX;
    centerY = beforeImag - (my / height - 0.5) * newRangeY;

    draw();

}, { passive: false });