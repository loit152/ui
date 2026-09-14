export default {
    id: "symbol-to-name",
    title: "元素記号 → 元素名",
    questionLabel: "元素記号",
    getQuestion(element) { return element.symbol; },
    getAnswer(element) { return element.name; },
    normalizeAnswer(answer) { return answer.trim(); }
};
