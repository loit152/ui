const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;

const image = ctx.createImageData(width, height);
const pixels = image.data;

for(let y=0; y<height; y++){

    for(let x=0; x<width; x++){
        const index = (y * width + x) * 4;
        pixels[index] = 255;      // 赤
        pixels[index + 1] = 0;    // 緑
        pixels[index + 2] = 0;    // 青
        pixels[index + 3] = 255;  // 不透明
    }

}
ctx.putImageData(image, 0, 0);

