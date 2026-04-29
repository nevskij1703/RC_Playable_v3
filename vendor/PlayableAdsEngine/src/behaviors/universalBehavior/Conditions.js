import Condition from "../../Base/Condition";

/**
 * Объект конфигурации условия (Condition)
 *
 * @typedef {Object} ConditionConfig
 * @property {Function} c функция, возвращающая значение, интерпретируемое как true|false в зависимости
 * от успеха проверки условия. Выполняется в контексте объекта, для которого описывается TRC
 */



/**
 * Класс-библиотека различных условий (Condition)
 *
 * Подробнее о TRC: https://knowledge.playrix.com/pages/viewpage.action?pageId=142775503
 */
export default class Conditions {
    /**
     * Проверяет видимость объекта-контекста
     *
     * @returns {ConditionConfig}
     */
    static visible() {
        return Conditions.values({visible: true});
    }

    /**
     * Проверяет невидимость объекта-контекста
     *
     * @returns {ConditionConfig}
     */
    static invisible() {
        return Conditions.values({visible: false});
    }

    /**
     * Проверяет "разблокированность" объекта-контекста
     *
     * @returns {ConditionConfig}
     */
    static unlocked() {
        return Conditions.values({locked: false});
    }

    /**
     * Проверяет совпадение значение полей объекта-контекста и значений values
     *
     * @param {Object} values пары ключ-значение
     * @returns {ConditionConfig}
     */
    static values(values) {
        return {c: Conditions._values, values: values}
    }

    /**
     * Проверяет, что переданное условие не выполняется
     *
     * @param {ConditionConfig|function} condition
     * @returns {ConditionConfig}
     */
    static not(condition) {
        return {c: Conditions._not, condition: condition}
    }

    /**
     * Функция-условие. Проверяет совпадение полей объекта-контекста и переданных в config.values
     * Реализует проверку соответствия полей
     *
     * @todo вынести из Conditions
     *
     * @param config объект-condition
     * @returns {boolean}
     * @private
     */
    static _values(config) {
        return Condition.areValuesMatch(this, config.values)
    }

    /**
     * Функция-условие. Проверяет соответствие флагов
     *
     * @deprecated удалить вместе с Conditions.flags
     *
     * @param config
     * @returns {boolean}
     * @private
     */
    static _playableFlagsValues(config) {
        return Condition.areValuesMatch(this.app.playableFlags, config.values)
    }

    /**
     * Функция-условие. Реализует проверку, что переданное в config.condition условие не выполняется
     *
     * @todo вынести из Conditions
     *
     * @param config объект-condition
     * @returns {boolean}
     * @private
     */
    static _not(config) {
        return !Condition.areSatisfied(this, config.condition);
    }
}