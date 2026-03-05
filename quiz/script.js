list =[
        {
        question:"",
        answer:"",
    },
]

/*trmprate   start copy from right→→→→
    {
        question:"",
        answer:"",
    },
*/
let submit = document.getElementById("submit");
let sentence = document.getElementById("sentence");
let answer = document.getElementById("answer");
let next = document.getElementById("next");
let fcon = document.getElementById("firstconsole");
let scon = document.getElementById("secondconsole");
let c=1
const len = list.length;
submit.onclick=submitf;
next.onclick = nextf;

function submitf(){
    answer.innerHTML = list[c-1].answer;
    submit.style.display = "none";
    next.style.display = "block";
    fcon.innerHTML="問題番号" + c;
    if (c==len){
        c=1
    }
}
function nextf(){
    c++;
    sentence.innerHTML = list[c-1].question;//問題文の更新
    submit.style.display = "block";
    next.style.display = "none";
}
//preset
next.style.display = "none";
sentence.innerHTML = list[c-1].question;//
scon.textContent = "問題数"+len;
answer.innerHTML = "Here display the answer of the question.";
