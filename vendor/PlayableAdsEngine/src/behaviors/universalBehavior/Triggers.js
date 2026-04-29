import { APPLICATION_EVENTS } from "../../Application";
import Condition from "../../core/Condition";

/**
 * Объект конфигурации триггера (Trigger)
 *
 * @typedef {Object} TriggerConfig
 * @property {Function} t функция, подписывающаяся на событие, или отслеживающая что-либо другим способом,
 * выполняется в контексте объекта, для которого описывается TRC
 */

/**
 * Объект конфигурации назначения базового обработчика
 *
 * @typedef {Object} EventHandlerConfig
 * @property {string} event идентификатор события в шине событий
 * @property {Object} target объект-контекст
 * @property {string} method метод для назначения обработчика 'on' или 'once'
 * @property {TriggerCondition} data данные для автоматической проверки срабатывания триггера
 */

/**
 * Условие для автоматической проверки срабатывания триггера. Подробнее см. в описании Triggers._eventHandler
 *
 * Объект, функция или значение, интерпретируемое как false
 *
 * @typedef {Object|Function|undefined} TriggerCondition
 */

/**
 * Класс-библиотека различных триггеров (Trigger)
 *
 * Подробнее о системе TRC: https://knowledge.playrix.com/pages/viewpage.action?pageId=142775503
 * Подробнее о шине событий: https://knowledge.playrix.com/pages/viewpage.action?pageId=142775501
 *
 * @todo нуждается в рефакторенге имён методов и переменных в них
 * @todo стоит пересмотреть параметры
 * @todo вынести из класса eventHandler'ы
 * @todo +см. todo к Triggers._eventHandler()
 */
export default class Triggers {
  /**
   * Срабатывает, когда в шине сообщений возникает событие с идентификатором event
   *
   * @param {string} event идентификатор события в шине событий
   * @param {TriggerCondition} data данные для автоматической проверки при срабатывании триггера
   * @returns {TriggerConfig}
   */
  static onEvent(event, data) {
    return { t: Triggers._eventHandler, event: event, data: data };
  }

  /**
   * Срабатывает однократно, когда в шине сообщений возникает event
   *
   * @param {string} event идентификатор события в шине событий
   * @param {TriggerCondition} data данные для автоматической проверки при срабатывании триггера
   * @returns {TriggerConfig}
   */
  static onceEvent(event, data) {
    return {
      t: Triggers._eventHandler,
      event: event,
      data: data,
      method: "once",
    };
  }

  /**
   * Срабатывает, когда в шине сообщений возникает APPLICATION_EVENTS.playableStart
   *
   * @returns {TriggerConfig}
   */
  static onStart() {
    return Triggers.onEvent(APPLICATION_EVENTS.playableStart);
  }

  /**
   * Срабатывает, когда в шине сообщений возникает APPLICATION_EVENTS.playableRestart
   *
   * @deprecated следует удалить: не используется
   *
   * @returns {TriggerConfig}
   */
  static onRestart() {
    return Triggers.onEvent(APPLICATION_EVENTS.playableRestart);
  }

  /**
   * Срабатывает, когда в шине сообщений возникает skipAd
   *
   * @deprecated следует удалить: добавить в APPLICATION_EVENTS ивент playableSkip
   *
   * @returns {TriggerConfig}
   */
  static onSkip() {
    return Triggers.onEvent("skipAd");
  }

  /**
   * Срабатывает однократно, когда в шине сообщений возникает skipAd
   *
   * @deprecated следует удалить: добавить в APPLICATION_EVENTS ивент playableSkip
   *
   * @returns {TriggerConfig}
   */
  static onceSkip() {
    return Triggers.onceEvent("skipAd");
  }

  /**
   * Срабатывает, когда звуки загружены и готовы к воспроизведению
   *
   * @returns {TriggerConfig}
   */
  static onceSoundReady() {
    return Triggers.onceEvent("soundReady");
  }

  /**
   * @deprecated стоит удалить: избавление от флагов как от механизма глобальных переменных
   *
   * @param flags
   * @returns {TriggerConfig}
   */
  static onFlagsChanged(flags) {
    return {
      t: Triggers._eventHandler,
      event: "playableFlagsChanged",
      data: flags,
    };
  }

  /**
   * Интерактивный триггер. Срабатывает при тапе на объект (pointertap)
   *
   * @todo сделать более универсальный базовый и для всех интерактивных триггеров использовать его (по аналогии с Triggers.onEvent(event))
   *
   * @returns {TriggerConfig}
   */
  static onTap() {
    return { t: Triggers._interactiveSelfEventHandler, event: "pointertap" };
  }

  /**
   * Интерактивный триггер. Срабатывает при "нажатии" на объект (pointerdown)
   *
   * @returns {TriggerConfig}
   */
  static onPointerdown() {
    return { t: Triggers._interactiveSelfEventHandler, event: "pointerdown" };
  }

  /**
   * Интерактивный триггер. Срабатывает при "отпускании" объекта (pointerdown)
   *
   * @returns {TriggerConfig}
   */
  static onPointerup() {
    return { t: Triggers._interactiveSelfEventHandler, event: "pointerup" };
  }

  /**
   *
   * @deprecated стоит удалить как неактуальное: сценарии избавляют от необходимости подписываться на события анимаций
   *
   * @param animation
   * @param event
   * @returns {TriggerConfig}
   */
  static onAnimationEvent(animation, event) {
    return { t: Triggers._animationEventHandler, event, animation };
  }

  /**
   * @deprecated
   *
   * @param animation
   * @returns {TriggerConfig}
   */
  static onAnimationStart(animation) {
    return this.onAnimationEvent(animation, "start");
  }

  /**
   * @deprecated
   *
   * @param animation
   * @returns {TriggerConfig}
   */
  static onAnimationEnd(animation) {
    return this.onAnimationEvent(animation, "end");
  }

  /**
   * @deprecated стоит удалить как неактуальное: сценарии избавляют от необходимости подписываться на события сценариев
   *
   * @param scenario
   * @returns {TriggerConfig}
   */
  static onScenarioStart(scenario) {
    return {
      t: Triggers._scenarioEventHandler,
      event: "start",
      scenario: scenario,
    };
  }

  /**
   * @deprecated стоит удалить как неактуальное: сценарии избавляют от необходимости подписываться на события сценариев
   *
   * @param scenario
   * @returns {TriggerConfig}
   */
  static onScenarioEnd(scenario) {
    return {
      t: Triggers._scenarioEventHandler,
      event: "end",
      scenario: scenario,
    };
  }

  /**
   * Обработчик. Подписывается на собственные события объекта-контекста и включает interactive
   *
   * @todo сразу передавать {target: this} в _eventHandler вместо вызова _selfEventHandler
   * @todo стоит удалить и вынести установку interactive на уровень выше (см. todo к Triggers.onTap())
   *
   * @param config см. описание config в Triggers._eventHandler
   * @param callback см. описание callback в Triggers._eventHandler
   * @private
   */
  static _interactiveSelfEventHandler(config, callback) {
    this.view.eventMode = "static";

    Triggers._selfEventHandler.call(this, Object.assign({}, config), callback);
  }

  /**
   * Обработчик. Подписывается на собственные события объекта-контекста
   *
   * @deprecated удалить: достаточно сразу передавать {target: this} в единственном использовании (см. todo к Triggers.onTap())
   *
   * @param config {EventHandlerConfig}
   * @param callback см. описание callback в Triggers._eventHandler
   * @private
   */
  static _selfEventHandler(config, callback) {
    Triggers._eventHandler.call(
      this,
      Object.assign({}, config, { target: this }),
      callback
    );
  }

  /**
   * Обработчик. Подписывается на события анимаций объекта-контекста
   *
   * @deprecated удалить, неактуально: сценарии избавляют от необходимости подписываться на события анимаций
   *
   * @param config {EventHandlerConfig}
   * @param callback см. описание callback в Triggers._eventHandler
   * @private
   */
  static _animationEventHandler(config, callback) {
    Triggers._eventHandler.call(
      this,
      Object.assign({}, config, { target: this.animations[config.animation] }),
      callback
    );
  }

  /**
   * Обработчик. Подписывается на события сценариев объекта-контекста
   *
   * @deprecated удалить, неактуально: сценарии избавляют от необходимости подписываться на события сценариев
   *
   * @param config {EventHandlerConfig}
   * @param callback {function} см. описание callback в Triggers._eventHandler
   * @private
   */
  static _scenarioEventHandler(config, callback) {
    Triggers._eventHandler.call(
      this,
      Object.assign({}, config, { target: this.scenarios[config.scenario] }),
      callback
    );
  }

  /**
   * Базовый обработчик. Подписывается на событие config.event, назначая обработчиком callback
   * Вызывается с контекстом объекта, для которого описывается TRC
   *
   * При срабатывании триггера до вызова обработчика происходит автопроверка по полю config.data
   * Если config.data функция, то ожидается интерпретируемое как true значение при её вызове
   * Если config.data объект, то ожидается соответствие по значению переданных полей и полей объекта-контекста
   * Если config.data не определено или интерпретируется как false, то ожидается соответствие по значению переданных полей и полей объекта-контекста
   *
   * @todo отрефакторить (деструктуризация config)
   * @todo дать переменным и методу имена, соответствующие смыслу
   * @todo передавать в функцию-проверку все аргументы
   * @todo вынести метод назначения по умолчанию (on) в константу
   * @todo заменить значение target по умолчанию на 'this'
   * @todo для оптимизации следует назначать два разных обработчика: с проверкой config.data и без (проверка случается крайне редко, а два if выполняются для каждого триггера)
   * @todo вызывать функцию data.config для автоматической проверки с контекстом config.target
   * @todo передавать callback (handler) в config
   *
   * @param config {EventHandlerConfig}
   * @param callback {Function} обработчик события
   * @private
   */
  static _eventHandler(config, callback) {
    let target = config.target
      ? config.target.view
      : window.application.eventEmitter;
    let method = config.method ? config.method : "on";

    target[method](config.event, (...args) => {
      if (
        typeof config.data === "function" &&
        !config.data.call(this, args[0])
      ) {
        return;
      } else if (!Condition.areValuesMatch(args[0], config.data)) {
        return;
      }

      callback(...args);
    });
  }
}
