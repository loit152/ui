const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

const xInput = document.querySelector("#coordinatex");
const yInput = document.querySelector("#coordinatey");
const result = document.getElementById("result");

function calculate() {
    const x = Number(xInput.value);
    const y = Number(yInput.value);

    let r = x * y;
    let s = 0;

    while (r !== 0) {
        const i = r % 10;
        r = Math.floor(r / 10);
        s++;

        console.log(i);
    }

    result.innerHTML = `r = ${r}, s = ${s}`;
}

xInput.addEventListener("input", calculate);
yInput.addEventListener("input", calculate);

calculate();