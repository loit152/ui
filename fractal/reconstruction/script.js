/*自動更新後で消す*/
setInterval(() => {
  location.reload();
}, 1000);
/*初期情報*/
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("webgl2");
const height = window.innerHeight;
const width = window.innerWidth;
/*info */
const zoom = document.getElementById("zoom");
const centerX = document.getElementById("zcenterX");
centerX.innerHTML = 
con.innerHTML += `height: ${height}, width: ${width}<br>`;