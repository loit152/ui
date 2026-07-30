const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const width = canvas.width;
const height = canvas.height;

const maxIteration = Math.floor(50 + Math.log2(zoom) * 20);
// 表示する複素平面
let centerX = -0.75;
let centerY = 0;
let zoom = 1;
let dragging = false;
let lastX = 0;
let lastY = 0;
let pinchDistance = 0;

function draw(step = 1) {

    const image = ctx.createImageData(width, height);
    const pixels = image.data;

    const rangeX = 3.5 / zoom;
    const rangeY = 2.0 / zoom;
for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {

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

            let color;

if (iteration === maxIteration) {
    color = 0;
} else {
    color = Math.floor(255 * iteration / maxIteration);
}


for(let dy = 0; dy < step; dy++){
    for(let dx = 0; dx < step; dx++){

        const px = x + dx;
        const py = y + dy;

        if(px >= width || py >= height) continue;

        const index = (py * width + px) * 4;

        pixels[index] = color;
        pixels[index + 1] = color;
        pixels[index + 2] = color;
        pixels[index + 3] = 255;
    }
}
        }
    }

    ctx.putImageData(image, 0, 0);
}

draw();



canvas.addEventListener("touchstart", (e)=>{

    if(e.touches.length === 1){

        dragging = true;

        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;

    }

    if(e.touches.length === 2){

        dragging = false;

        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;

        pinchDistance = Math.sqrt(dx * dx + dy * dy);
    }

});
canvas.addEventListener("touchmove",(e)=>{

    e.preventDefault();


    // 1本指 → 移動
    if(e.touches.length === 1 && dragging){

        const touch = e.touches[0];

        const dx = touch.clientX - lastX;
        const dy = touch.clientY - lastY;

        lastX = touch.clientX;
        lastY = touch.clientY;


        const rangeX = 3.5 / zoom;
        const rangeY = 2 / zoom;

        centerX -= dx / width * rangeX;
        centerY -= dy / height * rangeY;


        draw(4);
    }


    // 2本指 → ズーム
    if(e.touches.length === 2){

        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;

        const distance = Math.sqrt(dx * dx + dy * dy);


        if(pinchDistance > 0){

            if(distance > pinchDistance){
                zoom *= 1.05;
            }
            else{
                zoom /= 1.05;
            }

            draw(4);
        }


        pinchDistance = distance;
    }


}, {passive:false});


canvas.addEventListener("touchend",()=>{

    dragging = false;

    pinchDistance = 0;

    draw(1);

});