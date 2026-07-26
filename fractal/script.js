const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;

const image = ctx.createImageData(width, height);
const pixels = image.data;

for(let y=0; y<height; y++){

    for(let x=0; x<width; x++){

    }

}
const real = x / width * 3.5 - 2.5;
const imag = y / height * 2 - 1;
