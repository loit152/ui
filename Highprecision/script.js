const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

const xInput = document.querySelector("#coordinatex");
const yInput = document.querySelector("#coordinatey");
const result = document.getElementById("result");

let a = 0;

function calculate() {
    const x = Number(xInput.value);
    const y = Number(yInput.value);

    let r = x * y;
    const n = r;
    let s = 0;

    while (r !== 0) {
        const i = r % 10;
        r = Math.floor(r / 10);
        s++;
    }

    a = n;

    result.innerHTML = `n = ${n}, r = ${r}, s = ${s}`;
}

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