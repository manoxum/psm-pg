"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reverseDependencies = reverseDependencies;
function reverseDependencies(response) {
    const directDependents = new Map();
    for (const item of response) {
        item.dependents = [];
        directDependents.set(item.model.model, []);
    }
    const dependentsMap = new Map();
    for (const item of response) {
        for (const dependency of item.dependencies) {
            const current = directDependents.get(dependency);
            if (current)
                current.push(item.model.model);
        }
    }
    function collectDependents(target, visited = new Set()) {
        if (dependentsMap.has(target)) {
            return dependentsMap.get(target);
        }
        const dependents = new Set();
        for (const dependent of directDependents.get(target) || []) {
            if (!visited.has(dependent)) {
                dependents.add(dependent);
                visited.add(dependent);
                const indirect = collectDependents(dependent, new Set(visited));
                for (const value of indirect)
                    dependents.add(value);
            }
        }
        dependentsMap.set(target, dependents);
        return dependents;
    }
    for (const item of response) {
        const allDependents = collectDependents(item.model.model);
        item.dependents = [...allDependents];
    }
}
//# sourceMappingURL=dependencies.js.map