list =[
    {
        question:"アルコールはどのようなタイプの薬物か",    
        answer:"抑制剤",
    },
    {
        question:"主な作用は？",
        answer:"利尿、麻酔",
    },
    {
        question:"麻酔作用によって現れる症状は？",
        answer:"酔い、麻痺",
    },
    {
        question:"体内のどこで何％吸収され、分解されるか",
        answer:"胃で20%、大小腸で80%吸収され、肝臓で分解される",
    },
    {
        question:"分解されたアルコールは何になって何によって分解される？",
        answer:"アセトアルデヒドになり、アセトアルデヒド脱水素酵素/ALDH2型によって分解される",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
    {
        question:"",
        answer:"",
    },
]

/*
    {
        question:"",
        answer:"",
    },
*/
let submit = document.getElementById("submit");
let sentence = document.getElementById("sentence");
let answer = document.getElementById("answer");
let next = document.getElementById("next");
let fcon = documet.getElementById("firstconsole");
let scon = document.getElementById("secondconsole")
c=0
len = list.length;
submit.onclick=submitf;
next.onclick = nextf;
function submitf(){
        answer.textContent = list[c].answer;
        submit.style.display = "none";
        next.style.display = "block";
        c++;
        con.innerHTML="c=" + c;
        if (c==len){
            c=0
        }
}
function nextf(){
    sentence.textContent = list[c].question;
    submit.style.display = "block";
    next.style.display = "none";
}
submitf();
answer.innerHTML = "Here display the answer of the question.";
