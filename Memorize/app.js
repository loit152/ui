"use strict";
const $ = id => document.getElementById(id);
const STORAGE_KEY = "problem-memorize-data-v3";
const SELECTED_KEY = "problem-memorize-selected-v3";
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
    rangeStart,
    rangeEnd,
    startButton,
    newSetButton,
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
    knowButton,
    unknownButton,
    completeScreen,
    backButton,
    resetPanel,
    resetMasteryButton,
    resetAllButton
] = [
    "questionCount",
    "setList",
    "selectedPanel",
    "selectedSetName",
    "editSelectedButton",
    "masteryPanel",
    "averageMastery",
    "masteryList",
    "rangeStart",
    "rangeEnd",
    "startButton",
    "newSetButton",
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
    "knowButton",
    "unknownButton",
    "completeScreen",
    "backButton",
    "resetPanel",
    "resetMasteryButton",
    "resetAllButton"
].map($);
/* =========================
   状態
========================= */
let sets = load();
let selectedSetId =
    localStorage.getItem(SELECTED_KEY);
let editingSetId = null;
let quizProblems = [];
let currentProblem = null;
let currentNumber = 0;
/* =========================
   Storage
========================= */
function load() {
    try {
        const data =
            JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            );
        return Array.isArray(data)
            ? data
            : [];
    } catch {
        return [];
    }
}
function save() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(sets)
    );
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
function createId() {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2)
    );
}
/* =========================
   Set
========================= */
function getSelectedSet() {
    return sets.find(
        set => set.id === selectedSetId
    );
}
/* =========================
   Screen
========================= */
function hideScreens() {
    [
        editScreen,
        quizScreen,
        answerScreen,
        completeScreen
    ].forEach(
        element =>
            element.classList.add("hidden")
    );
}
function showMainScreen() {
    hideScreens();
    const hasSet =
        !!selectedSetId;
    selectedPanel.classList.toggle(
        "hidden",
        !hasSet
    );
    masteryPanel.classList.toggle(
        "hidden",
        !hasSet
    );
    resetPanel.classList.toggle(
        "hidden",
        !hasSet
    );
    renderSets();
    if (hasSet) {
        updateSelected();
    }
}
function showEditScreen() {
    hideScreens();
    [
        selectedPanel,
        masteryPanel,
        resetPanel
    ].forEach(
        element =>
            element.classList.add("hidden")
    );
    editScreen.classList.remove("hidden");
}function createQuizProblems(
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
        [
            ...set.problems.slice(
                start - 1,
                end
            )
        ];

    const result = [];

    count = Math.min(
        count,
        remaining.length
    );

    while (
        result.length < count
    ) {
        const total =
            remaining.reduce(
                (sum, problem) =>
                    sum +
                    101 -
                    problem.mastery,
                0
            );

        let random =
            Math.random() * total;

        let index = 0;

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
function showAnswerScreen() {
    quizScreen.classList.add("hidden");
    answerScreen.classList.remove("hidden");
}
/* =========================
   Set一覧
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
        if (set.id === selectedSetId) {
            item.classList.add("active");
        }
        item.innerHTML = `
            <div class="set-info">
                <div class="set-name"></div>
                <div class="set-count">
                    ${set.problems.length} 問
                </div>
            </div>
            <div class="set-actions">
                <button
                    type="button"
                    class="delete-button">
                    削除
                </button>
            </div>
        `;
        item.querySelector(
            ".set-name"
        ).textContent = set.name;
        item.onclick = () => {
            selectedSetId =
                set.id;
            saveSelected();
            showMainScreen();
        };
        item.querySelector(
            ".delete-button"
        ).onclick = event => {
            event.stopPropagation();
            deleteSet(set.id);
        };
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
        return;
    }
    selectedSetName.textContent =
        set.name;
    rangeStart.max =
        set.problems.length;
    rangeEnd.max =
        set.problems.length;
    rangeStart.value =
        1;
    rangeEnd.value =
        Math.max(
            1,
            set.problems.length
        );
    renderMastery(set);
}
/* =========================
   暗記度
========================= */
function renderMastery(set) {
    const problems =
        set.problems;
    const total =
        problems.reduce(
            (sum, problem) =>
                sum + problem.mastery,
            0
        );
    averageMastery.textContent =
        problems.length
            ? `${Math.round(
                total / problems.length
              )}%`
            : "0%";
    masteryList.innerHTML =
        problems.map(
            (problem, index) => `
                <div class="mastery-item">
                    <div class="mastery-number">
                        ${index + 1}
                    </div>
                    <div
                        class="mastery-question"
                        title="${escapeHTML(
                            problem.question
                        )}">
                        ${escapeHTML(
                            problem.question
                        )}
                    </div>
                    <div class="mastery-bar">
                        <div
                            class="mastery-fill"
                            style="width:${problem.mastery}%">
                        </div>
                    </div>
                    <div class="mastery-value">
                        ${problem.mastery}%
                    </div>
                </div>
            `
        ).join("");
}
function escapeHTML(text) {
    const element =
        document.createElement("div");
    element.textContent =
        text;
    return element.innerHTML;
}
/* =========================
   新規
========================= */
function openNewSet() {
    editingSetId = null;
    editTitle.textContent =
        "問題セットを作成";
    editName.value = "";
    problemInput.value = "";
    showEditScreen();
    editName.focus();
}
/* =========================
   編集
========================= */
function openEditSet(id) {
    const set =
        sets.find(
            set =>
                set.id === id
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
            .map(problem => {
                const explanationText =
                    problem.explanation
                        ? ` * ${problem.explanation}`
                        : "";
                return (
                    problem.question +
                    explanationText +
                    " / " +
                    problem.answer
                );
            })
            .join("\n");
    showEditScreen();
    editName.focus();
}
/* =========================
   保存
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
    const problems = [];
    for (const line of lines) {
        /*
         * 最初の / で分割
         */
        const slash =
            line.indexOf("/");
        if (slash === -1) {
            alert(
                `形式が正しくありません。\n\n${line}\n\n「問題 * 説明 / 答え」の形式で入力してください。`
            );
            return;
        }
        const left =
            line.slice(0, slash).trim();
        const answerText =
            line
                .slice(slash + 1)
                .trim();
        /*
         * * または ＊ で問題と説明を分ける
         */
        const star =
            left.search(/[*＊]/);
        if (star === -1) {
            alert(
                `説明がありません。\n\n${line}\n\n「問題 * 説明 / 答え」の形式で入力してください。`
            );
            return;
        }
        const questionText =
            left
                .slice(0, star)
                .trim();
        const explanationText =
            left
                .slice(star + 1)
                .trim();
        if (
            !questionText ||
            !explanationText ||
            !answerText
        ) {
            alert(
                `問題・説明・答えのいずれかが空です。\n\n${line}`
            );
            return;
        }
        /*
         * 同じ問題なら暗記度を引き継ぐ
         */
        let oldProblem = null;
        if (editingSetId) {
            const oldSet =
                sets.find(
                    set =>
                        set.id === editingSetId
                );
            oldProblem =
                oldSet?.problems.find(
                    problem =>
                        problem.question ===
                            questionText &&
                        problem.explanation ===
                            explanationText &&
                        problem.answer ===
                            answerText
                );
        }
        problems.push({
            question:
                questionText,
            explanation:
                explanationText,
            answer:
                answerText,
            mastery:
                oldProblem?.mastery ?? 0
        });
    }
    if (!problems.length) {
        alert(
            "問題を1問以上入力してください。"
        );
        return;
    }
    /*
     * 編集
     */
    if (editingSetId) {
        const set =
            sets.find(
                set =>
                    set.id === editingSetId
            );
        if (!set) {
            return;
        }
        set.name =
            name;
        set.problems =
            problems;
    }
    /*
     * 新規
     */
    else {
        const newSet = {
            id:
                createId(),
            name,
            problems
        };
        sets.push(
            newSet
        );
        selectedSetId =
            newSet.id;
        saveSelected();
    }
    save();
    editingSetId = null;
    showMainScreen();
}
/* =========================
   削除
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
    if (
        !confirm(
            `「${set.name}」を削除しますか？`
        )
    ) {
        return;
    }
    sets =
        sets.filter(
            set =>
                set.id !== id
        );
    if (selectedSetId === id) {
        selectedSetId = null;
        saveSelected();
    }
    save();
    showMainScreen();
}
/* =========================
   出題順作成
========================= */
function createQuizProblems(
    start,
    end
) {
    const set =
        getSelectedSet();
    if (!set) {
        return [];
    }
    const remaining =
        [
            ...set.problems.slice(
                start - 1,
                end
            )
        ];
    const result = [];
    while (remaining.length) {
        const total =
            remaining.reduce(
                (sum, problem) =>
                    sum +
                    101 -
                    problem.mastery,
                0
            );
        let random =
            Math.random() * total;
        let index = 0;
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
   クイズ開始
========================= */
function startQuiz() {const end =
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
    !Number.isInteger(count) ||
    start < 1 ||
    end > set.problems.length ||
    start > end ||
    count < 1 ||
    count > end - start + 1
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
    currentNumber++;
    progress.textContent =
        `${currentNumber} / ${
            currentNumber +
            quizProblems.length
        }`;
    /*
     * 問題
     */
    question.textContent =
        currentProblem.question;
    /*
     * 問題画面に説明を表示
     */
    questionExplanation.textContent =
        currentProblem.explanation;
    /*
     * 答え画面用
     */
    answer.textContent =
        currentProblem.answer;
    showQuizScreen();
}
/* =========================
   答え
========================= */
function showAnswer() {
    if (!currentProblem) {
        return;
    }
    /*
     * 答え画面では答えだけ表示
     */
    answer.textContent =
        currentProblem.answer;
    showAnswerScreen();
}
/* =========================
   暗記度更新
========================= */
function updateMastery(
    problem,
    known
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
                item.explanation ===
                    problem.explanation &&
                item.answer ===
                    problem.answer
        );
    if (!target) {
        return;
    }
    target.mastery +=
        known
            ? CORRECT
            : -WRONG;
    target.mastery =
        Math.max(
            0,
            Math.min(
                100,
                target.mastery
            )
        );
    save();
}
/* =========================
   わかる
========================= */
function markKnown() {
    if (!currentProblem) {
        return;
    }
    updateMastery(
        currentProblem,
        true
    );
    currentProblem = null;
    updateSelected();
    nextQuestion();
}
/* =========================
   わからない
========================= */
function markUnknown() {
    if (!currentProblem) {
        return;
    }
    updateMastery(
        currentProblem,
        false
    );
    quizProblems.push(
        currentProblem
    );
    currentProblem = null;
    updateSelected();
    nextQuestion();
}
/* =========================
   完了
========================= */
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
    updateSelected();
}
/* =========================
   リセット
========================= */
function resetMastery() {
    const set =
        getSelectedSet();
    if (!set) {
        return;
    }
    if (
        !confirm(
            "このセットの暗記度をすべて0%にしますか？"
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
    updateSelected();
}
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
    showMainScreen();
}
/* =========================
   ボタン
========================= */
newSetButton.onclick =
    openNewSet;
editSelectedButton.onclick =
    () => {
        if (selectedSetId) {
            openEditSet(
                selectedSetId
            );
        }
    };
startButton.onclick =
    startQuiz;
showAnswerButton.onclick =
    showAnswer;
knowButton.onclick =
    markKnown;
unknownButton.onclick =
    markUnknown;
saveEditButton.onclick =
    saveEditor;
cancelEditButton.onclick =
    () => {
        editingSetId = null;
        showMainScreen();
    };
backButton.onclick =
    showMainScreen;
resetMasteryButton.onclick =
    resetMastery;
resetAllButton.onclick =
    resetAll;
/* =========================
   キーボード
========================= */
document.onkeydown =
    event => {
        if (
            !editScreen.classList.contains(
                "hidden"
            )
        ) {
            return;
        }
        if (
            ["INPUT", "TEXTAREA"].includes(
                event.target.tagName
            )
        ) {
            return;
        }
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
            }
            if (
                event.key === "ArrowRight"
            ) {
                event.preventDefault();
                markKnown();
            }
        }
    };
/* =========================
   初期化
========================= */
if (
    selectedSetId &&
    !sets.some(
        set =>
            set.id === selectedSetId
    )
) {
    selectedSetId = null;
}
showMainScreen();