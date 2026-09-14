export default {
    id: "symbol-to-number",
    title: "元素記号 → 元素番号",
    questionLabel: "元素記号",
    getQuestion(element) { return element.symbol; },
    getAnswer(element) { return String(element.number); },
    normalizeAnswer(answer) { return answer.trim(); }
};
