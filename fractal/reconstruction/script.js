/*自動更新後で消す*/
setInterval(() => {
  location.reload();
}, 1000);

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("webgl2");
const height = window.innerHeight;
const width = window.innerWidth;


con.innerHTML += `height: ${height}, width: ${width}<br>`;