const canvas = document.getElementById("canvas");;
const gl = canvas.getContext("webgl2");
let x = 0;
let y = 0;
const input = document.querySelector("input");

input.addEventListener("input" , () => {
    x = document.querySelector("#coordinaterx").value;
    y = document.querySelector("#coordinatery").value;
    input.value = x * y;
    }
);