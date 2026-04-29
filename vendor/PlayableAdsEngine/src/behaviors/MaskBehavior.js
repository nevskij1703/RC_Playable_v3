import { Circle, Graphics, Polygon, Rectangle } from "pixi.js";

/**
 * Класс предоставляет метод-бихевиор, назначающий mask для объекта и редактирование этой маски
 *
 * Для типа rect используется механизм быстрых масок scissors
 *
 * Использование:
 *
 * {
 *    behaviors: [MaskBehavior.maskBehavior]
 *    maskData: {...} // см. MaskBehavior._getDefaultMaskData()
 * }
 *
 */
export default class MaskBehavior {
  /**
   * Реализует логику бихевиора
   *
   * @param behavior не используется
   */
  static maskBehavior(/* behavior */) {
    let data = Object.assign(
      MaskBehavior._getDefaultMaskData(),
      this.config.maskData
    );

    // файл ShapeEditArea лежит в PlayableAds\common\devMode\EditPlot
    data.edit &&
    window.dev &&
    window.dev.CLASSES &&
    window.dev.CLASSES.ShapeEditArea
      ? window.dev.CLASSES.ShapeEditArea._goEditMode.call(this, data)
      : MaskBehavior._goWorkMode.call(this, data);
  }

  static _goWorkMode(data) {
    let graphics = MaskBehavior._createGraphics(
      MaskBehavior._createShape(data),
      data
    );

    data.type === "rect" && (this.app.renderer.mask.enableScissor = true);

    this.addChild(graphics);
    this.view.mask = graphics;
  }

  /**
   * Создаёт и возвращает PIXI.Shape для области, заданной в config.maskData объекта
   *
   * @param data см. MaskBehavior._getDefaultMaskData()
   * @returns PIXI.Shape
   * @private
   */
  static _createShape(data) {
    switch (data.type) {
      case "circle":
        return new Circle(data.position.x, data.position.y, data.radius);
      case "rect":
        return new Rectangle(
          data.position.x,
          data.position.y,
          data.width,
          data.height
        );
      case "polygon": {
        let _vertices = data.vertices.map((value, index) => {
          return value + (index % 2 === 0 ? data.position.x : data.position.y);
        });

        return new Polygon(_vertices);
      }
    }
  }

  /**
   * Создаёт и возвращает PIXI.Graphics для переданного shape
   *
   * @param shape
   * @param data
   * @returns PIXI.Graphics
   * @private
   */
  static _createGraphics(shape, data) {
    let g = new Graphics();

    g.beginFill(data.color, data.alpha);

    g.drawShape(shape);

    return g;
  }

  /**
   * Возвращает параметры maskData по умолчанию
   *
   * @returns Object
   * @private
   */
  static _getDefaultMaskData() {
    return {
      edit: false, // режим редактирования маски
      alpha: 0.3, // дебажное поле, удалить/вынести в константы
      color: 0xff0000, // цвет заливки, вынести в константы
      type: "polygon", // тип маски 'polygon', 'circle', 'rect'
      position: { x: 0, y: 0 }, // смещение области относительно нулевых координат объекта
      radius: 50, // значение по умолчанию для circle
      width: 100, // значение по умолчанию для rect
      height: 100, // значение по умолчанию для rect
      vertices: [0, 0, 0, 100, 100, 100, 100, 0], // значение по умолчанию для polygon
    };
  }
}
