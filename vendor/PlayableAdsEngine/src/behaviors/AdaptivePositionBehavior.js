import Behavior from "./Behavior";
import { Point } from "pixi.js";

/**
 * Бихевиор, реализующий позиционирование объекта при различных ориентациях и размерах экрана
 *
 * @todo Нуждается в рефакторинге, все вычисления нужно убрать в Position
 */
export default class AdaptivePositionBehavior extends Behavior {
  /**
   * Создаёт инстанс для переданного объекта
   *
   * @param obj объект, для которого настраивается бихевиор
   * @param behaviorConfig не используется
   */
  static create(obj, behaviorConfig) {
    if (!obj.adaptivePositionBehavior) {
      obj.adaptivePositionBehavior = super.create(obj, behaviorConfig);
    }
  }

  /**
   * Проверяет возможность применения бихевиора для объекта: наличие в config'е {adaptivePosition: true}
   *
   * @param obj объект, для которого проверяется возможность
   * @returns boolean
   */
  static canBeAppliedFor(obj) {
    return obj.config && obj.config.adaptivePosition;
  }

  /**
   * Применяет объект position к объекту object
   *
   * @param point объект с данными position
   * @param object объект, для которого применяется position
   * @returns {*}
   */
  applyAdaptivePosition(point, object) {
    /*if (!object.view.parent) {
      return this.clone();
    }*/

    this.applyAlign(point, object);
    this.applyOffset(point);

    //this.applyObjectSize(point, object);

    if (object.parent.anchor) {
      this.applyObjectParentSize(point, object.parent);
    }

    return point.clone();
  }

  /**
   * Применяет к position'у сдвиг по x, y
   *
   * @param point
   */
  applyOffset(point) {
    point.x += point.data.x;
    point.y += point.data.y;
  }

  /**
   * Применяет к position'у размеры объекта с учётом anchor его текстуры, но при этом используются origWidth/origHeight,
   * а не размеры текстуры. Что по сути происходит: визуально спрайт должен оставаться в одном положении при изменении anchor.
   *
   * Наследие первой системы позиционирования.
   *
   * @param point
   * @param object
   */
  applyObjectSize(point, object) {
    point.x += object.anchor.x * object.origWidth;
    point.y += object.anchor.y * object.origHeight;
  }

  /**
   * Применяет к position'у размеры родительского объекта с учётом anchor текстуры родительского объекта, но при этом
   * используются origWidth/origHeight, а не размеры текстуры.
   *
   * Что по сути происходит: визуально спрайт должен оставаться в одном положении при изменении anchor родителя.
   *
   * Наследие первой системы позиционирования.
   *
   * @param point
   * @param parent
   */
  applyObjectParentSize(point, parent) {
    point.x -= parent.width * parent.anchor.x;
    point.y -= parent.height * parent.anchor.y;
  }

  /**
   * Возвращает "размеры" родителя. Если data у position'а задано absolute, то вернёт размеры application
   *
   * Нужно для абсолютного позиционирования объекта "относительно экрана".
   *
   * @param point
   * @param object
   * @returns {{width, height}|{width: (*|number), height: (*|number)}}
   */
  getParentSize(point, object) {
    if (point.data.absolute) {
      return {
        width: window.application.renderer.screen.width,
        height: window.application.renderer.screen.height,
      };
    } else {
      return {
        width: object.parent.baseObject.origWidth,
        height: object.parent.baseObject.origHeight,
      };
    }
  }

  /**
   * Применяет к position'у align относительно родителя. Учитывает размеры текстуры объекта, но использует
   * origWidth/origHeight.
   *
   * Что по сути происходит: располагает спрайт так, чтобы при позиционировании align.x = 1, он прижался к правому краю
   * родителя своим правым краем, аналогично для y.
   *
   * Попытка визуализации для position: {x: 0, y: 0, align: {x: 1, y: 0.5}} относительно родителя.
   * Если задать x: -10, расстояние между правыми краями объекта и родителя должно стать 10px.
   *
   * +---------------+
   * |               |
   * |          +----|
   * |          |    |
   * |          +----|
   * |               |
   * +---------------+
   *
   * Наследие первой системы позиционирования.
   *
   * @param point
   * @param object
   */
  applyAlign(point, object) {
    let parentSize = this.getParentSize(point, object);

    let align = point.data.centered ? { x: 0.5, y: 0.5 } : point.data.align;

    let alignedPoint = new Point(
      (parentSize.width - object.origWidth) * align.x,
      (parentSize.height - object.origHeight) * align.y
    );

    if (
      window.application.rendererConfig.onlyPortrait &&
      window.application.renderer.isLandscape &&
      point.data.absolute
    ) {
      alignedPoint = new Point(
        (parentSize.width - object.origHeight) * align.y,
        parentSize.height * (1 - align.x) + object.origWidth * align.x
      );
    }

    if (point.data.absolute) {
      alignedPoint = object.view.parent.toLocal(alignedPoint);
    }

    point.copyFrom(alignedPoint);
  }
}
