export default {
    id: "number-to-symbol",
    title: "元素番号 → 元素記号",
    questionLabel: "元素番号",
    getQuestion(element) { return element.number; },
    getAnswer(element) { return element.symbol; },
    normalizeAnswer(answer) { return answer.trim().toLowerCase(); }
};
