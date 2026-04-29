import {Point} from "pixi.js";

/**
 * Класс, реализующий работу с position'ами объекта сцены.
 *
 * @todo Нуждается в рефакторинге, по большому счёту не нужен, как класс для которого можно создать инстанс,
 *      достаточно только методов с вычислениями сейчас вся логика вычислений вынесена в AdaptivePositionBehavior,
 *      это логически неверно, нужно вернуть сюда, а AdaptivePositionBehavior должен использовать этот класс
 *      для своих вычислений
 */
export default class Position extends Point {
    /**
     * Создаёт объект position
     *
     * @param data см. Position.getDefaultData()
     */
    constructor(data) {
        super();

        this.data = Object.assign(Position.getDefaultData(), data);
    }

    /**
     * Вычисляет position относительно родителя объекта для заданного data
     *
     * @param object объект, для которого вычисляется position
     * @returns PIXI.Point
     */
    calculateFor(object) {
        this.set()

        // все вычисления были перенесены в AdaptivePositionBehavior, это не правильно
        if (object.adaptivePositionBehavior) {
            return object.adaptivePositionBehavior.applyAdaptivePosition(this, object)
        }

        this.applyOffset();
        return this.clone();
    }

    /**
     * Применяет x и y для обычного position
     */
    applyOffset() {
        this.x += this.data.x;
        this.y += this.data.y;
    }

    /**
     * Создаёт объекты Position на основе config'а объекта сцены
     *
     * Ищет в config'е поля, начинающиеся с 'position' и создаёт объекты Position для них
     *
     * @param config конфиг объекта сцены
     * @returns {{}} объект, ключ — название position'а, значение — инстанс Position
     */
    static createPositionsFromConfig(config) {
        let positions = {};

        for (let key in config) {
            if (key.substring(0, 8) !== 'position') {
                continue;
            }

            positions[Position.getPositionNameFromKey(key)] = typeof config[key] === 'string' ? positions[Position.getPositionNameFromKey(config[key])] : new Position(config[key]);
        }

        if (!positions[Position.DEFAULT_NAME]) {
            positions[Position.DEFAULT_NAME] = new Position();
        }

        if (!positions[Position.PORTRAIT_NAME]) {
            positions[Position.PORTRAIT_NAME] = positions[Position.DEFAULT_NAME];
        }

        return positions;
    }

    static getPositionNameFromKey(key) {
        let name = key.substring(9);

        return name.length ? name : Position.DEFAULT_NAME;
    }

    /**
     * Значения для position по умолчанию
     *
     * @returns {{centered: boolean, absolute: boolean, x: number, y: number, roundPosition: boolean, align: {x: number, y: number}}}
     */
    static getDefaultData() {
        return {
            absolute: false, // для вычислений в качестве родительского объекта будет использоваться application @todo стоит переделать на stage
            align: { x: 0, y: 0 }, // нормализованное смещение относительно родителя, будет дополнительная логика, если у объекта задана texture (а точнее origWidth/origHeight)
            centered: false, // алиас для align: {x: 0.5, y: 0.5}
            x: 0, // x относительно родителя
            y: 0  // y относительно родителя
        };
    }

    /**
     * название position'a по умолчанию
     *
     * @todo переделать на обычный метод
     *
     * @returns {string}
     */
    static get DEFAULT_NAME() {
        return 'default';
    }

    /**
     * название position'a по умолчанию для portrait ориентации
     *
     * @todo переделать на обычный метод
     *
     * @returns {string}
     */
    static get PORTRAIT_NAME() {
        return 'portrait';
    }
}
