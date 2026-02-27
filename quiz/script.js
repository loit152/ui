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
        question:"薬物乱用とは",
        answer:"医薬品を本来の目的から外れれて使用したり、違法薬物を不正に使用すること。脳や神経に一時的な快感を与える。",
    },
    {
        question:"健康被害",
        answer:"中枢神経の破壊、幻想、妄想、記憶力、内臓機能、運動能力の低下、依存症への恐怖、犯罪を誘発",
    },
    {
        question:"恐ろしさ",
        answer:"精神依存、退薬症候、耐性の形成、フッシュバック、資金調達に奔走・翻弄",
    },
    {
        question:"薬物が切れると起こる症状",
        answer:"禁断症状",
    },
    {
        question:"依存になると抜け出すことが難しくなり、〜になる",
        answer:"薬物中毒",
    },
    {
        question:"薬物の種類",
        answer:"アヘン型、MDMA、コカイン型、覚醒剤、大麻、向精神薬、有機溶剤<br>抑制、興奮・幻覚、興奮、興奮・幻覚・フラシュバック、抑制、抑制、抑制",
    },
    {
        question:"近年のトピック<br>〜のとりすぎ<br>〜<br>〜<br>巧妙な手段での〜",
        answer:"カフェイン、医薬品のオーバードーズ、危険ドラッグ、密輸密売、",
    },
    {
        question:"麻薬や覚醒剤の亜種",
        answer:"危険ドラッグ",
    },
    {
        question:"その対策",
        answer:"医療品医療機器法で指定薬物に指定",
    },
    {
        question:"薬物四法",
        answer:"麻薬及びこう精神薬取締法、大麻取締法、アヘン方、覚せい剤取締法、",
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
let fcon = document.getElementById("firstconsole");
let scon = document.getElementById("secondconsole");
c=0
len = list.length;
submit.onclick=submitf;
next.onclick = nextf;
function submitf(){
        answer.textContent = list[c].answer;
        submit.style.display = "none";
        next.style.display = "block";
        c++;
        fcon.innerHTML="c=" + c;
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
scon.textContent = len;
answer.innerHTML = "Here display the answer of the question.";
