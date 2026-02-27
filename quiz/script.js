list =[
        {
        question:"",
        answer:"",
    },

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
        question:"アセトアルデヒドは何に分解されるか",
        answer:"酢酸、水、二酸化炭素",
    },
    {
        question:"アルコール血中濃度の計算式は",
        answer:"(アルコール度数*飲酒量)/(体重*833)",
    },
    {
        question:"アルコールの分解にかかる時間の計算式は",
        answer:"(飲酒量*アルコル度数)*0.8/(体重*0.1)",
    },
    {
        question:"爽快期とほろ酔い期の脳の状態",
        answer:"大脳新皮質が麻痺、大脳辺縁系（＝本能・感情）の活発化",
    },
    {
        question:"ほろ酔い期の次とその時の脳の状態",
        answer:"酩酊期、小脳の麻痺",
    },
    {
        question:"酩酊期の次とその時の脳の状態",
        answer:"泥酔期、海馬＝（記憶中枢）が麻痺しブラックアウトする",
    },
    {
        question:"泥酔期の次とその時の脳の状態",
        answer:"昏睡期、延髄の麻痺",
    },
    {
        question:"楽しく飲めるのはアルコール血中濃度何％まで？",
        answer:"0.1%",
    },
    {
        question:"健康被害、慢性",
        answer:"アルコール性肝炎、アルコール依存症",
    },
    {
        question:"健康被害、急性",
        answer:"急性アルコール中毒、ブラックアウト",
    },
    {
        question:"社会的損失",
        answer:"アルコールハラスメント、飲酒運転、性被害",
    },
    {
        question:"アルコール依存症は",
        answer:"精神的・身体的健康を損なうとともに社会へ適応力を低下させる",
    },
    {
        question:"アルコール中毒→",
        answer:"一気飲みによって大脳と呼吸中枢が麻痺→急性アルコール中毒",
    },
    {
        question:"社会的問題",
        answer:"未成年の飲酒、飲酒運転事故、アルコールハラスメント、一気飲みの強要",
    },
    {
        question:"飲酒運転の罰則を定めた法",
        answer:"道路交通法",
    },
    {
        question:"日本の飲酒規制",
        answer:"未成年飲酒禁止法、道路交通法",
    },
    {
        question:"飲酒運転による懲罰",
        answer:"酒酔い<br>5年以下の懲役、100万円以下の罰金<br>酒気帯び<br>3年以下の懲役、50万円以下の罰金",
    },
    {
        question:"薬物乱用とは",
        answer:"医薬品を本来の目的から外れて使用したり、違法薬物を不正に使用すること。脳や神経に一時的な快感を与える。",
    },
    {
        question:"健康被害",
        answer:"中枢神経の破壊、幻覚、妄想、記憶力、内臓機能、運動能力の低下、依存症への恐怖、犯罪を誘発",
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
        answer.innerHTML = list[c].answer;
        submit.style.display = "none";
        next.style.display = "block";
        c++;
        fcon.innerHTML="c=" + c;
        if (c==len){
            c=0
        }
}
function nextf(){
    sentence.innerHTML = list[c].question;
    submit.style.display = "block";
    next.style.display = "none";
}
submitf();
scon.textContent = len;
answer.innerHTML = "Here display the answer of the question.";
