 /*初期値*/
document.querySelector('.mask-bg').classList.add('is-animated');
let heavy=document.getElementById('heavy');
	heavy.style.display="block";
let vol=document.getElementById('vol');
let amo=document.getElementById('amo');
let form=document.getElementById("sim");
let put=document.getElementById("put");
/*クリック時の動作*/
form.addEventListener("keydown",e =>{
	if(e.key !== "Enter") return;
	check(e);
});

let step=1
function create(e){
			let newDiv=document.createElement('div');
			newDiv.classList.add("div");
			newDiv.textContent=e;
			block.append(newDiv);
}
function check(e){
	e.preventDefault();
	if(step==1){
		let heavyValue=document.querySelector('[name="q1"]').value;
		if(heavyValue>0){
			step=2;
			vol.style.display="block";
			heavy.style.display="none";
			create(heavyValue);
			document.querySelector("[name='q2']").focus();
		}
	}
	else if(step==2){
		let volValue=document.querySelector('[name="q2"]').value;
		if(volValue>0){
			step=3;
			amo.style.display="block";
			vol.style.display="none";
			create(volValue);
			document.querySelector('[name="q3"]').focus();
		}
	}
	else if(step==3){
		let amoValue=document.querySelector('[name="q3"]').value;
		if(amoValue>0){
			step=4;
			amo.style.display="none";
			create(amoValue);
		}
	}
	else if(step>3)return;
}