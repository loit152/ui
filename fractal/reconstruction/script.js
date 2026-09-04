/*自動更新後で消す*/
setInterval(() => {
  location.reload();
}, 5000);

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("webgl2");
const height = canvas.height;
const width = canvas.width;
const con = document.getElementById("console");

con.innerHTML += `height: ${height}, width: ${width}<br>`;