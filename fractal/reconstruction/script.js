const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("webgl2");
const height = document.HTMLCanvasElement.height;
const width = document.HTMLCanvasElement.width;
const console = document.getElementById("console");

console.innerHTML += `height: ${height}, width: ${width}<br>`;