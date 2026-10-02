"use strict";

/* =========================
   基本設定
========================= */

const $ = id => document.getElementById(id);

const STORAGE_KEY = "problem-memorize-data-v3";
const SELECTED_KEY = "problem-memorize-selected-v3";

const CORRECT = 10;
const WRONG = 15;

/* 保存の遅延時間 */
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

/*
    quizTotal:
    クイズ開始時点での問題数。
    「わからない」で問題を再出題しても変化しない。
*/
let quizTotal = 0;

/*
    clearedCount:
    現在のクイズで「初回に正解した問題」の数。
*/
let clearedCount = 0;

/*
    保存予約用タイマー
*/
let saveTimer = null;

/*
    回答処理中の二重実行防止
*/
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
   数値を安全にする
========================= */

function normalizeMastery(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.max(0, Math.min(100, number));
}


/* =========================
   問題データの正規化
========================= */

function normalizeProblem(problem) {
    return {
        id: problem.id || createId(),

        question: String(problem.question ?? ""),
        explanation: String(problem.explanation ?? ""),
        answer: String(problem.answer ?? ""),

        mastery: normalizeMastery(problem.mastery)
    };
}


/* =========================
   データ読み込み
========================= */

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

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
                name: String(set.name ?? "無題"),
                problems: Array.isArray(set.problems)
                    ? set.problems.map(normalizeProblem)
                    : []
            };
        });

    } catch (error) {
        console.error("データ読み込みエラー:", error);

        sets = [];

        alert(
            "保存データを読み込めませんでした。\n" +
            "データが破損している可能性があります。"
        );
    }
}


/* =========================
   即時保存
========================= */

function saveNow() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(sets)
        );

        saveTimer = null;

    } catch (error) {
        console.error("保存エラー:", error);

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

/*
    習熟度変更など、短時間に何度も発生する処理では
    毎回localStorageへ書き込まない。

    例えば10問連続で回答した場合、

        保存
        保存
        保存
        保存
        ...

    ではなく、

        200ms待つ
        ↓
        その間に変更があればタイマーを延長
        ↓
        最後に1回だけ保存

    とする。
*/

function scheduleSave() {
    if (saveTimer !== null) {
        clearTimeout(saveTimer);
    }

    saveTimer = setTimeout(() => {
        saveNow();
    }, SAVE_DELAY);
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
            localStorage.removeItem(SELECTED_KEY);
        }

    } catch (error) {
        console.error("選択セット保存エラー:", error);
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
    mainScreen.hidden = true;
    editScreen.hidden = true;
    quizScreen.hidden = true;
    answerScreen.hidden = true;
    completeScreen.hidden = true;
}

function showMainScreen() {
    hideAllScreens();

    mainScreen.hidden = false;

    renderSets();
    updateSelected();
}

function showEditScreen() {
    hideAllScreens();

    editScreen.hidden = false;
}

function showQuizScreen() {
    hideAllScreens();

    quizScreen.hidden = false;
}

function showAnswerScreen() {
    answerScreen.hidden = false;
}


/* =========================
   セット一覧
========================= */

function renderSets() {
    setList.replaceChildren();

    if (sets.length === 0) {
        const empty = document.createElement("p");

        empty.textContent = "問題セットがありません。";

        setList.appendChild(empty);

        return;
    }

    const fragment = document.createDocumentFragment();

    for (const set of sets) {
        const item = document.createElement("div");

        item.className = "set-item";

        if (set.id === selectedSetId) {
            item.classList.add("selected");
        }

        item.dataset.id = set.id;

        const name = document.createElement("span");

        name.textContent = set.name;

        const count = document.createElement("span");

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
        selectedPanel.hidden = true;
        masteryPanel.hidden = true;
        resetPanel.hidden = true;

        return;
    }

    selectedPanel.hidden = false;
    masteryPanel.hidden = false;
    resetPanel.hidden = false;

    selectedSetName.textContent = set.name;

    rangeStart.value = 1;
    rangeEnd.value = set.problems.length;

    rangeStart.max = set.problems.length;
    rangeEnd.max = set.problems.length;

    questionCount.max = set.problems.length;

    questionCount.value = Math.min(
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

    const problems = set.problems;

    masteryList.replaceChildren();

    if (problems.length === 0) {
        averageMastery.textContent = "0%";

        const empty = document.createElement("p");

        empty.textContent = "問題がありません。";

        masteryList.appendChild(empty);

        return;
    }

    let total = 0;

    const fragment =
        document.createDocumentFragment();

    for (let i = 0; i < problems.length; i++) {
        const problem = problems[i];

        total += problem.mastery;

        const item =
            document.createElement("div");

        item.className = "mastery-item";

        const number =
            document.createElement("div");

        number.className = "mastery-number";
        number.textContent = i + 1;

        const text =
            document.createElement("div");

        text.className = "mastery-question";
        text.textContent = problem.question;

        const bar =
            document.createElement("div");

        bar.className = "mastery-bar";

        const fill =
            document.createElement("div");

        fill.className = "mastery-fill";

        fill.style.width =
            `${problem.mastery}%`;

        bar.appendChild(fill);

        const percent =
            document.createElement("div");

        percent.className = "mastery-percent";

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
        `${Math.round(total / problems.length)}%`;
}


/* =========================
   セット削除
========================= */

function deleteSet(id) {
    const index = sets.findIndex(
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

    editTitle.textContent = "新しい問題セット";

    editName.value = "";

    problemInput.value = "";

    showEditScreen();
}


/* =========================
   編集
========================= */

function openEdit() {
    const set = getSelectedSet();

    if (!set) {
        return;
    }

    editingSetId = set.id;

    editTitle.textContent =
        "問題セットを編集";

    editName.value = set.name;

    /*
        問題を再構築するときも、
        既存問題のIDを保存するために
        IDはここでは文字列に埋め込まない。

        問題データはparseProblemsで生成し、
        後で既存問題と対応させる。
    */

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
   問題入力解析
========================= */

function parseProblemLine(line) {
    let text = line.trim();

    if (!text) {
        return null;
    }

    /*
        問題 * 解説 / 答え

        または

        問題 / 答え
    */

    let questionText = text;
    let explanationText = "";
    let answerText = "";

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
    } else if (asteriskIndex !== -1) {
        starIndex = asteriskIndex;
    } else {
        starIndex = fullWidthAsteriskIndex;
    }

    if (starIndex !== -1) {
        questionText =
            text.slice(0, starIndex).trim();

        const rest =
            text.slice(starIndex + 1).trim();

        const slashIndex =
            findSlash(rest);

        if (slashIndex !== -1) {
            explanationText =
                rest.slice(0, slashIndex).trim();

            answerText =
                rest.slice(slashIndex + 1).trim();

        } else {
            explanationText = rest;
        }

    } else {
        const slashIndex =
            findSlash(text);

        if (slashIndex !== -1) {
            questionText =
                text.slice(0, slashIndex).trim();

            answerText =
                text.slice(slashIndex + 1).trim();
        }
    }

    return {
        question: questionText,
        explanation: explanationText,
        answer: answerText
    };
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

    return Math.min(normal, fullWidth);
}


/* =========================
   問題解析
========================= */

function parseProblems(text) {
    return text
        .split(/\r?\n/)
        .map(parseProblemLine)
        .filter(Boolean)
        .filter(problem => problem.question !== "");
}


/* =========================
   編集時の習熟度・ID維持
========================= */

function preserveProblemData(
    newProblems,
    oldProblems
) {
    /*
        同じ内容の問題が複数ある場合でも
        1つずつ対応させる。

        例：

        old
        A
        A
        B

        new
        A
        B
        A

        でも、

        A → A
        B → B
        A → A

        と順番に対応する。
    */

    const used = new Set();

    return newProblems.map(newProblem => {
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
                oldProblems[matchIndex];

            return {
                id: oldProblem.id || createId(),

                question: newProblem.question,
                explanation: newProblem.explanation,
                answer: newProblem.answer,

                mastery:
                    normalizeMastery(
                        oldProblem.mastery
                    )
            };
        }

        return {
            id: createId(),

            question: newProblem.question,
            explanation: newProblem.explanation,
            answer: newProblem.answer,

            mastery: 0
        };
    });
}


/* =========================
   編集保存
========================= */

function saveEdit() {
    const name =
        editName.value.trim();

    if (!name) {
        alert("セット名を入力してください。");
        return;
    }

    const parsedProblems =
        parseProblems(problemInput.value);

    if (parsedProblems.length === 0) {
        alert("問題を1問以上入力してください。");
        return;
    }

    if (editingSetId === null) {
        /*
            新規作成
        */

        const newSet = {
            id: createId(),
            name,
            problems: parsedProblems.map(problem => ({
                id: createId(),

                question: problem.question,
                explanation: problem.explanation,
                answer: problem.answer,

                mastery: 0
            }))
        };

        sets.push(newSet);

        selectedSetId = newSet.id;

        saveSelected();

    } else {
        /*
            既存セット編集
        */

        const set =
            sets.find(
                set => set.id === editingSetId
            );

        if (!set) {
            alert("編集対象のセットが見つかりません。");
            return;
        }

        const newProblems =
            preserveProblemData(
                parsedProblems,
                set.problems
            );

        set.name = name;
        set.problems = newProblems;

        selectedSetId = set.id;

        saveSelected();
    }

    /*
        セット構造を変更した場合は
        ここでは即時保存する。
    */

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
    const set = getSelectedSet();

    if (!set) {
        return [];
    }

    const source =
        set.problems.slice(
            start - 1,
            end
        );

    /*
        残りの問題。
    */
    const remaining = [...source];

    const result = [];

    while (
        remaining.length > 0 &&
        result.length < count
    ) {
        let totalWeight = 0;

        for (const problem of remaining) {
            /*
                mastery 0  → weight 101
                mastery 50 → weight 51
                mastery100 → weight 1
            */

            totalWeight +=
                101 - problem.mastery;
        }

        let random =
            Math.random() * totalWeight;

        let selectedIndex = 0;

        for (
            let i = 0;
            i < remaining.length;
            i++
        ) {
            random -=
                101 - remaining[i].mastery;

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


/* =========================
   クイズ開始
========================= */

function startQuiz() {
    const set = getSelectedSet();

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
        alert("範囲と問題数を正しく入力してください。");
        return;
    }

    if (
        start < 1 ||
        end > set.problems.length ||
        start > end
    ) {
        alert("問題範囲が正しくありません。");
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

    if (quizProblems.length === 0) {
        alert("問題を作成できませんでした。");
        return;
    }

    quizTotal =
        quizProblems.length;

    clearedCount = 0;

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

    if (quizProblems.length === 0) {
        finishQuiz();
        return;
    }

    currentProblem =
        quizProblems.shift();

    /*
        重要：

        clearedCount は
        「正解した問題数」。

        したがって「わからない」で
        問題を再追加しても増えない。
    */

    progress.textContent =
        `${clearedCount + 1} / ${quizTotal}`;

    question.textContent =
        currentProblem.question;

    questionExplanation.textContent =
        currentProblem.explanation;

    answer.textContent =
        currentProblem.answer;

    questionExplanation.hidden = true;

    showAnswerButton.disabled = false;

    showQuizScreen();
}


/* =========================
   答えを表示
========================= */

function showAnswer() {
    if (!currentProblem) {
        return;
    }

    questionExplanation.hidden = false;

    showAnswerButton.disabled = true;

    showAnswerScreen();
}


/* =========================
   問題をIDで探す
========================= */

function findProblemById(id) {
    const set = getSelectedSet();

    if (!set) {
        return null;
    }

    return set.problems.find(
        problem => problem.id === id
    );
}


/* =========================
   正解
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
                problem.mastery + CORRECT
            );
    }

    clearedCount++;

    /*
        習熟度変更はまとめて保存。
    */
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
                problem.mastery - WRONG
            );
    }

    /*
        同じ問題をもう一度出す。
    */
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

    quizScreen.hidden = true;
    answerScreen.hidden = true;
    completeScreen.hidden = false;
}


/* =========================
   習熟度リセット
========================= */

function resetMastery() {
    const set = getSelectedSet();

    if (!set) {
        return;
    }

    const confirmed = confirm(
        `「${set.name}」の習熟度をすべて0%にしますか？`
    );

    if (!confirmed) {
        return;
    }

    for (const problem of set.problems) {
        problem.mastery = 0;
    }

    saveNow();

    renderMastery();
}


/* =========================
   全データ削除
========================= */

function resetAll() {
    const confirmed = confirm(
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
        /*
            キー長押しによる
            keydownの連続発火を無視。
        */
        if (event.repeat) {
            return;
        }

        /*
            クイズ画面

            Space
            → 答えを表示
        */

        if (
            !quizScreen.hidden &&
            event.code === "Space"
        ) {
            event.preventDefault();

            showAnswer();

            return;
        }

        /*
            答え画面

            ← わからない
            → わかる
        */

        if (!answerScreen.hidden) {
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
        /*
            クイズ中に変更された習熟度を
            メイン画面にも反映。
        */

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
            clearTimeout(saveTimer);
            saveTimer = null;
        }

        saveNow();
    }
);


/* =========================
   初期化
========================= */

load();

/*
    選択中セットを復元。
*/

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

/*
    存在しないセットが選択されていた場合。
*/

if (
    selectedSetId &&
    !sets.some(
        set => set.id === selectedSetId
    )
) {
    selectedSetId = null;

    saveSelected();
}

showMainScreen();