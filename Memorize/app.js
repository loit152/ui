"use strict";

/* =========================
   DOM
========================= */

const $ = id => document.getElementById(id);

const mainScreen = $("mainScreen");
const editScreen = $("editScreen");
const quizScreen = $("quizScreen");
const answerScreen = $("answerScreen");
const completeScreen = $("completeScreen");

const newSetButton = $("newSetButton");
const setList = $("setList");

const selectedPanel = $("selectedPanel");
const selectedSetName = $("selectedSetName");
const editSelectedButton = $("editSelectedButton");

const rangeStart = $("rangeStart");
const rangeEnd = $("rangeEnd");
const questionCount = $("questionCount");
const startButton = $("startButton");

const masteryPanel = $("masteryPanel");
const averageMastery = $("averageMastery");
const masteryList = $("masteryList");

const resetPanel = $("resetPanel");
const resetMasteryButton = $("resetMasteryButton");
const resetAllButton = $("resetAllButton");

const editTitle = $("editTitle");
const editName = $("editName");
const problemInput = $("problemInput");
const saveEditButton = $("saveEditButton");
const cancelEditButton = $("cancelEditButton");

const quizSetName = $("quizSetName");
const progress = $("progress");
const question = $("question");
const questionExplanation = $("questionExplanation");
const showAnswerButton = $("showAnswerButton");

const answer = $("answer");
const unknownButton = $("unknownButton");
const knowButton = $("knowButton");

const backButton = $("backButton");


/* =========================
   保存設定
========================= */

const STORAGE_KEY =
    "ellis-problem-data";

const SELECTED_KEY =
    "ellis-selected-set";


/* =========================
   クイズ設定
========================= */

const CORRECT_POINT = 10;
const WRONG_POINT = 15;


/* =========================
   アプリ状態
========================= */

let sets = [];

let selectedSetId = null;

let editingSetId = null;

let quizProblems = [];

let currentProblem = null;

let quizTotal = 0;

let currentNumber = 0;


/* =========================
   ID生成
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
   習熟度
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
   問題を正常化
========================= */

function normalizeProblem(problem) {
    return {
        id: problem.id || createId(),

        question:
            String(problem.question ?? ""),

        explanation:
            String(problem.explanation ?? ""),

        answer:
            String(problem.answer ?? ""),

        mastery:
            normalizeMastery(
                problem.mastery
            )
    };
}


/* =========================
   データ読み込み
========================= */

function loadData() {
    try {

        const data =
            localStorage.getItem(
                STORAGE_KEY
            );

        if (!data) {
            sets = [];
            return;
        }

        const parsed =
            JSON.parse(data);

        if (!Array.isArray(parsed)) {
            sets = [];
            return;
        }

        sets = parsed.map(set => ({
            id: set.id || createId(),

            name:
                String(
                    set.name ?? "無題"
                ),

            problems:
                Array.isArray(set.problems)
                    ? set.problems.map(
                        normalizeProblem
                    )
                    : []
        }));

    } catch (error) {

        console.error(
            "データ読み込みエラー:",
            error
        );

        sets = [];

        alert(
            "保存データを読み込めませんでした。"
        );
    }
}


/* =========================
   データ保存
========================= */

function saveData() {
    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(sets)
        );

    } catch (error) {

        console.error(
            "データ保存エラー:",
            error
        );

        alert(
            "データを保存できませんでした。"
        );
    }
}


/* =========================
   選択セット保存
========================= */

function saveSelectedSet() {
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
   選択セット取得
========================= */

function getSelectedSet() {

    return sets.find(
        set =>
            set.id ===
            selectedSetId
    );
}


/* =========================
   画面切り替え
========================= */

function hideScreens() {

    mainScreen.hidden = true;
    editScreen.hidden = true;
    quizScreen.hidden = true;
    answerScreen.hidden = true;
    completeScreen.hidden = true;
}


function showMainScreen() {

    hideScreens();

    mainScreen.hidden = false;

    renderSets();
    updateSelectedSet();
}


function showEditScreen() {

    hideScreens();

    editScreen.hidden = false;
}


function showQuizScreen() {

    hideScreens();

    quizScreen.hidden = false;
}


function showAnswerScreen() {

    quizScreen.hidden = true;
    answerScreen.hidden = false;
}


function showCompleteScreen() {

    quizScreen.hidden = true;
    answerScreen.hidden = true;
    completeScreen.hidden = false;
}


/* =========================
   セット一覧表示
========================= */

function renderSets() {

    setList.replaceChildren();

    if (sets.length === 0) {

        const message =
            document.createElement("p");

        message.textContent =
            "問題セットがありません。";

        setList.appendChild(message);

        return;
    }


    const fragment =
        document.createDocumentFragment();


    for (const set of sets) {

        const item =
            document.createElement("div");

        item.className =
            "set-item";


        if (
            set.id ===
            selectedSetId
        ) {

            item.classList.add(
                "selected"
            );
        }


        const name =
            document.createElement("span");

        name.textContent =
            set.name;


        const count =
            document.createElement("span");

        count.textContent =
            `${set.problems.length}問`;


        const deleteButton =
            document.createElement("button");

        deleteButton.type =
            "button";

        deleteButton.textContent =
            "削除";


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

    const set =
        sets.find(
            set =>
                set.id === id
        );


    if (!set) {
        return;
    }


    selectedSetId = id;

    saveSelectedSet();

    renderSets();
    updateSelectedSet();
}


/* =========================
   選択セット表示
========================= */

function updateSelectedSet() {

    const set =
        getSelectedSet();


    if (!set) {

        selectedPanel.hidden = true;
        masteryPanel.hidden = true;
        resetPanel.hidden = true;

        return;
    }


    selectedPanel.hidden = false;
    masteryPanel.hidden = false;
    resetPanel.hidden = false;


    selectedSetName.textContent =
        set.name;


    const problemCount =
        set.problems.length;


    rangeStart.max =
        problemCount;

    rangeEnd.max =
        problemCount;

    questionCount.max =
        problemCount;


    rangeStart.value = 1;

    rangeEnd.value =
        problemCount;


    questionCount.value =
        Math.min(
            10,
            problemCount
        );


    renderMastery();
}


/* =========================
   習熟度表示
========================= */

function renderMastery() {

    const set =
        getSelectedSet();


    if (!set) {
        return;
    }


    masteryList.replaceChildren();


    if (
        set.problems.length === 0
    ) {

        averageMastery.textContent =
            "0%";

        return;
    }


    let total = 0;


    const fragment =
        document.createDocumentFragment();


    set.problems.forEach(
        (problem, index) => {

            total += problem.mastery;


            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "mastery-item";


            const number =
                document.createElement(
                    "div"
                );

            number.className =
                "mastery-number";

            number.textContent =
                index + 1;


            const text =
                document.createElement(
                    "div"
                );

            text.className =
                "mastery-question";

            text.textContent =
                problem.question;


            const bar =
                document.createElement(
                    "div"
                );

            bar.className =
                "mastery-bar";


            const fill =
                document.createElement(
                    "div"
                );

            fill.className =
                "mastery-fill";

            fill.style.width =
                `${problem.mastery}%`;


            bar.appendChild(fill);


            const percent =
                document.createElement(
                    "div"
                );

            percent.className =
                "mastery-percent";

            percent.textContent =
                `${Math.round(
                    problem.mastery
                )}%`;


            item.appendChild(number);
            item.appendChild(text);
            item.appendChild(bar);
            item.appendChild(percent);


            fragment.appendChild(item);
        }
    );


    masteryList.appendChild(
        fragment
    );


    averageMastery.textContent =
        `${Math.round(
            total /
            set.problems.length
        )}%`;
}


/* =========================
   セット削除
========================= */

function deleteSet(id) {

    const set =
        sets.find(
            set =>
                set.id === id
        );


    if (!set) {
        return;
    }


    const confirmed =
        confirm(
            `「${set.name}」を削除しますか？\n` +
            "この操作は元に戻せません。"
        );


    if (!confirmed) {
        return;
    }


    sets =
        sets.filter(
            set =>
                set.id !== id
        );


    if (
        selectedSetId === id
    ) {

        selectedSetId = null;

        saveSelectedSet();
    }


    saveData();

    showMainScreen();
}


/* =========================
   新規セット
========================= */

function createNewSet() {

    editingSetId = null;

    editTitle.textContent =
        "新しい問題セット";

    editName.value = "";

    problemInput.value = "";

    showEditScreen();

    editName.focus();
}


/* =========================
   編集開始
========================= */

function editSelectedSet() {

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

                let line =
                    problem.question;


                if (
                    problem.explanation
                ) {

                    line +=
                        ` * ${problem.explanation}`;
                }


                if (
                    problem.answer
                ) {

                    line +=
                        ` / ${problem.answer}`;
                }


                return line;
            })
            .join("\n");


    showEditScreen();

    editName.focus();
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
   1行を問題に変換
========================= */

function parseLine(line) {

    const text =
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


    /* * または ＊ */

    const star1 =
        text.indexOf("*");

    const star2 =
        text.indexOf("＊");


    let starIndex = -1;


    if (
        star1 !== -1 &&
        star2 !== -1
    ) {

        starIndex =
            Math.min(
                star1,
                star2
            );

    } else if (
        star1 !== -1
    ) {

        starIndex = star1;

    } else {

        starIndex = star2;
    }


    if (
        starIndex !== -1
    ) {

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


        if (
            slashIndex !== -1
        ) {

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


        if (
            slashIndex !== -1
        ) {

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


    if (!questionText) {
        return null;
    }


    return {
        question:
            questionText,

        explanation:
            explanationText,

        answer:
            answerText
    };
}


/* =========================
   問題解析
========================= */

function parseProblems(text) {

    return text
        .split(/\r?\n/)
        .map(parseLine)
        .filter(Boolean);
}


/* =========================
   既存データを維持
========================= */

function preserveProblems(
    oldProblems,
    newProblems
) {

    const used =
        new Set();


    return newProblems.map(
        newProblem => {

            let oldIndex = -1;


            for (
                let i = 0;
                i < oldProblems.length;
                i++
            ) {

                if (
                    used.has(i)
                ) {
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

                    oldIndex = i;

                    break;
                }
            }


            if (
                oldIndex !== -1
            ) {

                used.add(oldIndex);


                const oldProblem =
                    oldProblems[oldIndex];


                return {
                    id:
                        oldProblem.id,

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


    const newProblems =
        parseProblems(
            problemInput.value
        );


    if (
        newProblems.length === 0
    ) {

        alert(
            "問題を1問以上入力してください。"
        );

        return;
    }


    /* 新規 */

    if (
        editingSetId === null
    ) {

        const set = {

            id: createId(),

            name,

            problems:
                newProblems.map(
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


        sets.push(set);

        selectedSetId =
            set.id;

    }


    /* 編集 */

    else {

        const set =
            sets.find(
                set =>
                    set.id ===
                    editingSetId
            );


        if (!set) {

            alert(
                "編集対象が見つかりません。"
            );

            return;
        }


        set.name = name;


        set.problems =
            preserveProblems(
                set.problems,
                newProblems
            );


        selectedSetId =
            set.id;
    }


    saveData();

    saveSelectedSet();

    editingSetId = null;

    showMainScreen();
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


            if (
                random <= 0
            ) {

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
        Number(
            rangeStart.value
        );


    const end =
        Number(
            rangeEnd.value
        );


    const count =
        Number(
            questionCount.value
        );


    if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        !Number.isInteger(count)
    ) {

        alert(
            "数値を正しく入力してください。"
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
            `問題数は1〜${available}問です。`
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


    quizSetName.textContent =
        set.name;


    nextQuestion();
}


/* =========================
   次の問題
========================= */

function nextQuestion() {

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
   答えを見る
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

function findProblem(id) {

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

    if (!currentProblem) {
        return;
    }


    const problem =
        findProblem(
            currentProblem.id
        );


    if (problem) {

        problem.mastery =
            normalizeMastery(
                problem.mastery +
                CORRECT
            );
    }


    saveData();

    nextQuestion();
}


/* =========================
   わからない
========================= */

function markUnknown() {

    if (!currentProblem) {
        return;
    }


    const problem =
        findProblem(
            currentProblem.id
        );


    if (problem) {

        problem.mastery =
            normalizeMastery(
                problem.mastery -
                WRONG
            );
    }


    /*
        もう一度出題
    */

    quizProblems.push(
        currentProblem
    );


    saveData();

    nextQuestion();
}


/* =========================
   クイズ終了
========================= */

function finishQuiz() {

    currentProblem = null;

    saveData();

    showCompleteScreen();
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


    const confirmed =
        confirm(
            `「${set.name}」の暗記度を` +
            "すべて0%にしますか？"
        );


    if (!confirmed) {
        return;
    }


    for (
        const problem of set.problems
    ) {

        problem.mastery = 0;
    }


    saveData();

    renderMastery();
}


/* =========================
   全削除
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

    saveData();

    saveSelectedSet();

    showMainScreen();
}


/* =========================
   イベント
========================= */

newSetButton.addEventListener(
    "click",
    createNewSet
);


editSelectedButton.addEventListener(
    "click",
    editSelectedSet
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


backButton.addEventListener(
    "click",
    showMainScreen
);


/* =========================
   キーボード
========================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.code === "Space" &&
            !quizScreen.hidden
        ) {

            event.preventDefault();

            showAnswer();

            return;
        }


        if (
            !answerScreen.hidden
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
   初期化
========================= */

loadData();


try {

    selectedSetId =
        localStorage.getItem(
            SELECTED_KEY
        );

} catch (error) {

    selectedSetId = null;
}


/*
    保存されているセットが
    実際に存在するか確認
*/

if (
    selectedSetId &&
    !sets.some(
        set =>
            set.id ===
            selectedSetId
    )
) {

    selectedSetId = null;

    saveSelectedSet();
}


showMainScreen();