import { elements } from "./data.js";
import { modes, getMode } from "./mode-manager.js";
import { saveState, loadState, clearState } from "./storage.js";

const modeSelect = document.querySelector("#modeSelect");
const questionLabel = document.querySelector("#questionLabel");
const question = document.querySelector("#question");
const answerInput = document.querySelector("#answerInput");
const answerButton = document.querySelector("#answerButton");
const result = document.querySelector("#result");
const nextButton = document.querySelector("#nextButton");
const averageMastery = document.querySelector("#averageMastery");
const masteryList = document.querySelector("#masteryList");
const rangeStartInput = document.querySelector("#rangeStart");
const rangeEndInput = document.querySelector("#rangeEnd");
const rangeApplyButton = document.querySelector("#rangeApplyButton");
const resetModeButton = document.querySelector("#resetModeButton");
const resetAllButton = document.querySelector("#resetAllButton");

let currentMode = "number-to-symbol";
let rangeStart = 1;
let rangeEnd = elements.length;
let currentElementIndex = 0;
let answered = false;
let correctAnswer = "";

function createMastery() {
    return Object.fromEntries(
        modes.map(mode => [mode.id, Array(elements.length).fill(0)])
    );
}

let mastery = createMastery();

function mergeLoadedMastery(savedMastery) {
    const fresh = createMastery();

    if (!savedMastery || typeof savedMastery !== "object") {
        return fresh;
    }

    for (const mode of modes) {
        const saved = savedMastery[mode.id];

        if (!Array.isArray(saved)) continue;

        fresh[mode.id] = elements.map((_, index) => {
            const value = Number(saved[index]);
            if (!Number.isFinite(value)) return 0;
            return Math.max(0, Math.min(100, Math.round(value)));
        });
    }

    return fresh;
}

function saveCurrentState() {
    saveState({
        mastery,
        currentMode,
        rangeStart,
        rangeEnd
    });
}

function clampMastery(value) {
    return Math.max(0, Math.min(100, value));
}

function getWeight(value) {
    return 6 - Math.floor(value / 20);
}

function getRangeIndices() {
    const indices = [];

    elements.forEach((element, index) => {
        if (
            element.number >= rangeStart &&
            element.number <= rangeEnd
        ) {
            indices.push(index);
        }
    });

    return indices;
}

function chooseQuestion() {
    const indices = getRangeIndices();

    if (indices.length === 0) {
        return 0;
    }

    const modeMastery = mastery[currentMode];

    const weights = indices.map(index =>
        getWeight(modeMastery[index])
    );

    const totalWeight = weights.reduce(
        (sum, weight) => sum + weight,
        0
    );

    let random = Math.random() * totalWeight;

    for (let i = 0; i < indices.length; i++) {
        random -= weights[i];

        if (random < 0) {
            return indices[i];
        }
    }

    return indices[indices.length - 1];
}

function nextQuestion() {
    const mode = getMode(currentMode);

    if (!mode) {
        currentMode = modes[0].id;
        return nextQuestion();
    }

    currentElementIndex = chooseQuestion();

    const element = elements[currentElementIndex];

    questionLabel.textContent = mode.questionLabel;
    question.textContent = mode.getQuestion(element);

    answerInput.value = "";
    answerInput.disabled = false;
    answerButton.disabled = false;

    result.textContent = "";
    result.className = "";

    answered = false;
    correctAnswer = mode.getAnswer(element);

    answerInput.focus();
    updateStats();
}

function checkAnswer() {
    if (answered) return;

    const mode = getMode(currentMode);
    if (!mode) return;

    const element = elements[currentElementIndex];

    const userAnswer =
        mode.normalizeAnswer(answerInput.value);

    const expectedAnswer =
        mode.normalizeAnswer(mode.getAnswer(element));

    if (userAnswer === expectedAnswer) {
        handleCorrect();
    } else {
        handleWrong(mode.getAnswer(element));
    }
}

function handleCorrect() {
    const values = mastery[currentMode];

    values[currentElementIndex] =
        clampMastery(values[currentElementIndex] + 10);

    result.textContent = "正解";
    result.className = "correct";

    answered = true;
    answerInput.disabled = true;
    answerButton.disabled = true;

    saveCurrentState();
    updateStats();
}

function handleWrong(answer) {
    const values = mastery[currentMode];

    values[currentElementIndex] =
        clampMastery(values[currentElementIndex] - 20);

    result.textContent = `不正解（正解：${answer}）`;
    result.className = "wrong";

    answered = true;
    answerInput.disabled = true;
    answerButton.disabled = true;

    saveCurrentState();
    updateStats();
}

function updateStats() {
    const indices = getRangeIndices();
    const values = mastery[currentMode];

    if (indices.length === 0) {
        averageMastery.textContent = "0%";
        masteryList.innerHTML = "";
        return;
    }

    const average =
        indices.reduce((sum, index) => sum + values[index], 0)
        / indices.length;

    averageMastery.textContent =
        `${average.toFixed(1)}%`;

    masteryList.innerHTML = "";

    for (const index of indices) {
        const element = elements[index];
        const item = document.createElement("div");

        item.className = "mastery-item";
        item.textContent =
            `${element.number}　${element.symbol}　${element.name}　${values[index]}%`;

        masteryList.appendChild(item);
    }
}

function renderModeButtons() {
    modeSelect.innerHTML = "";

    for (const mode of modes) {
        const button = document.createElement("button");

        button.type = "button";
        button.textContent = mode.title;
        button.dataset.modeId = mode.id;

        button.addEventListener("click", () => {
            currentMode = mode.id;

            renderModeButtons();
            saveCurrentState();
            nextQuestion();
        });

        modeSelect.appendChild(button);
    }

    const activeButton =
        modeSelect.querySelector(`[data-mode-id="${currentMode}"]`);

    if (activeButton) {
        activeButton.classList.add("active");
    }
}

function applyRange() {
    let start = Number(rangeStartInput.value);
    let end = Number(rangeEndInput.value);

    if (!Number.isInteger(start)) start = 1;
    if (!Number.isInteger(end)) end = elements.length;

    start = Math.max(1, Math.min(elements.length, start));
    end = Math.max(1, Math.min(elements.length, end));

    if (start > end) {
        [start, end] = [end, start];
    }

    rangeStart = start;
    rangeEnd = end;

    rangeStartInput.value = rangeStart;
    rangeEndInput.value = rangeEnd;

    saveCurrentState();
    nextQuestion();
}

function resetMode() {
    mastery[currentMode] =
        Array(elements.length).fill(0);

    saveCurrentState();
    updateStats();
    nextQuestion();
}

function resetAll() {
    mastery = createMastery();

    saveCurrentState();
    updateStats();
    nextQuestion();
}

function handleKeydown(event) {
    if (event.key === "Enter") {
        if (!answered) {
            event.preventDefault();
            checkAnswer();
        }
        return;
    }

    if (event.code !== "Space") return;

    if (document.activeElement === answerInput) {
        return;
    }

    event.preventDefault();

    if (answered) {
        nextQuestion();
    } else {
        checkAnswer();
    }
}

answerButton.addEventListener("click", checkAnswer);
nextButton.addEventListener("click", nextQuestion);
rangeApplyButton.addEventListener("click", applyRange);
resetModeButton.addEventListener("click", resetMode);
resetAllButton.addEventListener("click", resetAll);
document.addEventListener("keydown", handleKeydown);

const savedState = loadState();

if (savedState) {
    if (typeof savedState.currentMode === "string") {
        const savedMode = getMode(savedState.currentMode);

        if (savedMode) {
            currentMode = savedMode.id;
        }
    }

    if (Number.isInteger(savedState.rangeStart)) {
        rangeStart = Math.max(
            1,
            Math.min(elements.length, savedState.rangeStart)
        );
    }

    if (Number.isInteger(savedState.rangeEnd)) {
        rangeEnd = Math.max(
            1,
            Math.min(elements.length, savedState.rangeEnd)
        );
    }

    if (rangeStart > rangeEnd) {
        [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
    }

    mastery = mergeLoadedMastery(savedState.mastery);
}

rangeStartInput.value = rangeStart;
rangeEndInput.value = rangeEnd;

renderModeButtons();
nextQuestion();
