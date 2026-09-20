const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

const xInput = document.querySelector("#coordinatex");
const yInput = document.querySelector("#coordinatey");
const result = document.getElementById("result");

let a = 0;


xInput.addEventListener("input", calculate);
yInput.addEventListener("input", calculate);

document.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        yInput.value = a;
        calculate();
    }
});

calculate();