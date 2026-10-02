"use strict";


/* =========================
   基本
========================= */

const $ = id =>
    document.getElementById(id);


const STORAGE_KEY =
    "problem-memorize-data-v3";

const SELECTED_KEY =
    "problem-memorize-selected-v3";


const CORRECT = 10;
const WRONG = 15;


/* =========================
   DOM
========================= */

const [
    questionCount,
    setList,
    selectedPanel,
    selectedSetName,
    editSelectedButton,
    masteryPanel,
    averageMastery,
    masteryList,
    resetPanel,
    resetMasteryButton,
    resetAllButton,
    newSetButton,
    mainScreen,
    editScreen,
    editTitle,
    editName,
    problemInput,
    saveEditButton,
    cancelEditButton,
    quizScreen,
    quizSetName,
    progress,
    question,
    questionExplanation,
    showAnswerButton,
    answerScreen,
    answer,
    unknownButton,
    knowButton,
    completeScreen,
    backButton,
    rangeStart,
    rangeEnd,
    startButton
] = [
    "questionCount",
    "setList",
    "selectedPanel",
    "selectedSetName",
    "editSelectedButton",
    "masteryPanel",
    "averageMastery",
    "masteryList",
    "resetPanel",
    "resetMasteryButton",
    "resetAllButton",
    "newSetButton",
    "mainScreen",
    "editScreen",
    "editTitle",
    "editName",
    "problemInput",
    "saveEditButton",
    "cancelEditButton",
    "quizScreen",
    "quizSetName",
    "progress",
    "question",
    "questionExplanation",
    "showAnswerButton",
    "answerScreen",
    "answer",
    "unknownButton",
    "knowButton",
    "completeScreen",
    "backButton",
    "rangeStart",
    "rangeEnd",
    "startButton"
].map($);


/* =========================
   状態
========================= */

let sets = [];
let selectedSetId = null;

let editingSetId = null;

let quizProblems = [];
let currentProblem = null;

/*
    現在何問目を表示しているかではなく、
    「何問クリアしたか」を管理する。
*/
let clearedCount = 0;

/*
    クイズ開始時の問題数。
    「わからない」で再追加されても変化しない。
*/
let quizTotal = 0;


/* =========================
   ID
========================= */

function createId() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .slice(2)
    );

}


/* =========================
   Storage
========================= */

function load() {

    try {

        const raw =
            localStorage.getItem(
                STORAGE_KEY
            );

        if (!raw) {
            sets = [];
            return;
        }


        const data =
            JSON.parse(raw);


        if (!Array.isArray(data)) {

            sets = [];
            return;

        }


        sets = data;


        /*
            古いデータに problem.id が存在しない場合に
            IDを追加する。
        */
        let changed = false;


        sets.forEach(set => {

            if (!Array.isArray(set.problems)) {

                set.problems = [];
                changed = true;

            }


            set.problems.forEach(problem => {

                if (!problem.id) {

                    problem.id = createId();
                    changed = true;

                }


                const mastery =
                    Number(problem.mastery);


                if (
                    !Number.isFinite(mastery)
                ) {

                    problem.mastery = 0;
                    changed = true;

                } else {

                    const normalized =
                        Math.max(
                            0,
                            Math.min(
                                100,
                                mastery
                            )
                        );


                    if (
                        problem.mastery !==
                        normalized
                    ) {

                        problem.mastery =
                            normalized;

                        changed = true;

                    }

                }

            });

        });


        if (changed) {
            save();
        }


    } catch {

        sets = [];

    }

}


function save() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(sets)
        );

    } catch {

        alert(
            "データを保存できませんでした。"
        );

    }

}


function saveSelected() {

    if (selectedSetId) {

        localStorage.setItem(
            SELECTED_KEY,
            selectedSetId
        );

    } else {

        localStorage.removeItem(
            SELECTED_KEY
        );

    }

}


/* =========================
   セット取得
========================= */

function getSelectedSet() {

    return sets.find(
        set =>
            set.id === selectedSetId
    ) || null;

}


/* =========================
   画面切り替え
========================= */

function hideScreens() {

    mainScreen.classList.add("hidden");
    editScreen.classList.add("hidden");
    quizScreen.classList.add("hidden");
    answerScreen.classList.add("hidden");
    completeScreen.classList.add("hidden");

}


function showMainScreen() {

    hideScreens();

    mainScreen.classList.remove(
        "hidden"
    );

}


function showEditScreen() {

    hideScreens();

    editScreen.classList.remove(
        "hidden"
    );

}


function showQuizScreen() {

    mainScreen.classList.add("hidden");
    editScreen.classList.add("hidden");
    quizScreen.classList.remove("hidden");
    answerScreen.classList.add("hidden");
    completeScreen.classList.add("hidden");

}


function showAnswerScreen() {

    quizScreen.classList.add("hidden");
    answerScreen.classList.remove("hidden");

}


/* =========================
   クイズ問題作成
========================= */

function createQuizProblems(
    start,
    end,
    count
) {

    const set =
        getSelectedSet();


    if (!set) {
        return [];
    }


    const remaining =
        set.problems.slice(
            start - 1,
            end
        );


    const result = [];


    count = Math.min(
        count,
        remaining.length
    );


    while (
        result.length < count &&
        remaining.length > 0
    ) {

        const total =
            remaining.reduce(
                (sum, problem) =>
                    sum +
                    (101 - problem.mastery),
                0
            );


        let random =
            Math.random() * total;


        let index =
            remaining.length - 1;


        for (
            let i = 0;
            i < remaining.length;
            i++
        ) {

            random -=
                101 -
                remaining[i].mastery;


            if (random <= 0) {

                index = i;
                break;

            }

        }


        result.push(
            remaining.splice(
                index,
                1
            )[0]
        );

    }


    return result;

}


/* =========================
   セット表示
========================= */

function renderSets() {

    setList.innerHTML = "";


    if (!sets.length) {

        setList.innerHTML =
            `<div class="empty-message">
                問題セットがありません。
            </div>`;

        return;

    }


    sets.forEach(set => {

        const item =
            document.createElement("div");


        item.className =
            "set-item";


        if (
            set.id === selectedSetId
        ) {

            item.classList.add("active");

        }


        item.innerHTML = `
            <div class="set-info">

                <div class="set-name">
                    ${escapeHTML(set.name)}
                </div>

                <div class="set-count">
                    ${set.problems.length}問
                </div>

            </div>

            <div class="set-actions">

                <button
                    class="delete-button"
                    type="button"
                    data-id="${set.id}"
                >
                    削除
                </button>

            </div>
        `;


        item.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        ".delete-button"
                    )
                ) {
                    return;
                }


                selectedSetId =
                    set.id;


                saveSelected();

                renderSets();
                updateSelected();

            }
        );


        const deleteButton =
            item.querySelector(
                ".delete-button"
            );


        deleteButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                deleteSet(set.id);

            }
        );


        setList.appendChild(item);

    });

}


/* =========================
   選択中セット
========================= */

function updateSelected() {

    const set =
        getSelectedSet();


    if (!set) {

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


    selectedPanel.classList.remove(
        "hidden"
    );

    masteryPanel.classList.remove(
        "hidden"
    );

    resetPanel.classList.remove(
        "hidden"
    );


    selectedSetName.textContent =
        set.name;


    rangeStart.value = 1;


    rangeEnd.value =
        set.problems.length;


    questionCount.value =
        Math.min(
            10,
            set.problems.length
        );


    renderMastery();

}


/* =========================
   暗記度
========================= */

function renderMastery() {

    const set =
        getSelectedSet();


    if (!set) {
        return;
    }


    masteryList.innerHTML = "";


    if (!set.problems.length) {

        masteryList.innerHTML =
            `<div class="empty-message">
                問題がありません。
            </div>`;


        averageMastery.textContent =
            "0%";


        return;

    }


    let total = 0;


    set.problems.forEach(
        (problem, index) => {

            total += problem.mastery;


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "mastery-item";


            item.innerHTML = `
                <div class="mastery-number">
                    ${index + 1}
                </div>

                <div
                    class="mastery-question"
                    title="${escapeHTML(
                        problem.question
                    )}"
                >
                    ${escapeHTML(
                        problem.question
                    )}
                </div>

                <div class="mastery-bar">
                    <div
                        class="mastery-fill"
                        style="width:${problem.mastery}%"
                    ></div>
                </div>

                <div class="mastery-value">
                    ${problem.mastery}%
                </div>
            `;


            masteryList.appendChild(item);

        }
    );


    const average =
        Math.round(
            total /
            set.problems.length
        );


    averageMastery.textContent =
        `${average}%`;

}


/* =========================
   HTMLエスケープ
========================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================
   新規セット
========================= */

function openNewSet() {

    editingSetId = null;


    editTitle.textContent =
        "問題セットを作成";


    editName.value = "";
    problemInput.value = "";


    showEditScreen();

}


/* =========================
   セット編集
========================= */

function openEditSet(id) {

    const set =
        sets.find(
            item =>
                item.id === id
        );


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
                `${problem.question} * ${problem.explanation} / ${problem.answer}`
            )
            .join("\n");


    showEditScreen();

}


/* =========================
   問題解析
========================= */

function parseProblemLine(line) {

    let separator =
        line.indexOf("*");


    if (separator === -1) {

        separator =
            line.indexOf("＊");

    }


    /*
        *
        を使う形式

        question * explanation / answer
    */

    if (separator !== -1) {

        const question =
            line
                .slice(0, separator)
                .trim();


        const rest =
            line
                .slice(separator + 1)
                .trim();


        let slash =
            rest.indexOf("/");


        if (slash === -1) {

            slash =
                rest.indexOf("／");

        }


        if (slash !== -1) {

            return {
                id: createId(),

                question,

                explanation:
                    rest
                        .slice(0, slash)
                        .trim(),

                answer:
                    rest
                        .slice(slash + 1)
                        .trim(),

                mastery: 0
            };

        }


        /*
            *
            はあるが / がない場合。
            従来の仕様を維持し、
            説明・答えを空にする。
        */

        return {
            id: createId(),

            question,

            explanation: "",

            answer: "",

            mastery: 0
        };

    }


    /*
        *
        がない場合

        question / answer
    */

    let slash =
        line.indexOf("/");


    if (slash === -1) {

        slash =
            line.indexOf("／");

    }


    if (slash !== -1) {

        return {
            id: createId(),

            question:
                line
                    .slice(0, slash)
                    .trim(),

            explanation: "",

            answer:
                line
                    .slice(slash + 1)
                    .trim(),

            mastery: 0
        };

    }


    /*
        区切りなし
    */

    return {
        id: createId(),

        question: line,

        explanation: "",

        answer: "",

        mastery: 0
    };

}


/* =========================
   問題キー
========================= */

function getProblemKey(problem) {

    return [
        problem.question,
        problem.explanation,
        problem.answer
    ].join("\u0000");

}


/* =========================
   暗記度引き継ぎ
========================= */

function preserveMastery(
    oldProblems,
    newProblems
) {

    /*
        同じ内容の問題が複数存在しても
        1問目、2問目……を別々に扱う。
    */

    const oldMap =
        new Map();


    oldProblems.forEach(problem => {

        const key =
            getProblemKey(problem);


        if (!oldMap.has(key)) {

            oldMap.set(
                key,
                []
            );

        }


        oldMap.get(key).push(problem);

    });


    newProblems.forEach(problem => {

        const key =
            getProblemKey(problem);


        const candidates =
            oldMap.get(key);


        if (
            candidates &&
            candidates.length
        ) {

            const old =
                candidates.shift();


            problem.id =
                old.id || createId();


            problem.mastery =
                Number.isFinite(
                    Number(old.mastery)
                )
                    ? Math.max(
                        0,
                        Math.min(
                            100,
                            Number(old.mastery)
                        )
                    )
                    : 0;

        }

    });


    return newProblems;

}


/* =========================
   編集保存
========================= */

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


    const problems =
        lines.map(parseProblemLine);


    if (!problems.length) {

        alert(
            "問題を1問以上入力してください。"
        );

        return;

    }


    if (editingSetId) {

        const set =
            sets.find(
                item =>
                    item.id ===
                    editingSetId
            );


        if (!set) {
            return;
        }


        set.problems =
            preserveMastery(
                set.problems,
                problems
            );


        set.name =
            name;


    } else {

        sets.push({

            id: createId(),

            name,

            problems

        });

    }


    save();

    renderSets();


    if (!selectedSetId) {

        selectedSetId =
            sets[sets.length - 1].id;


        saveSelected();

    }


    updateSelected();

    showMainScreen();

}


/* =========================
   セット削除
========================= */

function deleteSet(id) {

    const set =
        sets.find(
            item =>
                item.id === id
        );


    if (!set) {
        return;
    }


    if (
        !confirm(
            `「${set.name}」を削除しますか？`
        )
    ) {

        return;

    }


    sets =
        sets.filter(
            item =>
                item.id !== id
        );


    if (
        selectedSetId === id
    ) {

        selectedSetId = null;

        saveSelected();

    }


    save();

    renderSets();

    updateSelected();

}


/* =========================
   クイズ開始
========================= */

function startQuiz() {

    const set =
        getSelectedSet();


    if (!set) {
        return;
    }


    const start =
        Number(rangeStart.value);


    const end =
        Number(rangeEnd.value);


    const count =
        Number(questionCount.value);


    if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        !Number.isInteger(count) ||
        start < 1 ||
        end > set.problems.length ||
        start > end ||
        count < 1 ||
        count >
            end - start + 1
    ) {

        alert(
            "出題範囲または問題数が正しくありません。"
        );

        return;

    }


    quizProblems =
        createQuizProblems(
            start,
            end,
            count
        );


    quizTotal =
        quizProblems.length;


    clearedCount = 0;


    quizSetName.textContent =
        set.name;


    nextQuestion();

}


/* =========================
   次の問題
========================= */

function nextQuestion() {

    if (!quizProblems.length) {

        finishQuiz();

        return;

    }


    currentProblem =
        quizProblems.shift();


    /*
        「わからない」で同じ問題が
        再追加されても clearedCount は
        増加しない。
    */

    progress.textContent =
        `${clearedCount + 1} / ${quizTotal}`;


    question.textContent =
        currentProblem.question;


    questionExplanation.textContent =
        currentProblem.explanation;


    answer.textContent =
        currentProblem.answer;


    showQuizScreen();

}


/* =========================
   答えを見る
========================= */

function showAnswer() {

    showAnswerScreen();

}


/* =========================
   暗記度更新
========================= */

function updateMastery(
    problem,
    amount
) {

    const set =
        getSelectedSet();


    if (!set) {
        return;
    }


    /*
        問題内容ではなくIDで検索する。
        同じ問題が複数あっても正しい問題だけ
        更新できる。
    */

    const target =
        set.problems.find(
            item =>
                item.id === problem.id
        );


    if (!target) {
        return;
    }


    target.mastery =
        Math.max(
            0,
            Math.min(
                100,
                Number(target.mastery) +
                amount
            )
        );


    save();

}


/* =========================
   わかる
========================= */

function markKnown() {

    updateMastery(
        currentProblem,
        CORRECT
    );


    clearedCount++;


    nextQuestion();

}


/* =========================
   わからない
========================= */

function markUnknown() {

    updateMastery(
        currentProblem,
        -WRONG
    );


    /*
        再出題する。
        clearedCount は増やさない。
    */

    quizProblems.push(
        currentProblem
    );


    nextQuestion();

}


/* =========================
   クイズ終了
========================= */

function finishQuiz() {

    quizScreen.classList.add(
        "hidden"
    );

    answerScreen.classList.add(
        "hidden"
    );

    completeScreen.classList.remove(
        "hidden"
    );

}


/* =========================
   暗記度リセット
========================= */

function resetMastery() {

    const set =
        getSelectedSet();


    if (!set) {
        return;
    }


    if (
        !confirm(
            "このセットの暗記度をリセットしますか？"
        )
    ) {

        return;

    }


    set.problems.forEach(
        problem => {

            problem.mastery = 0;

        }
    );


    save();

    renderMastery();

}


/* =========================
   全削除
========================= */

function resetAll() {

    if (
        !confirm(
            "すべての問題セットを削除しますか？"
        )
    ) {

        return;

    }


    sets = [];

    selectedSetId = null;


    save();

    saveSelected();

    renderSets();

    updateSelected();

}


/* =========================
   イベント
========================= */

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


saveEditButton.addEventListener(
    "click",
    saveEditor
);


cancelEditButton.addEventListener(
    "click",
    showMainScreen
);


startButton.addEventListener(
    "click",
    startQuiz
);


showAnswerButton.addEventListener(
    "click",
    showAnswer
);


unknownButton.addEventListener(
    "click",
    markUnknown
);


knowButton.addEventListener(
    "click",
    markKnown
);


backButton.addEventListener(
    "click",
    showMainScreen
);


resetMasteryButton.addEventListener(
    "click",
    resetMastery
);


resetAllButton.addEventListener(
    "click",
    resetAll
);


/* =========================
   キーボード
========================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.code === "Space" &&
            !quizScreen.classList.contains(
                "hidden"
            )
        ) {

            event.preventDefault();

            showAnswer();

        }


        if (
            event.code === "ArrowLeft" &&
            !answerScreen.classList.contains(
                "hidden"
            )
        ) {

            event.preventDefault();

            markUnknown();

        }


        if (
            event.code === "ArrowRight" &&
            !answerScreen.classList.contains(
                "hidden"
            )
        ) {

            event.preventDefault();

            markKnown();

        }

    }
);


/* =========================
   初期化
========================= */

load();


selectedSetId =
    localStorage.getItem(
        SELECTED_KEY
    );


if (
    selectedSetId &&
    !getSelectedSet()
) {

    selectedSetId = null;

    saveSelected();

}


renderSets();

updateSelected();

showMainScreen();