"use strict";


/* =========================================================
   設定
========================================================= */

const STORAGE_KEY = "problem-repeater-data-v2";
const SELECTED_SET_KEY = "problem-repeater-selected-set-v2";

const MASTERY_CORRECT = 10;
const MASTERY_WRONG = 15;


/* =========================================================
   DOM
========================================================= */

const setList =
    document.getElementById("setList");

const selectedPanel =
    document.getElementById("selectedPanel");

const selectedSetName =
    document.getElementById("selectedSetName");

const editSelectedButton =
    document.getElementById("editSelectedButton");

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

const showAnswerButton =
    document.getElementById("showAnswerButton");

const answerScreen =
    document.getElementById("answerScreen");

const answer =
    document.getElementById("answer");

const knowButton =
    document.getElementById("knowButton");

const unknownButton =
    document.getElementById("unknownButton");

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


/* =========================================================
   データ
========================================================= */

let sets = loadSets();

let selectedSetId =
    localStorage.getItem(SELECTED_SET_KEY);

let editingSetId = null;

let quizProblems = [];

let currentProblem = null;

let currentProblemNumber = 0;


/* =========================================================
   初期化
========================================================= */

renderSetList();

if (
    selectedSetId &&
    !sets.some(set => set.id === selectedSetId)
) {
    selectedSetId = null;
}

updateMainScreen();


/* =========================================================
   localStorage
========================================================= */

function loadSets() {

    const saved =
        localStorage.getItem(STORAGE_KEY);

    if (!saved) {
        return [];
    }

    try {

        const data =
            JSON.parse(saved);

        if (!Array.isArray(data)) {
            return [];
        }

        return data;

    } catch (error) {

        console.error(
            "データ読み込みエラー:",
            error
        );

        return [];
    }
}


function saveSets() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(sets)
    );
}


function saveSelectedSet() {

    if (selectedSetId) {

        localStorage.setItem(
            SELECTED_SET_KEY,
            selectedSetId
        );

    } else {

        localStorage.removeItem(
            SELECTED_SET_KEY
        );
    }
}


/* =========================================================
   ID
========================================================= */

function createId() {

    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2)
    );
}


/* =========================================================
   画面制御
========================================================= */

function hideAllScreens() {

    editScreen.classList.add("hidden");

    quizScreen.classList.add("hidden");

    answerScreen.classList.add("hidden");

    completeScreen.classList.add("hidden");
}


function showMainScreen() {

    hideAllScreens();

    selectedPanel.classList.toggle(
        "hidden",
        !selectedSetId
    );

    masteryPanel.classList.toggle(
        "hidden",
        !selectedSetId
    );

    resetPanel.classList.toggle(
        "hidden",
        !selectedSetId
    );

    renderSetList();

    updateSelectedPanel();
}


function showEditScreen() {

    hideAllScreens();

    selectedPanel.classList.add("hidden");

    masteryPanel.classList.add("hidden");

    resetPanel.classList.add("hidden");

    editScreen.classList.remove("hidden");
}


function showQuizScreen() {

    hideAllScreens();

    selectedPanel.classList.add("hidden");

    masteryPanel.classList.add("hidden");

    resetPanel.classList.add("hidden");

    quizScreen.classList.remove("hidden");
}


function showAnswerScreen() {

    quizScreen.classList.add("hidden");

    answerScreen.classList.remove("hidden");
}


/* =========================================================
   問題セット一覧
========================================================= */

function renderSetList() {

    setList.innerHTML = "";

    if (sets.length === 0) {

        const empty =
            document.createElement("div");

        empty.className = "empty-message";

        empty.textContent =
            "問題セットがありません。";

        setList.appendChild(empty);

        return;
    }


    sets.forEach(set => {

        const item =
            document.createElement("div");

        item.className = "set-item";

        if (set.id === selectedSetId) {
            item.classList.add("active");
        }


        const information =
            document.createElement("div");

        information.style.flex = "1";


        const name =
            document.createElement("div");

        name.className = "set-name";

        name.textContent = set.name;


        const count =
            document.createElement("div");

        count.className = "set-count";

        count.textContent =
            `${set.problems.length} 問`;


        information.appendChild(name);

        information.appendChild(count);


        const actions =
            document.createElement("div");

        actions.className = "set-actions";


        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";

        deleteButton.className =
            "delete-button";

        deleteButton.textContent =
            "削除";


        deleteButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                deleteSet(set.id);
            }
        );


        actions.appendChild(deleteButton);


        item.appendChild(information);

        item.appendChild(actions);


        item.addEventListener(
            "click",
            () => {

                selectedSetId = set.id;

                saveSelectedSet();

                updateMainScreen();
            }
        );


        setList.appendChild(item);

    });
}


/* =========================================================
   選択中セット
========================================================= */

function getSelectedSet() {

    return sets.find(
        set => set.id === selectedSetId
    );
}


function updateSelectedPanel() {

    const set = getSelectedSet();

    if (!set) {
        return;
    }


    selectedSetName.textContent =
        set.name;


    rangeStart.max =
        set.problems.length;

    rangeEnd.max =
        set.problems.length;


    rangeStart.value = 1;

    rangeEnd.value =
        Math.max(
            1,
            set.problems.length
        );


    renderMastery(set);
}


function updateMainScreen() {

    if (selectedSetId) {

        showMainScreen();

    } else {

        hideAllScreens();

        selectedPanel.classList.add("hidden");

        masteryPanel.classList.add("hidden");

        resetPanel.classList.add("hidden");

        renderSetList();
    }
}


/* =========================================================
   問題セット作成
========================================================= */

function openNewSet() {

    editingSetId = null;

    editTitle.textContent =
        "問題セットを作成";

    editName.value = "";

    problemInput.value = "";

    showEditScreen();

    editName.focus();
}


/* =========================================================
   問題セット編集
========================================================= */

function openEditSet(id) {

    const set =
        sets.find(set => set.id === id);

    if (!set) {
        return;
    }


    editingSetId = id;

    editTitle.textContent =
        "問題セットを編集";

    editName.value =
        set.name;

    problemInput.value =
        set.problems
            .map(problem =>
                `${problem.question} / ${problem.answer}`
            )
            .join("\n");


    showEditScreen();

    editName.focus();
}


/* =========================================================
   保存
========================================================= */

function saveEditor() {

    const name =
        editName.value.trim();

    if (!name) {

        alert(
            "セット名を入力してください。"
        );

        return;
    }


    const lines =
        problemInput.value
            .split("\n")
            .map(line => line.trim())
            .filter(Boolean);


    const problems = [];


    for (const line of lines) {

        const separator =
            line.indexOf("/");

        if (separator === -1) {

            alert(
                `形式が正しくありません。\n\n${line}\n\n「問題 / 答え」の形式で入力してください。`
            );

            return;
        }


        const questionText =
            line
                .slice(0, separator)
                .trim();


        const answerText =
            line
                .slice(separator + 1)
                .trim();


        if (
            !questionText ||
            !answerText
        ) {

            alert(
                `問題または答えが空です。\n\n${line}`
            );

            return;
        }


        problems.push({

            question: questionText,

            answer: answerText,

            mastery: 0

        });
    }


    if (problems.length === 0) {

        alert(
            "問題を1問以上入力してください。"
        );

        return;
    }


    if (editingSetId) {

        const set =
            sets.find(
                set =>
                    set.id === editingSetId
            );

        if (!set) {
            return;
        }


        /*
         * 以前と同じ問題・答えなら
         * 暗記度を引き継ぐ
         */

        problems.forEach(newProblem => {

            const oldProblem =
                set.problems.find(
                    old =>
                        old.question ===
                            newProblem.question &&
                        old.answer ===
                            newProblem.answer
                );


            if (oldProblem) {

                newProblem.mastery =
                    oldProblem.mastery;
            }
        });


        set.name = name;

        set.problems = problems;

    } else {

        const newSet = {

            id: createId(),

            name: name,

            problems: problems
        };


        sets.push(newSet);

        selectedSetId =
            newSet.id;

        saveSelectedSet();
    }


    saveSets();

    editingSetId = null;

    updateMainScreen();
}


/* =========================================================
   問題セット削除
========================================================= */

function deleteSet(id) {

    const set =
        sets.find(
            set => set.id === id
        );

    if (!set) {
        return;
    }


    const confirmed =
        confirm(
            `「${set.name}」を削除しますか？`
        );


    if (!confirmed) {
        return;
    }


    sets =
        sets.filter(
            set => set.id !== id
        );


    if (selectedSetId === id) {

        selectedSetId = null;

        saveSelectedSet();
    }


    saveSets();

    updateMainScreen();
}


/* =========================================================
   暗記度
========================================================= */

function renderMastery(set) {

    masteryList.innerHTML = "";


    if (set.problems.length === 0) {

        averageMastery.textContent =
            "0%";

        return;
    }


    const total =
        set.problems.reduce(
            (sum, problem) =>
                sum + problem.mastery,
            0
        );


    const average =
        Math.round(
            total /
            set.problems.length
        );


    averageMastery.textContent =
        `${average}%`;


    set.problems.forEach(
        (problem, index) => {

            const item =
                document.createElement("div");

            item.className =
                "mastery-item";


            const number =
                document.createElement("div");

            number.className =
                "mastery-number";

            number.textContent =
                index + 1;


            const questionText =
                document.createElement("div");

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
                document.createElement("div");

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


/* =========================================================
   暗記度更新
========================================================= */

function updateMastery(
    problem,
    understood
) {

    const set =
        getSelectedSet();

    if (!set) {
        return;
    }


    const target =
        set.problems.find(
            item =>
                item.question ===
                    problem.question &&
                item.answer ===
                    problem.answer
        );


    if (!target) {
        return;
    }


    if (understood) {

        target.mastery +=
            MASTERY_CORRECT;

    } else {

        target.mastery -=
            MASTERY_WRONG;
    }


    target.mastery =
        Math.max(
            0,
            Math.min(
                100,
                target.mastery
            )
        );


    saveSets();
}


/* =========================================================
   出題問題作成
========================================================= */

function createQuizProblems(
    start,
    end
) {

    const set =
        getSelectedSet();

    if (!set) {
        return [];
    }


    const selected =
        set.problems.slice(
            start - 1,
            end
        );


    /*
     * 暗記度が低いほど
     * 選ばれやすくする
     */

    const remaining =
        [...selected];

    const result = [];


    while (remaining.length > 0) {

        let totalWeight = 0;


        for (
            const problem
            of remaining
        ) {

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


    return result;
}


/* =========================================================
   問題開始
========================================================= */

function startQuiz() {

    const set =
        getSelectedSet();

    if (!set) {
        return;
    }


    let start =
        Number(rangeStart.value);

    let end =
        Number(rangeEnd.value);


    if (
        !Number.isInteger(start) ||
        !Number.isInteger(end)
    ) {

        alert(
            "出題範囲を正しく入力してください。"
        );

        return;
    }


    start =
        Math.max(
            1,
            start
        );


    end =
        Math.min(
            set.problems.length,
            end
        );


    if (start > end) {

        alert(
            "出題範囲が正しくありません。"
        );

        return;
    }


    quizProblems =
        createQuizProblems(
            start,
            end
        );


    if (quizProblems.length === 0) {
        return;
    }


    currentProblemNumber = 0;


    quizSetName.textContent =
        set.name;


    showNextQuestion();
}


/* =========================================================
   次の問題
========================================================= */

function showNextQuestion() {

    if (
        quizProblems.length === 0
    ) {

        finishQuiz();

        return;
    }


    currentProblem =
        quizProblems.shift();


    currentProblemNumber++;


    progress.textContent =
        `${currentProblemNumber} / ${
            currentProblemNumber +
            quizProblems.length
        }`;


    question.textContent =
        currentProblem.question;


    answer.textContent =
        currentProblem.answer;


    showQuizScreen();
}


/* =========================================================
   答えを見る
========================================================= */

function showAnswer() {

    if (!currentProblem) {
        return;
    }


    answer.textContent =
        currentProblem.answer;


    showAnswerScreen();
}


/* =========================================================
   わかる
========================================================= */

function markKnown() {

    if (!currentProblem) {
        return;
    }


    updateMastery(
        currentProblem,
        true
    );


    currentProblem = null;

    updateSelectedPanel();

    showNextQuestion();
}


/* =========================================================
   わからない
========================================================= */

function markUnknown() {

    if (!currentProblem) {
        return;
    }


    updateMastery(
        currentProblem,
        false
    );


    /*
     * わからなかった問題は
     * 今回の最後にもう一度出す
     */

    quizProblems.push(
        currentProblem
    );


    currentProblem = null;

    updateSelectedPanel();

    showNextQuestion();
}


/* =========================================================
   完了
========================================================= */

function finishQuiz() {

    currentProblem = null;

    quizScreen.classList.add(
        "hidden"
    );

    answerScreen.classList.add(
        "hidden"
    );

    completeScreen.classList.remove(
        "hidden"
    );


    updateSelectedPanel();
}


/* =========================================================
   編集キャンセル
========================================================= */

function cancelEdit() {

    editingSetId = null;

    updateMainScreen();
}


/* =========================================================
   リセット
========================================================= */

function resetMastery() {

    const set =
        getSelectedSet();

    if (!set) {
        return;
    }


    const confirmed =
        confirm(
            "このセットの暗記度をすべて0%にしますか？"
        );


    if (!confirmed) {
        return;
    }


    set.problems.forEach(
        problem => {

            problem.mastery = 0;

        }
    );


    saveSets();

    updateSelectedPanel();
}


function resetAll() {

    const confirmed =
        confirm(
            "すべての問題セットを削除しますか？"
        );


    if (!confirmed) {
        return;
    }


    sets = [];

    selectedSetId = null;

    saveSets();

    saveSelectedSet();

    updateMainScreen();
}


/* =========================================================
   ボタン
========================================================= */

newSetButton.addEventListener(
    "click",
    openNewSet
);


editSelectedButton.addEventListener(
    "click",
    () => {

        if (selectedSetId) {

            openEditSet(
                selectedSetId
            );
        }
    }
);


startButton.addEventListener(
    "click",
    startQuiz
);


showAnswerButton.addEventListener(
    "click",
    showAnswer
);


knowButton.addEventListener(
    "click",
    markKnown
);


unknownButton.addEventListener(
    "click",
    markUnknown
);


saveEditButton.addEventListener(
    "click",
    saveEditor
);


cancelEditButton.addEventListener(
    "click",
    cancelEdit
);


backButton.addEventListener(
    "click",
    updateMainScreen
);


resetMasteryButton.addEventListener(
    "click",
    resetMastery
);


resetAllButton.addEventListener(
    "click",
    resetAll
);


/* =========================================================
   キーボード
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        /*
         * 編集画面では
         * キーボード操作を無効にする
         */

        if (
            !editScreen.classList.contains(
                "hidden"
            )
        ) {
            return;
        }


        /*
         * 入力欄に文字を入力中なら
         * ショートカットを発動させない
         */

        const tag =
            event.target.tagName;


        if (
            tag === "INPUT" ||
            tag === "TEXTAREA"
        ) {
            return;
        }


        /*
         * 問題画面
         */

        if (
            !quizScreen.classList.contains(
                "hidden"
            )
        ) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                showAnswer();

                return;
            }
        }


        /*
         * 答え画面
         */

        if (
            !answerScreen.classList.contains(
                "hidden"
            )
        ) {

            if (
                event.key === "ArrowLeft"
            ) {

                event.preventDefault();

                markUnknown();

                return;
            }


            if (
                event.key === "ArrowRight"
            ) {

                event.preventDefault();

                markKnown();

                return;
            }
        }
    }
);