const canvas = document.getElementById("canvas");;
const gl = camvas.getContext("webgl2");
const x = 0;
const y = 0;
const multiplication = 0;
const input = document.querySelector("input");

input.addEventListener(input , () => {
    x = document.querySelector("coordinaterx");
    y = document.querySelector("coordinatery");
    multiplication = x * y;
    }
)