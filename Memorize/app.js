"use strict";

/* =========================
   基本設定
========================= */

const $ = id => document.getElementById(id);

const STORAGE_KEY = "problem-memorize-data-v3";
const SELECTED_KEY = "problem-memorize-selected-v3";

const CORRECT = 10;
const WRONG = 15;

const SAVE_DELAY = 200;


/* =========================
   DOM
========================= */

const questionCount = $("questionCount");

const setList = $("setList");

const selectedPanel = $("selectedPanel");
const selectedSetName = $("selectedSetName");
const editSelectedButton = $("editSelectedButton");

const masteryPanel = $("masteryPanel");
const averageMastery = $("averageMastery");
const masteryList = $("masteryList");

const resetPanel = $("resetPanel");
const resetMasteryButton = $("resetMasteryButton");
const resetAllButton = $("resetAllButton");

const newSetButton = $("newSetButton");

const mainScreen = $("mainScreen");

const editScreen = $("editScreen");
const editTitle = $("editTitle");
const editName = $("editName");
const problemInput = $("problemInput");
const saveEditButton = $("saveEditButton");
const cancelEditButton = $("cancelEditButton");

const quizScreen = $("quizScreen");
const quizSetName = $("quizSetName");
const progress = $("progress");
const question = $("question");
const questionExplanation = $("questionExplanation");
const showAnswerButton = $("showAnswerButton");

const answerScreen = $("answerScreen");
const answer = $("answer");
const unknownButton = $("unknownButton");
const knowButton = $("knowButton");

const completeScreen = $("completeScreen");
const backButton = $("backButton");

const rangeStart = $("rangeStart");
const rangeEnd = $("rangeEnd");

const startButton = $("startButton");


/* =========================
   状態
========================= */

let sets = [];

let selectedSetId = null;
let editingSetId = null;

let quizProblems = [];
let currentProblem = null;

let quizTotal = 0;
let currentNumber = 0;

let saveTimer = null;

let answerProcessing = false;


/* =========================
   ID生成
========================= */

function createId() {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 10)
    );
}


/* =========================
   数値を安全にする
========================= */

function normalizeMastery(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.max(
        0,
        Math.min(100, number)
    );
}


/* =========================
   問題データの正規化
========================= */

function normalizeProblem(problem) {
    return {
        id: problem.id || createId(),

        question: String(
            problem.question ?? ""
        ),

        explanation: String(
            problem.explanation ?? ""
        ),

        answer: String(
            problem.answer ?? ""
        ),

        mastery: normalizeMastery(
            problem.mastery
        )
    };
}


/* =========================
   データ読み込み
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

        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
            sets = [];
            return;
        }

        sets = parsed.map(set => {
            return {
                id: set.id || createId(),

                name: String(
                    set.name ?? "無題"
                ),

                problems:
                    Array.isArray(set.problems)
                        ? set.problems.map(
                            normalizeProblem
                        )
                        : []
            };
        });

    } catch (error) {
        console.error(
            "データ読み込みエラー:",
            error
        );

        sets = [];

        alert(
            "保存データを読み込めませんでした。\n" +
            "データが破損している可能性があります。"
        );
    }
}


/* =========================
   保存
========================= */

function saveNow() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(sets)
        );

        saveTimer = null;

    } catch (error) {
        console.error(
            "保存エラー:",
            error
        );

        saveTimer = null;

        alert(
            "データを保存できませんでした。\n" +
            "保存容量が不足している可能性があります。"
        );
    }
}


/* =========================
   遅延保存
========================= */

function scheduleSave() {
    if (saveTimer !== null) {
        clearTimeout(saveTimer);
    }

    saveTimer = setTimeout(
        () => {
            saveNow();
        },
        SAVE_DELAY
    );
}


/* =========================
   選択セット保存
========================= */

function saveSelected() {
    try {
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

    } catch (error) {
        console.error(
            "選択セット保存エラー:",
            error
        );
    }
}


/* =========================
   セット取得
========================= */

function getSelectedSet() {
    return sets.find(
        set => set.id === selectedSetId
    );
}


/* =========================
   画面切り替え
========================= */

function hideAllScreens() {
    mainScreen.classList.add("hidden");
    editScreen.classList.add("hidden");
    quizScreen.classList.add("hidden");
    answerScreen.classList.add("hidden");
    completeScreen.classList.add("hidden");
}


function showMainScreen() {
    hideAllScreens();

    mainScreen.classList.remove("hidden");

    renderSets();
    updateSelected();
}


function showEditScreen() {
    hideAllScreens();

    editScreen.classList.remove("hidden");
}


function showQuizScreen() {
    hideAllScreens();

    quizScreen.classList.remove("hidden");
}


function showAnswerScreen() {
    answerScreen.classList.remove("hidden");
}


/* =========================
   セット一覧
========================= */

function renderSets() {
    setList.replaceChildren();

    if (sets.length === 0) {
        const empty =
            document.createElement("p");

        empty.textContent =
            "問題セットがありません。";

        setList.appendChild(empty);

        return;
    }

    const fragment =
        document.createDocumentFragment();

    for (const set of sets) {

        const item =
            document.createElement("div");

        item.className = "set-item";

        if (set.id === selectedSetId) {
            item.classList.add("selected");
        }

        item.dataset.id = set.id;


        const name =
            document.createElement("span");

        name.textContent = set.name;


        const count =
            document.createElement("span");

        count.textContent =
            `${set.problems.length}問`;


        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "削除";


        deleteButton.addEventListener(
            "click",
            event => {
                event.stopPropagation();

                deleteSet(set.id);
            }
        );


        item.addEventListener(
            "click",
            () => {
                selectSet(set.id);
            }
        );


        item.appendChild(name);
        item.appendChild(count);
        item.appendChild(deleteButton);

        fragment.appendChild(item);
    }

    setList.appendChild(fragment);
}


/* =========================
   セット選択
========================= */

function selectSet(id) {
    const set = sets.find(
        set => set.id === id
    );

    if (!set) {
        return;
    }

    selectedSetId = id;

    saveSelected();

    updateSelected();
    renderSets();
}


/* =========================
   選択セット表示
========================= */

function updateSelected() {
    const set = getSelectedSet();

    if (!set) {
        selectedPanel.classList.add("hidden");
        masteryPanel.classList.add("hidden");
        resetPanel.classList.add("hidden");

        return;
    }

    selectedPanel.classList.remove("hidden");
    masteryPanel.classList.remove("hidden");
    resetPanel.classList.remove("hidden");


    selectedSetName.textContent =
        set.name;


    rangeStart.value = 1;

    rangeEnd.value =
        set.problems.length;

    rangeStart.max =
        set.problems.length;

    rangeEnd.max =
        set.problems.length;

    questionCount.max =
        set.problems.length;

    questionCount.value =
        Math.min(
            10,
            set.problems.length
        );


    renderMastery();
}


/* =========================
   習熟度表示
========================= */

function renderMastery() {
    const set = getSelectedSet();

    if (!set) {
        return;
    }

    const problems =
        set.problems;

    masteryList.replaceChildren();

    if (problems.length === 0) {

        averageMastery.textContent =
            "0%";

        const empty =
            document.createElement("p");

        empty.textContent =
            "問題がありません。";

        masteryList.appendChild(empty);

        return;
    }


    let total = 0;

    const fragment =
        document.createDocumentFragment();


    for (
        let i = 0;
        i < problems.length;
        i++
    ) {

        const problem =
            problems[i];

        total += problem.mastery;


        const item =
            document.createElement("div");

        item.className =
            "mastery-item";


        const number =
            document.createElement("div");

        number.className =
            "mastery-number";

        number.textContent =
            i + 1;


        const text =
            document.createElement("div");

        text.className =
            "mastery-question";

        text.textContent =
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


        const percent =
            document.createElement("div");

        percent.className =
            "mastery-percent";

        percent.textContent =
            `${Math.round(problem.mastery)}%`;


        item.appendChild(number);
        item.appendChild(text);
        item.appendChild(bar);
        item.appendChild(percent);

        fragment.appendChild(item);
    }


    masteryList.appendChild(fragment);


    averageMastery.textContent =
        `${Math.round(
            total / problems.length
        )}%`;
}


/* =========================
   セット削除
========================= */

function deleteSet(id) {
    const index =
        sets.findIndex(
            set => set.id === id
        );

    if (index === -1) {
        return;
    }


    const set = sets[index];


    const confirmed = confirm(
        `「${set.name}」を削除しますか？\n` +
        "この操作は元に戻せません。"
    );


    if (!confirmed) {
        return;
    }


    sets.splice(index, 1);


    if (selectedSetId === id) {
        selectedSetId = null;

        saveSelected();
    }


    saveNow();

    renderSets();
    updateSelected();
}


/* =========================
   新規セット
========================= */

function openNewSet() {
    editingSetId = null;

    editTitle.textContent =
        "新しい問題セット";

    editName.value = "";

    problemInput.value = "";

    showEditScreen();
}


/* =========================
   編集画面を開く
========================= */

function openEdit() {
    const set =
        getSelectedSet();

    if (!set) {
        return;
    }


    editingSetId =
        set.id;


    editTitle.textContent =
        "問題セットを編集";


    editName.value =
        set.name;


    problemInput.value =
        set.problems
            .map(problem => {

                const explanation =
                    problem.explanation
                        ? ` * ${problem.explanation}`
                        : "";


                const answer =
                    problem.answer
                        ? ` / ${problem.answer}`
                        : "";


                return (
                    `${problem.question}` +
                    `${explanation}` +
                    `${answer}`
                );
            })
            .join("\n");


    showEditScreen();
}


/* =========================
   スラッシュ検索
========================= */

function findSlash(text) {
    const normal =
        text.indexOf("/");

    const fullWidth =
        text.indexOf("／");


    if (
        normal === -1 &&
        fullWidth === -1
    ) {
        return -1;
    }


    if (normal === -1) {
        return fullWidth;
    }


    if (fullWidth === -1) {
        return normal;
    }


    return Math.min(
        normal,
        fullWidth
    );
}


/* =========================
   問題1行を解析
========================= */

function parseProblemLine(line) {
    let text =
        line.trim();

    if (!text) {
        return null;
    }


    let questionText =
        text;

    let explanationText =
        "";

    let answerText =
        "";


    const asteriskIndex =
        text.indexOf("*");

    const fullWidthAsteriskIndex =
        text.indexOf("＊");


    let starIndex = -1;


    if (
        asteriskIndex !== -1 &&
        fullWidthAsteriskIndex !== -1
    ) {

        starIndex =
            Math.min(
                asteriskIndex,
                fullWidthAsteriskIndex
            );

    } else if (
        asteriskIndex !== -1
    ) {

        starIndex =
            asteriskIndex;

    } else {

        starIndex =
            fullWidthAsteriskIndex;
    }


    if (starIndex !== -1) {

        questionText =
            text
                .slice(
                    0,
                    starIndex
                )
                .trim();


        const rest =
            text
                .slice(
                    starIndex + 1
                )
                .trim();


        const slashIndex =
            findSlash(rest);


        if (slashIndex !== -1) {

            explanationText =
                rest
                    .slice(
                        0,
                        slashIndex
                    )
                    .trim();


            answerText =
                rest
                    .slice(
                        slashIndex + 1
                    )
                    .trim();

        } else {

            explanationText =
                rest;
        }

    } else {

        const slashIndex =
            findSlash(text);


        if (slashIndex !== -1) {

            questionText =
                text
                    .slice(
                        0,
                        slashIndex
                    )
                    .trim();


            answerText =
                text
                    .slice(
                        slashIndex + 1
                    )
                    .trim();
        }
    }


    return {
        question: questionText,
        explanation: explanationText,
        answer: answerText
    };
}


/* =========================
   問題解析
========================= */

function parseProblems(text) {
    return text
        .split(/\r?\n/)
        .map(parseProblemLine)
        .filter(Boolean)
        .filter(
            problem =>
                problem.question !== ""
        );
}


/* =========================
   編集時のデータ維持
========================= */

function preserveProblemData(
    newProblems,
    oldProblems
) {

    const used =
        new Set();


    return newProblems.map(
        newProblem => {

            let matchIndex = -1;


            for (
                let i = 0;
                i < oldProblems.length;
                i++
            ) {

                if (used.has(i)) {
                    continue;
                }


                const oldProblem =
                    oldProblems[i];


                if (
                    oldProblem.question ===
                        newProblem.question &&

                    oldProblem.explanation ===
                        newProblem.explanation &&

                    oldProblem.answer ===
                        newProblem.answer
                ) {

                    matchIndex = i;

                    break;
                }
            }


            if (matchIndex !== -1) {

                used.add(matchIndex);


                const oldProblem =
                    oldProblems[
                        matchIndex
                    ];


                return {
                    id:
                        oldProblem.id ||
                        createId(),

                    question:
                        newProblem.question,

                    explanation:
                        newProblem.explanation,

                    answer:
                        newProblem.answer,

                    mastery:
                        normalizeMastery(
                            oldProblem.mastery
                        )
                };
            }


            return {
                id: createId(),

                question:
                    newProblem.question,

                explanation:
                    newProblem.explanation,

                answer:
                    newProblem.answer,

                mastery: 0
            };
        }
    );
}


/* =========================
   編集保存
========================= */

function saveEdit() {
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


    if (
        parsedProblems.length === 0
    ) {

        alert(
            "問題を1問以上入力してください。"
        );

        return;
    }


    if (editingSetId === null) {

        /* 新規作成 */

        const newSet = {
            id: createId(),

            name,

            problems:
                parsedProblems.map(
                    problem => ({
                        id: createId(),

                        question:
                            problem.question,

                        explanation:
                            problem.explanation,

                        answer:
                            problem.answer,

                        mastery: 0
                    })
                )
        };


        sets.push(newSet);

        selectedSetId =
            newSet.id;

        saveSelected();

    } else {

        /* 既存セット編集 */

        const set =
            sets.find(
                set =>
                    set.id ===
                    editingSetId
            );


        if (!set) {

            alert(
                "編集対象のセットが見つかりません。"
            );

            return;
        }


        const newProblems =
            preserveProblemData(
                parsedProblems,
                set.problems
            );


        set.name = name;

        set.problems =
            newProblems;


        selectedSetId =
            set.id;

        saveSelected();
    }


    saveNow();

    showMainScreen();
}


/* =========================
   問題選択
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


    const source =
        set.problems.slice(
            start - 1,
            end
        );


    const remaining =
        [...source];


    const result = [];


    while (
        remaining.length > 0 &&
        result.length < count
    ) {

        let totalWeight = 0;


        for (
            const problem of remaining
        ) {

            totalWeight +=
                101 -
                problem.mastery;
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
            remaining[
                selectedIndex
            ]
        );


        remaining.splice(
            selectedIndex,
            1
        );
    }


    return result;
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
        Number.parseInt(
            rangeStart.value,
            10
        );


    const end =
        Number.parseInt(
            rangeEnd.value,
            10
        );


    const count =
        Number.parseInt(
            questionCount.value,
            10
        );


    if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        !Number.isInteger(count)
    ) {

        alert(
            "範囲と問題数を正しく入力してください。"
        );

        return;
    }


    if (
        start < 1 ||
        end > set.problems.length ||
        start > end
    ) {

        alert(
            "問題範囲が正しくありません。"
        );

        return;
    }


    const available =
        end - start + 1;


    if (
        count < 1 ||
        count > available
    ) {

        alert(
            `問題数は1〜${available}問にしてください。`
        );

        return;
    }


    quizProblems =
        createQuizProblems(
            start,
            end,
            count
        );


    if (
        quizProblems.length === 0
    ) {

        alert(
            "問題を作成できませんでした。"
        );

        return;
    }


    quizTotal =
        quizProblems.length;

    currentNumber = 0;

    currentProblem = null;

    answerProcessing = false;


    quizSetName.textContent =
        set.name;


    showQuizScreen();

    nextQuestion();
}


/* =========================
   次の問題
========================= */

function nextQuestion() {
    answerProcessing = false;


    if (
        quizProblems.length === 0
    ) {

        finishQuiz();

        return;
    }


    currentProblem =
        quizProblems.shift();


    currentNumber++;


    progress.textContent =
        `${currentNumber} / ${quizTotal}`;


    question.textContent =
        currentProblem.question;


    questionExplanation.textContent =
        currentProblem.explanation;


    answer.textContent =
        currentProblem.answer;


    questionExplanation.hidden =
        true;


    showAnswerButton.disabled =
        false;


    showQuizScreen();
}


/* =========================
   答えを表示
========================= */

function showAnswer() {
    if (!currentProblem) {
        return;
    }


    questionExplanation.hidden =
        false;


    showAnswerButton.disabled =
        true;


    showAnswerScreen();
}


/* =========================
   問題検索
========================= */

function findProblemById(id) {
    const set =
        getSelectedSet();


    if (!set) {
        return null;
    }


    return set.problems.find(
        problem =>
            problem.id === id
    );
}


/* =========================
   わかる
========================= */

function markKnown() {
    if (
        !currentProblem ||
        answerProcessing
    ) {
        return;
    }


    answerProcessing = true;


    const problem =
        findProblemById(
            currentProblem.id
        );


    if (problem) {

        problem.mastery =
            normalizeMastery(
                problem.mastery +
                CORRECT
            );
    }


    scheduleSave();

    nextQuestion();
}


/* =========================
   わからない
========================= */

function markUnknown() {
    if (
        !currentProblem ||
        answerProcessing
    ) {
        return;
    }


    answerProcessing = true;


    const problem =
        findProblemById(
            currentProblem.id
        );


    if (problem) {

        problem.mastery =
            normalizeMastery(
                problem.mastery -
                WRONG
            );
    }


    quizProblems.push(
        currentProblem
    );


    scheduleSave();

    nextQuestion();
}


/* =========================
   クイズ終了
========================= */

function finishQuiz() {
    currentProblem = null;

    answerProcessing = false;

    quizScreen.classList.add("hidden");
    answerScreen.classList.add("hidden");
    completeScreen.classList.remove("hidden");

    saveNow();
}


/* =========================
   習熟度リセット
========================= */

function resetMastery() {
    const set =
        getSelectedSet();


    if (!set) {
        return;
    }


    const confirmed =
        confirm(
            `「${set.name}」の習熟度をすべて0%にしますか？`
        );


    if (!confirmed) {
        return;
    }


    for (
        const problem of set.problems
    ) {

        problem.mastery = 0;
    }


    saveNow();

    renderMastery();
}


/* =========================
   全データ削除
========================= */

function resetAll() {
    const confirmed =
        confirm(
            "すべての問題セットを削除しますか？\n" +
            "この操作は元に戻せません。"
        );


    if (!confirmed) {
        return;
    }


    sets = [];

    selectedSetId = null;


    saveNow();

    saveSelected();

    showMainScreen();
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
    openEdit
);


saveEditButton.addEventListener(
    "click",
    saveEdit
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


resetMasteryButton.addEventListener(
    "click",
    resetMastery
);


resetAllButton.addEventListener(
    "click",
    resetAll
);


/* =========================
   キーボード操作
========================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.repeat) {
            return;
        }


        /* クイズ画面 */

        if (
            !quizScreen.classList.contains(
                "hidden"
            ) &&
            event.code === "Space"
        ) {

            event.preventDefault();

            showAnswer();

            return;
        }


        /* 答え画面 */

        if (
            !answerScreen.classList.contains(
                "hidden"
            )
        ) {

            if (
                event.code === "ArrowLeft"
            ) {

                event.preventDefault();

                markUnknown();

                return;
            }


            if (
                event.code === "ArrowRight"
            ) {

                event.preventDefault();

                markKnown();

                return;
            }
        }
    }
);


/* =========================
   完了画面から戻る
========================= */

backButton.addEventListener(
    "click",
    () => {
        showMainScreen();
    }
);


/* =========================
   ページ終了時保存
========================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (saveTimer !== null) {

            clearTimeout(
                saveTimer
            );

            saveTimer = null;
        }


        saveNow();
    }
);


/* =========================
   初期化
========================= */

load();


/* 選択中セットを復元 */

try {

    selectedSetId =
        localStorage.getItem(
            SELECTED_KEY
        );

} catch (error) {

    console.error(
        "選択セット読み込みエラー:",
        error
    );

    selectedSetId = null;
}


/* 存在しないセットなら解除 */

if (
    selectedSetId &&
    !sets.some(
        set =>
            set.id ===
            selectedSetId
    )
) {

    selectedSetId = null;

    saveSelected();
}


showMainScreen();