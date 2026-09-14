import numberToSymbol from "../modes/number-to-symbol.js";
import symbolToNumber from "../modes/symbol-to-number.js";
import numberToName from "../modes/number-to-name.js";
import symbolToName from "../modes/symbol-to-name.js";

export const modes = [
    numberToSymbol,
    symbolToNumber,
    numberToName,
    symbolToName
];

export function getMode(id) {
    return modes.find(mode => mode.id === id);
}
