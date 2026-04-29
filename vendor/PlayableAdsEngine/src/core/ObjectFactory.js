import Behavior from "../behaviors/Behavior";

/**
 * Отвечает за создание объектов
 */
export default class ObjectFactory {
  /**
   * @param {Object} config конфиг
   * @param {Object} config.objectDefault конфиг по умолчанию для объектов
   * @param {function} config.objectDefault.class класс объекта
   * @param {Array} config.objectDefault.behaviors конфиг по умолчанию для объектов
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Создаёт объект по переданному конфигу
   *
   * @param {Object} config конфиг
   * @returns {Object} созданный объект
   */
  create(config) {
    let classConstructor = config.class;

    if (!classConstructor || !this.isClassConstructorValid(classConstructor)) {
      if (classConstructor && !this.isClassConstructorValid(classConstructor)) {
        console.log("Class constructor is not valid for: " + config.name);
      }

      classConstructor = this.config.objectDefault.class;
    }

    const obj = new classConstructor(config);

    !obj.config && (obj.config = config);

    this.setupEvents(obj);

    this.applyBehaviors(obj);

    return obj;
  }

  isClassConstructorValid(classConstructor) {
    return typeof classConstructor === "function";
  }

  applyBehaviors(obj) {
    this.config.objectDefault.behaviors.forEach((behavior) =>
      Behavior.applyFor(obj, behavior)
    );
  }

  setupEvents(obj) {
    let handlers = Object.assign(
      {},
      obj.getEventHandlers ? obj.getEventHandlers() : {}
    );

    let createdHandlers = {};

    for (let eventName in handlers) {
      let currentEventHandlers = this.createEventHandlers(
        obj,
        handlers[eventName]
      );

      currentEventHandlers.forEach((handler) => {
        this.setupEventHandler(eventName, handler);
      });

      createdHandlers[eventName] = currentEventHandlers;
    }

    obj.spriteEventHandlers = createdHandlers;
  }

  createEventHandlers(obj, handler) {
    if (typeof handler !== "object") {
      return [
        {
          handler: handler.bind(obj),
          method: "on",
          target: this.createHandlerTarget(),
        },
      ];
    }

    if (handler.handler) {
      return [handler.bind(obj)];
    }

    let handlers = [];

    if (handler.on) {
      handlers.push({
        handler: handler.on.bind(obj),
        method: "on",
        target: this.createHandlerTarget(handler),
      });
    }

    if (handler.once) {
      handlers.push({
        handler: handler.once.bind(obj),
        method: "once",
        target: this.createHandlerTarget(handler),
      });
    }

    return handlers;
  }

  setupEventHandler(eventName, { handler, method, target }) {
    target[method](eventName, handler);
  }

  createHandlerTarget(handler = {}) {
    return !handler.target ? window.application.eventEmitter : handler.target;
  }

  removeEventHandler(eventName, { handler, target }, context = null) {
    target.off(eventName, handler, context);
  }
}
