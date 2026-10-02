"use strict";


/* ==================================================
   保存設定
================================================== */

const STORAGE_KEY =
    "problem-repeater-data-v1";

const SELECTED_SET_KEY =
    "problem-repeater-selected-set-v1";


/*
    暗記度の変化量
*/

const MASTERY_CORRECT = 10;
const MASTERY_WRONG = 15;


/* ==================================================
   DOM
================================================== */

const setList =
    document.getElementById("setList");

const selectedPanel =
    document.getElementById("selectedPanel");

const selectedSetNameElement =
    document.getElementById("selectedSetName");

const masteryPanel =
    document.getElementById("masteryPanel");

const averageMastery =
    document.getElementById("averageMastery");

const masteryList =
    document.getElementById("masteryList");

const rangeStart =
    document.getElementById("rangeStart");

const rangeEnd =
    document.getElementById("rangeEnd");

const startButton =
    document.getElementById("startButton");

const newSetButton =
    document.getElementById("newSetButton");

const editScreen =
    document.getElementById("editScreen");

const editTitle =
    document.getElementById("editTitle");

const editName =
    document.getElementById("editName");

const problemInput =
    document.getElementById("problemInput");

const saveEditButton =
    document.getElementById("saveEditButton");

const cancelEditButton =
    document.getElementById("cancelEditButton");

const quizScreen =
    document.getElementById("quizScreen");

const quizSetName =
    document.getElementById("quizSetName");

const progress =
    document.getElementById("progress");

const question =
    document.getElementById("question");

const knowButton =
    document.getElementById("knowButton");

const unknownButton =
    document.getElementById("unknownButton");

const answerScreen =
    document.getElementById("answerScreen");

const answer =
    document.getElementById("answer");

const completeScreen =
    document.getElementById("completeScreen");

const backButton =
    document.getElementById("backButton");

const resetPanel =
    document.getElementById("resetPanel");

const resetMasteryButton =
    document.getElementById("resetMasteryButton");

const resetAllButton =
    document.getElementById("resetAllButton");


/* ==================================================
   アプリ状態
================================================== */

/*
    problemSets の構造

    {
        "英単語": {
            problems: [
                {
                    question: "apple",
                    answer: "りんご",
                    mastery: 70
                }
            ]
        },

        "物理": {
            problems: [...]
        }
    }
*/

let problemSets = {};

let selectedSetName = null;


/*
    編集中のセット
*/

let editingSetName = null;


/* ==================================================
   クイズ状態
================================================== */

let quizProblems = [];

let quizIndex = 0;

let quizStart = 1;

let quizEnd = 1;


/*
    現在の問題
*/

let currentProblem = null;


/*
    現在の問題を

    わかる
    わからない

    のどちらで処理したか。

    答え画面から次へ進むために使う。
*/

let currentResult = null;


/* ==================================================
   初期化
================================================== */

loadData();

renderSetList();


if (selectedSetName) {

    selectSet(selectedSetName);

}


/* ==================================================
   データ読み込み
================================================== */

function loadData() {

    const saved =
        localStorage.getItem(STORAGE_KEY);


    if (saved) {

        try {

            const parsed =
                JSON.parse(saved);


            if (
                parsed &&
                typeof parsed === "object"
            ) {

                problemSets =
                    normalizeData(parsed);

            }

        } catch (error) {

            console.error(
                "データの読み込みに失敗しました。",
                error
            );

            problemSets = {};

        }

    }


    const savedSet =
        localStorage.getItem(
            SELECTED_SET_KEY
        );


    if (
        savedSet &&
        problemSets[savedSet]
    ) {

        selectedSetName = savedSet;

    }

}


/* ==================================================
   データ形式を整える
================================================== */

function normalizeData(data) {

    const result = {};


    for (const name of Object.keys(data)) {

        const value = data[name];


        /*
            新形式
        */

        if (
            value &&
            Array.isArray(value.problems)
        ) {

            result[name] = {

                problems:
                    value.problems.map(
                        problem => ({
                            question:
                                String(
                                    problem.question ?? ""
                                ),

                            answer:
                                String(
                                    problem.answer ?? ""
                                ),

                            mastery:
                                clampMastery(
                                    Number(
                                        problem.mastery
                                    ) || 0
                                )
                        })
                    )

            };

        }

    }


    return result;
}


/* ==================================================
   保存
================================================== */

function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(problemSets)
    );


    if (selectedSetName) {

        localStorage.setItem(
            SELECTED_SET_KEY,
            selectedSetName
        );

    } else {

        localStorage.removeItem(
            SELECTED_SET_KEY
        );

    }

}


/* ==================================================
   画面切り替え
================================================== */

function showOnly(screen) {

    editScreen.classList.add("hidden");

    quizScreen.classList.add("hidden");

    answerScreen.classList.add("hidden");

    completeScreen.classList.add("hidden");


    if (screen) {

        screen.classList.remove("hidden");

    }

}


/* ==================================================
   問題セット一覧表示
================================================== */

function renderSetList() {

    setList.innerHTML = "";


    const names =
        Object.keys(problemSets);


    if (names.length === 0) {

        const empty =
            document.createElement("p");

        empty.textContent =
            "問題セットがありません。";

        empty.style.color = "#777";

        setList.appendChild(empty);

        selectedPanel.classList.add("hidden");

        masteryPanel.classList.add("hidden");

        resetPanel.classList.add("hidden");

        return;

    }


    for (const name of names) {

        const set =
            problemSets[name];


        const item =
            document.createElement("div");

        item.className =
            "set-item";


        /* -------------------------
           選択ボタン
        ------------------------- */

        const select =
            document.createElement("button");

        select.type = "button";

        select.className =
            "set-select";


        if (name === selectedSetName) {

            select.classList.add("active");

        }


        const nameElement =
            document.createElement("span");

        nameElement.className =
            "set-name";

        nameElement.textContent =
            name;


        const info =
            document.createElement("span");

        info.className =
            "set-info";

        const average =
            calculateAverageMastery(
                set.problems
            );


        info.textContent =
            `${set.problems.length}問　暗記度 ${average}%`;


        select.appendChild(
            nameElement
        );

        select.appendChild(
            info
        );


        select.addEventListener(
            "click",
            () => {
                selectSet(name);
            }
        );


        /* -------------------------
           編集
        ------------------------- */

        const edit =
            document.createElement("button");

        edit.type = "button";

        edit.className =
            "set-action";

        edit.textContent =
            "編集";


        edit.addEventListener(
            "click",
            () => {
                openEditor(name);
            }
        );


        /* -------------------------
           削除
        ------------------------- */

        const remove =
            document.createElement("button");

        remove.type = "button";

        remove.className =
            "set-action";

        remove.textContent =
            "削除";


        remove.addEventListener(
            "click",
            () => {
                deleteSet(name);
            }
        );


        item.appendChild(select);

        item.appendChild(edit);

        item.appendChild(remove);


        setList.appendChild(item);

    }


    updateSelectedPanel();

}


/* ==================================================
   セット選択
================================================== */

function selectSet(name) {

    if (!problemSets[name]) {

        return;

    }


    selectedSetName =
        name;


    saveData();

    renderSetList();

    updateSelectedPanel();

}


/* ==================================================
   選択セットの表示
================================================== */

function updateSelectedPanel() {

    if (
        !selectedSetName ||
        !problemSets[selectedSetName]
    ) {

        selectedPanel.classList.add(
            "hidden"
        );

        masteryPanel.classList.add(
            "hidden"
        );

        resetPanel.classList.add(
            "hidden"
        );

        return;

    }


    const problems =
        problemSets[
            selectedSetName
        ].problems;


    selectedPanel.classList.remove(
        "hidden"
    );

    masteryPanel.classList.remove(
        "hidden"
    );

    resetPanel.classList.remove(
        "hidden"
    );


    selectedSetNameElement.textContent =
        selectedSetName;


    rangeStart.max =
        problems.length;

    rangeEnd.max =
        problems.length;


    rangeStart.value = 1;

    rangeEnd.value =
        problems.length;


    renderMastery(problems);

}


/* ==================================================
   新規セット
================================================== */

newSetButton.addEventListener(
    "click",
    () => {

        openEditor(null);

    }
);


/* ==================================================
   編集画面
================================================== */

function openEditor(name) {

    editingSetName =
        name;


    if (name === null) {

        editTitle.textContent =
            "新しい問題セット";

        editName.value =
            "";

        problemInput.value =
            "";

    } else {

        editTitle.textContent =
            "問題セットを編集";


        editName.value =
            name;


        const problems =
            problemSets[name].problems;


        problemInput.value =
            problems
                .map(
                    problem =>
                        `${problem.question} / ${problem.answer}`
                )
                .join("\n");

    }


    showOnly(editScreen);


    editName.focus();

}


/* ==================================================
   問題文字列を解析
================================================== */

function parseProblems(text) {

    const lines =
        text.split(/\r?\n/);


    const problems = [];


    for (const line of lines) {

        const trimmed =
            line.trim();


        if (!trimmed) {

            continue;

        }


        const index =
            trimmed.indexOf("/");


        if (index === -1) {

            continue;

        }


        const questionText =
            trimmed
                .slice(0, index)
                .trim();


        const answerText =
            trimmed
                .slice(index + 1)
                .trim();


        if (
            !questionText ||
            !answerText
        ) {

            continue;

        }


        problems.push({

            question:
                questionText,

            answer:
                answerText

        });

    }


    return problems;

}


/* ==================================================
   編集内容保存
================================================== */

saveEditButton.addEventListener(
    "click",
    saveEditor
);


function saveEditor() {

    const name =
        editName.value.trim();


    if (!name) {

        alert(
            "セット名を入力してください。"
        );

        return;

    }


    const parsedProblems =
        parseProblems(
            problemInput.value
        );


    if (parsedProblems.length === 0) {

        alert(
            "問題がありません。\n" +
            "「問題 / 答え」の形式で入力してください。"
        );

        return;

    }


    /*
        名前の重複を防ぐ
    */

    if (
        name !== editingSetName &&
        problemSets[name]
    ) {

        alert(
            "その名前の問題セットは既に存在します。"
        );

        return;

    }


    /*
        以前の問題と一致するものについて
        暗記度を引き継ぐ。

        同じ問題が複数ある場合に備えて、
        一度使ったものは再利用しない。
    */

    let oldProblems = [];


    if (
        editingSetName !== null &&
        problemSets[editingSetName]
    ) {

        oldProblems =
            problemSets[
                editingSetName
            ].problems.map(
                problem => ({
                    ...problem
                })
            );

    }


    const newProblems =
        parsedProblems.map(
            problem => {

                const oldIndex =
                    oldProblems.findIndex(
                        old =>
                            old.question ===
                                problem.question
                            &&
                            old.answer ===
                                problem.answer
                    );


                if (oldIndex !== -1) {

                    const old =
                        oldProblems[
                            oldIndex
                        ];


                    oldProblems.splice(
                        oldIndex,
                        1
                    );


                    return {

                        question:
                            problem.question,

                        answer:
                            problem.answer,

                        mastery:
                            clampMastery(
                                old.mastery
                            )

                    };

                }


                return {

                    question:
                        problem.question,

                    answer:
                        problem.answer,

                    mastery:
                        0

                };

            }
        );


    /*
        名前変更
    */

    if (
        editingSetName !== null &&
        editingSetName !== name
    ) {

        delete problemSets[
            editingSetName
        ];

    }


    problemSets[name] = {

        problems:
            newProblems

    };


    selectedSetName =
        name;


    saveData();

    renderSetList();

    updateSelectedPanel();

    showMainScreen();

}


/* ==================================================
   編集キャンセル
================================================== */

cancelEditButton.addEventListener(
    "click",
    showMainScreen
);


function showMainScreen() {

    showOnly(null);

    renderSetList();

    updateSelectedPanel();

}


/* ==================================================
   セット削除
================================================== */

function deleteSet(name) {

    const confirmed =
        confirm(
            `「${name}」を削除しますか？`
        );


    if (!confirmed) {

        return;

    }


    delete problemSets[name];


    if (
        selectedSetName === name
    ) {

        const names =
            Object.keys(problemSets);


        selectedSetName =
            names.length > 0
                ? names[0]
                : null;

    }


    saveData();

    renderSetList();

    updateSelectedPanel();

}


/* ==================================================
   暗記度
================================================== */

function clampMastery(value) {

    return Math.max(
        0,
        Math.min(
            100,
            Math.round(value)
        )
    );

}


/* ==================================================
   平均暗記度
================================================== */

function calculateAverageMastery(
    problems
) {

    if (problems.length === 0) {

        return 0;

    }


    const total =
        problems.reduce(
            (sum, problem) =>
                sum + problem.mastery,
            0
        );


    return Math.round(
        total / problems.length
    );

}


/* ==================================================
   暗記度一覧
================================================== */

function renderMastery(problems) {

    masteryList.innerHTML = "";


    const average =
        calculateAverageMastery(
            problems
        );


    averageMastery.textContent =
        `${average}%`;


    problems.forEach(
        (problem, index) => {

            const item =
                document.createElement("div");

            item.className =
                "mastery-item";


            const number =
                document.createElement("span");

            number.className =
                "mastery-number";

            number.textContent =
                index + 1;


            const questionText =
                document.createElement("span");

            questionText.className =
                "mastery-question";

            questionText.textContent =
                problem.question;


            const bar =
                document.createElement("div");

            bar.className =
                "mastery-bar";


            const fill =
                document.createElement("div");

            fill.className =
                "mastery-fill";

            fill.style.width =
                `${problem.mastery}%`;


            bar.appendChild(fill);


            const value =
                document.createElement("span");

            value.className =
                "mastery-value";

            value.textContent =
                `${problem.mastery}%`;


            item.appendChild(number);

            item.appendChild(questionText);

            item.appendChild(bar);

            item.appendChild(value);


            masteryList.appendChild(item);

        }
    );

}


/* ==================================================
   クイズ開始
================================================== */

startButton.addEventListener(
    "click",
    startQuiz
);


function startQuiz() {

    if (
        !selectedSetName ||
        !problemSets[selectedSetName]
    ) {

        return;

    }


    const problems =
        problemSets[
            selectedSetName
        ].problems;


    const start =
        Number(rangeStart.value);


    const end =
        Number(rangeEnd.value);


    if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < 1 ||
        end > problems.length ||
        start > end
    ) {

        alert(
            "出題範囲が正しくありません。"
        );

        return;

    }


    quizStart = start;

    quizEnd = end;


    /*
        元データを直接変更しない。

        sliceしてコピーを作る。
    */

    quizProblems =
        problems
            .slice(
                start - 1,
                end
            )
            .map(
                (problem, index) => ({

                    originalIndex:
                        start - 1 + index,

                    question:
                        problem.question,

                    answer:
                        problem.answer,

                    mastery:
                        problem.mastery

                })
            );


    /*
        暗記度が低い問題ほど
        最初から出やすくする。
    */

    weightedShuffle(
        quizProblems
    );


    quizIndex = 0;

    currentProblem = null;

    currentResult = null;


    quizSetName.textContent =
        selectedSetName;


    showQuestion();

}


/* ==================================================
   暗記度を考慮したシャッフル
================================================== */

function weightedShuffle(array) {

    /*
        重み

        暗記度 0%   → 101
        暗記度 50%  → 51
        暗記度 100% → 1

        覚えていない問題ほど
        選ばれやすくなる。
    */

    const result = [];


    const remaining =
        [...array];


    while (
        remaining.length > 0
    ) {

        let totalWeight = 0;


        for (const problem of remaining) {

            totalWeight +=
                101 - problem.mastery;

        }


        let random =
            Math.random() *
            totalWeight;


        let selectedIndex = 0;


        for (
            let i = 0;
            i < remaining.length;
            i++
        ) {

            random -=
                101 -
                remaining[i].mastery;


            if (random <= 0) {

                selectedIndex = i;

                break;

            }

        }


        result.push(
            remaining[selectedIndex]
        );


        remaining.splice(
            selectedIndex,
            1
        );

    }


    array.length = 0;

    array.push(...result);

}


/* ==================================================
   問題表示
================================================== */

function showQuestion() {

    /*
        残りが0なら完了
    */

    if (
        quizProblems.length === 0
    ) {

        showComplete();

        return;

    }


    /*
        一周したら、
        残っている問題を再シャッフル。
    */

    if (
        quizIndex >=
        quizProblems.length
    ) {

        quizIndex = 0;

        weightedShuffle(
            quizProblems
        );

    }


    currentProblem =
        quizProblems[
            quizIndex
        ];


    question.textContent =
        currentProblem.question;


    progress.textContent =
        `${quizIndex + 1} / ${quizProblems.length}`;


    showOnly(quizScreen);

}


/* ==================================================
   わかる
================================================== */

knowButton.addEventListener(
    "click",
    markKnown
);


function markKnown() {

    if (!currentProblem) {

        return;

    }


    currentResult =
        "known";


    /*
        元データの暗記度を更新
    */

    updateMastery(
        currentProblem,
        MASTERY_CORRECT
    );


    /*
        今回の出題リストから削除。

        「わかる」なので
        もう今回の周回では出さない。
    */

    quizProblems.splice(
        quizIndex,
        1
    );


    saveData();


    answer.textContent =
        currentProblem.answer;


    showOnly(answerScreen);

}


/* ==================================================
   わからない
================================================== */

unknownButton.addEventListener(
    "click",
    markUnknown
);


function markUnknown() {

    if (!currentProblem) {

        return;

    }


    currentResult =
        "unknown";


    /*
        暗記度を下げる。
    */

    updateMastery(
        currentProblem,
        -MASTERY_WRONG
    );


    /*
        今回のリストからは削除しない。

        indexだけ進めるので、
        一周後にもう一度出る。
    */

    quizIndex++;


    saveData();


    answer.textContent =
        currentProblem.answer;


    showOnly(answerScreen);

}


/* ==================================================
   暗記度更新
================================================== */

function updateMastery(
    quizProblem,
    change
) {

    const set =
        problemSets[
            selectedSetName
        ];


    if (!set) {

        return;

    }


    /*
        問題の内容を使って
        元データを探す。
    */

    const original =
        set.problems.find(
            problem =>
                problem.question ===
                    quizProblem.question
                &&
                problem.answer ===
                    quizProblem.answer
        );


    if (!original) {

        return;

    }


    original.mastery =
        clampMastery(
            original.mastery +
            change
        );


    /*
        クイズ側にも反映
    */

    quizProblem.mastery =
        original.mastery;


    renderSetList();

    updateSelectedPanel();

}


/* ==================================================
   答え → 次の問題
================================================== */

answerScreen.addEventListener(
    "click",
    () => {

        nextQuestion();

    }
);


function nextQuestion() {

    currentProblem = null;

    currentResult = null;

    showQuestion();

}


/* ==================================================
   キーボード
================================================== */

document.addEventListener(
    "keydown",
    function(event) {

        /*
            編集中はショートカットを無効にする。
        */

        if (
            !editScreen.classList.contains(
                "hidden"
            )
        ) {

            return;

        }


        /*
            入力欄にフォーカスしている場合、
            矢印キーなどを奪わない。
        */

        if (
            event.target.tagName ===
                "INPUT"
            ||
            event.target.tagName ===
                "TEXTAREA"
        ) {

            return;

        }


        /*
            問題画面
        */

        if (
            !quizScreen.classList.contains(
                "hidden"
            )
        ) {

            if (
                event.key ===
                "ArrowRight"
            ) {

                event.preventDefault();

                markKnown();

                return;

            }


            if (
                event.key ===
                "ArrowLeft"
            ) {

                event.preventDefault();

                markUnknown();

                return;

            }

        }


        /*
            答え画面
        */

        if (
            !answerScreen.classList.contains(
                "hidden"
            )
        ) {

            if (
                event.key ===
                " "
            ) {

                event.preventDefault();

                nextQuestion();

            }

        }

    }
);


/* ==================================================
   Enter
================================================== */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key !== "Enter"
        ) {

            return;

        }


        /*
            問題画面なら
            Enter = わかる
        */

        if (
            !quizScreen.classList.contains(
                "hidden"
            )
        ) {

            event.preventDefault();

            markKnown();

        }

    }
);


/* ==================================================
   完了
================================================== */

function showComplete() {

    currentProblem = null;

    showOnly(completeScreen);

}


/* ==================================================
   戻る
================================================== */

backButton.addEventListener(
    "click",
    showMainScreen
);


/* ==================================================
   暗記度リセット
================================================== */

resetMasteryButton.addEventListener(
    "click",
    resetMastery
);


function resetMastery() {

    if (
        !selectedSetName ||
        !problemSets[selectedSetName]
    ) {

        return;

    }


    const confirmed =
        confirm(
            `「${selectedSetName}」の暗記度をすべて0%にしますか？`
        );


    if (!confirmed) {

        return;

    }


    for (
        const problem of
        problemSets[
            selectedSetName
        ].problems
    ) {

        problem.mastery = 0;

    }


    saveData();

    renderSetList();

    updateSelectedPanel();

}


/* ==================================================
   全データリセット
================================================== */

resetAllButton.addEventListener(
    "click",
    resetAll
);


function resetAll() {

    const confirmed =
        confirm(
            "すべての問題セットと暗記度を削除しますか？"
        );


    if (!confirmed) {

        return;

    }


    problemSets = {};

    selectedSetName = null;


    localStorage.removeItem(
        STORAGE_KEY
    );

    localStorage.removeItem(
        SELECTED_SET_KEY
    );


    showMainScreen();

}


/* ==================================================
   補助
================================================== */

function showMainScreen() {

    showOnly(null);

    renderSetList();

    updateSelectedPanel();

}