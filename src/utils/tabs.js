"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noTab = noTab;
function noTab(batch, tab) {
    return batch.map(value => {
        return value.split("\n")
            .filter(value => !!value)
            .map(value => {
            if (value.startsWith(tab))
                return value.substring(tab.length);
            return value;
        })
            .join("\n");
    });
}
//# sourceMappingURL=tabs.js.map