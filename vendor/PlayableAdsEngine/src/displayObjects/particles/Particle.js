import { Interpolation } from "tweedle.js";
import Sprite from "../../components/Sprite";
import ObjectLinks from "../../core/ObjectLinks";
import Rewards from "../../behaviors/universalBehavior/Rewards";
import ParticleEmitter from "../../core/ParticleEmitter";

export const PARTICLE_POINTS_FIELDS = ["source", "p1", "p2", "destination"];

/**
 * Один из вариантов класса частицы для ParticleEmitter
 */
export class Particle extends Sprite {
  reset() {
    //this.view.setupPIXIAttributes();
    //this.setupPositions();

    const container = ObjectLinks.get(this.config.container);

    this.config.prepend
      ? container.view.addChildAt(this.view, 0)
      : container.view.addChild(this.view);

    this.animations.move
      .config({
        to: this.makePath(),
        time: this.config.flyTime,
        interpolation: Interpolation.Geom.Bezier,
      })
      .reset();
  }

  makePath() {
    const points = {
      x: [],
      y: [],
    };
    const { offsets = {} } = this.config;

    PARTICLE_POINTS_FIELDS.forEach((field) => {
      if (this.config[field]) {
        const position = this.parent.baseObject.getLocalPositionFor(
          ObjectLinks.get(this.config[field]),
        );

        const offset = offsets[field];
        if (offset) {
          const { x, y } = offset;

          x && (position.x += typeof x === "function" ? x() : x);
          y && (position.y += typeof y === "function" ? y() : y);
        }

        points.x.push(position.x);
        points.y.push(position.y);
      }
    });

    this.position = { x: points.x[0], y: points.y[0] };

    return points;

    /* this.path.clear().moveTo(points[0].x, points[0].y);

    switch (points.length) {
      case 2:
        this.path.lineTo(points[1].x, points[1].y);
        break;
      case 3:
        this.path.quadraticCurveTo(
          points[1].x,
          points[1].y,
          points[2].x,
          points[2].y
        );
        break;
      case 4:
        this.path.bezierCurveTo(
          points[1].x,
          points[1].y,
          points[2].x,
          points[2].y,
          points[3].x,
          points[3].y
        );
        break;
    } */
  }

  /**
   * Частица вылетает из объекта-источника и летит в объект-назначение. <br>
   * Контрольные точки p1, p2 не обязательны. <br> В зависимости от их количества траектория будет строиться с помощью:
   * * 0 - lineTo()
   * * 1 - quadraticCurveTo()
   * * 2 - bezierCurveTo()
   *
   * @example
   * {
   *   class: Particle,
   *
   *   image: 'soundOn',
   *
   *   container: OBJECTS.container, // ссылка на контейнер, в который будет добавлена частица, относительно него будут вычисляться все точки
   *
   *   prepend: true, // частица будет добавляться в родителя ниже всех
   *
   *   source: OBJECTS.source, // ссылка на объект-источник
   *   p1: OBJECTS.p1, // ссылка на объект-контрольную точку 1
   *   p2: OBJECTS.p2, // ссылка на объект-контрольную точку 2
   *   destination: OBJECTS.destination, // ссылка на объект-точку назначения
   *
   *   // параметры для ObjectPool
   *   poolStartSize: 100,
   *   poolAdditionalSize: 10
   * }
   *
   */
  getDefaultConfig(config) {
    let { flyTime = 1000, prepend = false } = config;

    config.animations = Object.assign(
      {
        move: {
          time: flyTime,
        },
      },
      config.animations,
    );

    const superConfig = super.getDefaultConfig(config);

    return Object.assign(superConfig, {
      visible: false,
      anchor: { x: 0.5, y: 0.5 },

      prepend,

      scenarios: {
        main: [
          Rewards.call("reset"),
          Rewards.show(),
          Rewards.startAnimation("move"),
          () => this.hide(),
          () => ParticleEmitter.free(this),
        ],
      },
    });
  }
}
