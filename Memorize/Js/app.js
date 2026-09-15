(function () {
    "use strict";

    /*
     * app.js
     * ----------------------------------------
     * ここでは「クイズの仕組み」だけを管理する。
     * 元素や各モード固有の問題データは Mode-Data に置く。
     *
     * 新しいモードを追加するとき、基本的にこのファイルは変更しない。
     */

    const modes = window.ElementMemoryModes || [];
    const storage = window.ElementMemoryStorage;

    const modeSelect = document.getElementById("modeSelect");
    const questionLabel = document.getElementById("questionLabel");
    const question = document.getElementById("question");
    const answerInput = document.getElementById("answerInput");
    const answerButton = document.getElementById("answerButton");
    const nextButton = document.getElementById("nextButton");
    const result = document.getElementById("result");
    const rangeStartInput = document.getElementById("rangeStart");
    const rangeEndInput = document.getElementById("rangeEnd");
    const rangeApplyButton = document.getElementById("rangeApplyButton");
    const averageMastery = document.getElementById("averageMastery");
    const masteryList = document.getElementById("masteryList");
    const resetModeButton = document.getElementById("resetModeButton");
    const resetAllButton = document.getElementById("resetAllButton");

    let currentMode = modes.length > 0 ? modes[0].id : null;
    let currentQuestionIndex = null;
    let rangeStart = 1;
    let rangeEnd = 118;
    let answered = false;

    function createMastery() {
        const result = {};

        modes.forEach(function (mode) {
            result[mode.id] = mode.data.map(function () {
                return 0;
            });
        });

        return result;
    }

    let mastery = createMastery();

    function getMode() {
        return modes.find(function (mode) {
            return mode.id === currentMode;
        }) || modes[0];
    }

    function save() {
        storage.saveState({
            version: 1,
            mastery: mastery,
            currentMode: currentMode,
            rangeStart: rangeStart,
            rangeEnd: rangeEnd
        });
    }

    function load() {
        const saved = storage.loadState();
        if (!saved) return;

        if (saved.mastery && typeof saved.mastery === "object") {
            modes.forEach(function (mode) {
                if (!Array.isArray(saved.mastery[mode.id])) return;

                saved.mastery[mode.id].forEach(function (value, index) {
                    if (index >= mastery[mode.id].length) return;

                    const number = Number(value);
                    if (Number.isFinite(number)) {
                        mastery[mode.id][index] =
                            Math.max(0, Math.min(100, number));
                    }
                });
            });
        }

        if (modes.some(function (mode) {
            return mode.id === saved.currentMode;
        })) {
            currentMode = saved.currentMode;
        }

        if (Number.isInteger(saved.rangeStart)) {
            rangeStart = saved.rangeStart;
        }

        if (Number.isInteger(saved.rangeEnd)) {
            rangeEnd = saved.rangeEnd;
        }

        normalizeRange();
    }

    function normalizeRange() {
        const mode = getMode();
        if (!mode || mode.data.length === 0) return;

        const max = mode.data.length;

        rangeStart = Math.max(1, Math.min(max, rangeStart));
        rangeEnd = Math.max(1, Math.min(max, rangeEnd));

        if (rangeStart > rangeEnd) {
            const temp = rangeStart;
            rangeStart = rangeEnd;
            rangeEnd = temp;
        }

        rangeStartInput.value = rangeStart;
        rangeEndInput.value = rangeEnd;
    }

    function getRangeIndices(mode) {
        const indices = [];

        for (let i = 0; i < mode.data.length; i++) {
            const item = mode.data[i];

            /*
             * number が存在するモードでは元素番号を範囲として使う。
             * 将来別分野のデータにする場合は index ベースでも動く。
             */
            const number = Number(item.number);

            if (Number.isFinite(number)) {
                if (number >= rangeStart && number <= rangeEnd) {
                    indices.push(i);
                }
            } else {
                const position = i + 1;
                if (position >= rangeStart && position <= rangeEnd) {
                    indices.push(i);
                }
            }
        }

        return indices;
    }

    function getWeight(value) {
        return 6 - Math.floor(value / 20);
    }

    function chooseQuestionIndex() {
        const mode = getMode();
        const indices = getRangeIndices(mode);

        if (indices.length === 0) return null;

        let totalWeight = 0;

        indices.forEach(function (index) {
            totalWeight += getWeight(mastery[mode.id][index]);
        });

        let random = Math.random() * totalWeight;

        for (const index of indices) {
            random -= getWeight(mastery[mode.id][index]);

            if (random < 0) {
                return index;
            }
        }

        return indices[indices.length - 1];
    }

    function nextQuestion() {
        const mode = getMode();
        if (!mode) return;

        currentQuestionIndex = chooseQuestionIndex();

        if (currentQuestionIndex === null) {
            questionLabel.textContent = "";
            question.textContent = "出題できる問題がありません";
            return;
        }

        answered = false;

        const item = mode.data[currentQuestionIndex];

        questionLabel.textContent = mode.questionLabel;
        question.textContent = item.question;

        result.textContent = "";
        answerInput.value = "";
        answerButton.disabled = false;

        answerInput.focus();
    }

    function checkAnswer() {
        if (currentQuestionIndex === null) return;

        if (answered) {
            nextQuestion();
            return;
        }

        const mode = getMode();
        const item = mode.data[currentQuestionIndex];

        const userAnswer = mode.normalizeAnswer(answerInput.value);
        const correctAnswer = mode.normalizeAnswer(String(item.answer));

        if (userAnswer === correctAnswer) {
            mastery[mode.id][currentQuestionIndex] =
                Math.min(100, mastery[mode.id][currentQuestionIndex] + 10);

            result.textContent = "正解";
            answered = true;
            answerButton.disabled = true;
        } else {
            mastery[mode.id][currentQuestionIndex] =
                Math.max(0, mastery[mode.id][currentQuestionIndex] - 20);

            result.textContent = "不正解　正解：" + item.answer;
        }

        save();
        updateStats();
    }

    function renderModes() {
        modeSelect.innerHTML = "";

        modes.forEach(function (mode) {
            const button = document.createElement("button");

            button.type = "button";
            button.textContent = mode.title;

            if (mode.id === currentMode) {
                button.classList.add("active");
            }

            button.addEventListener("click", function () {
                currentMode = mode.id;

                normalizeRange();
                renderModes();
                updateStats();
                save();
                nextQuestion();
            });

            modeSelect.appendChild(button);
        });
    }

    function updateStats() {
        const mode = getMode();
        if (!mode) return;

        const values = mastery[mode.id];

        let total = 0;

        values.forEach(function (value) {
            total += value;
        });

        const average = values.length ? total / values.length : 0;
        averageMastery.textContent = Math.round(average) + "%";

        masteryList.innerHTML = "";

        const indices = getRangeIndices(mode);

        indices.forEach(function (index) {
            const item = mode.data[index];
            const value = values[index];

            const row = document.createElement("div");
            row.className = "mastery-item";

            const number = document.createElement("span");
            number.textContent = item.number ?? (index + 1);

            const symbol = document.createElement("span");
            symbol.textContent = item.symbol ?? "";

            const bar = document.createElement("div");
            bar.className = "mastery-bar";

            const fill = document.createElement("div");
            fill.className = "mastery-fill";
            fill.style.width = value + "%";

            const percent = document.createElement("span");
            percent.textContent = value + "%";

            bar.appendChild(fill);
            row.appendChild(number);
            row.appendChild(symbol);
            row.appendChild(bar);
            row.appendChild(percent);

            masteryList.appendChild(row);
        });
    }

    function applyRange() {
        rangeStart = Number(rangeStartInput.value);
        rangeEnd = Number(rangeEndInput.value);

        if (!Number.isInteger(rangeStart) ||
            !Number.isInteger(rangeEnd)) {
            return;
        }

        normalizeRange();
        save();
        updateStats();
        nextQuestion();
    }

    function resetCurrentMode() {
        const mode = getMode();
        if (!mode) return;

        mastery[mode.id] = mode.data.map(function () {
            return 0;
        });

        save();
        updateStats();
        nextQuestion();
    }

    function resetAll() {
        mastery = createMastery();

        currentMode = modes.length > 0 ? modes[0].id : null;
        rangeStart = 1;
        rangeEnd = 118;

        normalizeRange();

        storage.clearState();
        save();

        renderModes();
        updateStats();
        nextQuestion();
    }

    answerButton.addEventListener("click", checkAnswer);
    nextButton.addEventListener("click", nextQuestion);
    rangeApplyButton.addEventListener("click", applyRange);

    resetModeButton.addEventListener("click", resetCurrentMode);
    resetAllButton.addEventListener("click", resetAll);

    document.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            checkAnswer();
        }

        if (event.code === "Space") {
            event.preventDefault();
            checkAnswer();
        }
    });

    load();
    normalizeRange();
    renderModes();
    updateStats();
    nextQuestion();
})();
