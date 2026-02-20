/* 初期値 */
document.querySelector(".mask-bg").classList.add("is-animated");

let heavy = document.getElementById("heavy");
let vol = document.getElementById("vol");
let amo = document.getElementById("amo");
let form = document.getElementById("sim");
let put = document.getElementById("put");
let block = document.getElementById("block");

heavy.style.display = "block";
vol.style.display = "none";
amo.style.display = "none";

/* Enterキー処理 */
form.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  check(e);
});

let step = 1;

function create(value) {
  let newDiv = document.createElement("div");
  newDiv.classList.add("div");
  newDiv.textContent = value;
  block.append(newDiv);
}

/* 計算関数（指定式） */
function calcAlcohol(weight, abv, amount) {

  const alcohol = amount * (abv / 100) * 0.8;

  const r = 0.65;

  const bac = alcohol / (weight * r) / 10;

  const time = alcohol / (weight * 0.1);

  return { alcohol, bac, time };
}

/* ステップ制御 */
function check(e) {
  e.preventDefault();

  if (step === 1) {
    let weight = Number(document.querySelector('[name="q1"]').value);
    if (weight > 0) {
      step = 2;
      heavy.style.display = "none";
      vol.style.display = "block";
      create(weight);
      document.querySelector('[name="q2"]').focus();
    }

  } else if (step === 2) {
    let abv = Number(document.querySelector('[name="q2"]').value);
    if (abv > 0) {
      step = 3;
      vol.style.display = "none";
      amo.style.display = "block";
      create(abv);
      document.querySelector('[name="q3"]').focus();
    }

  } else if (step === 3) {
    let weight = Number(document.querySelector('[name="q1"]').value);
    let abv = Number(document.querySelector('[name="q2"]').value);
    let amount = Number(document.querySelector('[name="q3"]').value);

    if (amount > 0) {
      step = 4;
      amo.style.display = "none";
      create(amount);

      const result = calcAlcohol(weight, abv, amount);

      put.innerHTML = `
        純アルコール量：${result.alcohol.toFixed(1)} g<br>
        推定血中アルコール濃度：${result.bac.toFixed(3)} %<br>
        分解時間：約${result.time.toFixed(1)} 時間
      `;
    }
  }
}