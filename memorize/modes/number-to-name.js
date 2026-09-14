export default {
    id: "number-to-name",
    title: "元素番号 → 元素名",
    questionLabel: "元素番号",
    getQuestion(element) { return element.number; },
    getAnswer(element) { return element.name; },
    normalizeAnswer(answer) { return answer.trim(); }
};
