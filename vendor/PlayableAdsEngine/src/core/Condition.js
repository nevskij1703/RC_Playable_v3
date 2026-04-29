export default class Condition {
    static areSatisfied(obj, conditions = [], ...args) {
        let _conditions = Array.isArray(conditions) ? conditions : [conditions];

        for (let i in _conditions) {
            if (!Condition.isSatisfied(obj, _conditions[i], ...args)) {
                return false;
            }
        }

        return true;
    }

    static isSatisfied(obj, condition, ...args) {
        if (typeof condition === 'function') {
            return condition.call(obj, ...args);
        }

        return condition.c.call(obj, Object.assign({}, condition));
    }

    static areValuesMatch(obj, values) {
        if (!values) {
            return true;
        }

        for (let key in values) {
            if (obj[key] === undefined || obj[key] !== values[key]) {
                return false;
            }
        }

        return true;
    }
}

