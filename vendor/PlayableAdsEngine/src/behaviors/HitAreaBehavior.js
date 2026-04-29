import { Circle, Polygon, Rectangle } from "pixi.js";

/**
 * Класс предоставляет метод-бихевиор, назначающий hitArea для объекта и редактирование этой области
 *
 * Использование:
 *
 * {
 *    behaviors: [HitAreaBehavior.hitAreaBehavior]
 *    hitAreaData: {...} // см. HitAreaBehavior._getDefaultHitAreaData()
 * }
 *
 */
export default class HitAreaBehavior {
  /**
   * Реализует логику бихевиора
   *
   * @param behavior не используется
   */
  static hitAreaBehavior(/* behavior */) {
    let data = Object.assign(
      HitAreaBehavior._getDefaultHitAreaData(),
      this.config.hitAreaData
    );

    // файл ShapeEditArea лежит в PlayableAds\common\devMode\EditPlot
    data.edit &&
    window.dev &&
    window.dev.CLASSES &&
    window.dev.CLASSES.ShapeEditArea
      ? window.dev.CLASSES.ShapeEditArea._goEditMode.call(this, data)
      : (this.view.hitArea = HitAreaBehavior._createShape(data));
  }

  /**
   * Создаёт и возвращает PIXI.Shape для области, заданной в config.hitAreaData объекта
   *
   * @param data см. HitAreaBehavior._getDefaultHitAreaData()
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
        const _vertices = data.vertices.map((value, index) => {
          return value + (index % 2 === 0 ? data.position.x : data.position.y);
        });

        return new Polygon(_vertices);
      }
    }
  }

  /**
   * Возвращает параметры hitArea по умолчанию
   *
   * @returns Object
   * @private
   */
  static _getDefaultHitAreaData() {
    return {
      edit: false,
      alpha: 0.3, // дебажное поле, удалить/вынести в константы
      color: 0xff0000, // цвет заливки, вынести в константы
      type: "polygon", // тип области 'polygon', 'circle'
      position: { x: 0, y: 0 }, // смещение области относительно нулевых координат объекта
      radius: 50, // значение по умолчанию для circle
      vertices: [0, 0, 0, 100, 100, 100, 100, 0], // значение по умолчанию для polygon
    };
  }
}
