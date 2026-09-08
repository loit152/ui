const canvas = document.getElementById("canvas");;
const gl = canvas.getContext("webgl2");
let x = 0;
let y = 0;
const input = document.querySelector("#input");

input.addEventListener("input" , () => {
    x = document.querySelector("#coordinatex").value;
    y = document.querySelector("#coordinatey").value;
    input.value = x * y;
    }
);