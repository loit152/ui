
/*状況確認用*/
const log = document.getElementById("log");
function debug(msg){
  const p = document.createElement("p");
  p.textContent = msg;
  log.append(p);
}
function c(e){
  try {
    e.preventDefault();
    // 通常処理
  } catch (err) {
    debug("ERROR: " + err.message);
  }
}
let con=document.getElementById('con');
 /*それぞれの入力値*/
let heavy=document.getElementById('heavy');
let vol=document.getElementById('vol');
let amo=document.getElementById('amo');
let sub=document.getElementsByClassName('sub')[0];
/*クリック時の動作*/
sub.addEventListener('click',check);
let step=1
	function create(e){
				let newDiv=document.createElement('div');
				newDiv.classList.add("div");
				newDiv.textContent=e;
				con.append(newDiv);
	}
	function check(e){
		e.preventDefault();
		if(step==1){
			let heavyValue=document.querySelector('#sim [name="q1"]').value;
			if(heavyValue>0){
				step=2;
				vol.style.display="block";
				heavy.style.display="none";
				create(heavyValue);
				document.querySelecaaator("[name='q2']").focus();
			}
		}
		else if(step==2){
			let volValue=document.querySelector('#sim [name="q2"]').value;
			if(volValue>0){
				step=3;
				amo.style.display="block";
				vol.style.display="none";
				create(volValue);
			}
		}
		else if(step==3){
			let amoValue=document.querySelector('#sim [name="q3"]').value;
			if(amoValue>0){
				step=4;
				amo.style.display="none";
				sub.style.display="none";
				create(amoValue);
			}
		}
		c(e);
	}
		
}
