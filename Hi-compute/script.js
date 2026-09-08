const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

const xInput = document.querySelector("#coordinatex");
const yInput = document.querySelector("#coordinatey");
const result = document.querySelector("#input");

function calculate() {
    const x = Number(xInput.value);
    const y = Number(yInput.value);

    result.value = x * y;
}

xInput.addEventListener("input", calculate);
yInput.addEventListener("input", calculate);

calculate();