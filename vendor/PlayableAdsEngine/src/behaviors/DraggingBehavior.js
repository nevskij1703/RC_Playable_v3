import Behavior from "./Behavior";

/**
 * Класс реализует бихевиор для перетаскивания объекта мышью/пальцем.
 *
 * Проверяет наличие у объекта полей-функций 'onDragStart', 'onDragEnd', 'onDragMove' и назначает их обработчиками
 * для соответствующих событий.
 *
 * @todo внести исправления, добавить
 *
 */
export default class DraggingBehavior extends Behavior {
  /**
   * Создаёт один инстанс для объекта и назначает обработчики interactive-событий.
   * Если инстанс уже есть, то только добавит обработчики.
   *
   * @param obj объект, для которого назначается бихевиор
   * @param behaviorConfig config бихевиора, см. DraggingBehavior.getDefaultConfig()
   */
  static create(obj, behaviorConfig) {
    let config = Object.assign(
      DraggingBehavior.getDefaultConfig(),
      behaviorConfig,
    );

    if (!obj.draggingBehavior) {
      obj.draggingBehavior = super.create(obj, config);
    }

    Object.keys(config.handlers).forEach((type) => {
      obj.draggingBehavior.addHandler(type, config.handlers[type]);
    });
  }

  constructor(target, config) {
    super(target, config);

    const { offsetDependent, defaultMove, active = true } = config;

    this.target.view.eventMode = "static";

    this.active = active;

    this.offsetDependent = offsetDependent;
    this.defaultMove = defaultMove;
    this.event = null;
    this.data = null;
    this.offset = { x: 0, y: 0 };
    this.dragging = false;
    this.handlers = {
      start: [],
      end: [],
      move: [],
    };

    this.setupEvents();
  }

  setupEvents() {
    this.target.view.on("pointerdown", (event) => this.onDragStart(event));
    this.target.view.on("pointerup", (event) => this.onDragEnd(event));
    this.target.view.on("pointerupoutside", (event) => this.onDragEnd(event));
    this.target.view.on("pointermove", (event) => this.onDragMove(event));
    this.target.view.on("pointercancel", (event) =>
      this.onDragEnd(event, true),
    );
  }

  addHandler(type, handler) {
    let handlerCallable =
      typeof handler === "function" ? handler : this.target[handler];

    if (!handlerCallable) {
      return;
    }

    this.handlers[type].push(handlerCallable);
  }

  /**
   * Обработчик для начала перетаскивания
   *
   * @param event
   */
  onDragStart(event) {
    if (this.dragging || !this.active) {
      return;
    }

    event.stopPropagation();

    this.event = event;
    this.data = event.data;

    let { x, y } = this.data.getLocalPosition(this.target.view);

    let a = this.target.rotation;

    this.offset = {
      x:
        (x - this.target.pivot.x) * Math.cos(a) -
        (y - this.target.pivot.y) * Math.sin(a),
      y:
        (y - this.target.pivot.y) * Math.cos(a) +
        (x - this.target.pivot.x) * Math.sin(a),
    };

    this.offset.x *= this.target.scale.x;
    this.offset.y *= this.target.scale.y;

    this.dragging = true;

    this.handlers.start.forEach((handler) => handler.call(this.target, event));
  }

  /**
   * Обработчик для окончания перетаскивания
   *
   * @param event
   * @param cancelled было ли перетаскивание отменено автоматически (указатель вышел за пределы объекта, свернул окно)
   */
  onDragEnd(event, cancelled) {
    if (!this.dragging) {
      return;
    }

    this.dragging = false;

    this.handlers.end.forEach((handler) =>
      handler.call(this.target, event, cancelled),
    );
  }

  /**
   * Обработчик процесса перетаскивания. В PIXI событие перемещения указателя получают все интерактивные объекты,
   * поэтому нужно проверять, что было нажатие на объект
   *
   * @param event
   */
  onDragMove(event) {
    if (!this.dragging) {
      return;
    }

    if (this.defaultMove) {
      let pos = this.data.getLocalPosition(this.target.view.parent);

      this.target.position = this.offsetDependent
        ? { x: pos.x - this.offset.x, y: pos.y - this.offset.y }
        : pos;
    }

    this.handlers.move.forEach((handler) => handler.call(this.target, event));
  }

  /**
   * Легальный способ директивно прекратить перетаскивание объекта (не дожидаясь, пока его отпустит пользователь)
   *
   */
  stopDragging() {
    this.onDragEnd(this.event, false);
  }

  /**
   * Параметры бихевиора по умолчанию
   *
   * @returns Object
   */
  static getDefaultConfig() {
    return {
      offsetDependent: false, // если false, объект будет позиционироваться в точку указателя, если true — в точку указателя + точку, в которую было нажатие (x = pointer.x + tapPosition.x)
      defaultMove: true, // true — перемещение объекта за указателем, false — объект не будет автоматически перемещаться за указателем
      handlers: {
        // обработчики по умолчанию
        start: "onDragStart",
        end: "onDragEnd",
        move: "onDragMove",
      },
    };
  }
}
