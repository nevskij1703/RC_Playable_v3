import { Easing, Interpolation } from "tweedle.js";
import { Point } from "pixi.js";

export default class Animations {
  static alphaShow(config) {
    return Object.assign(
      {
        from: { alpha: 0 },
        to: { alpha: this.alpha },
        time: 300,
        easing: Easing.Quadratic.Out,
      },
      config,
    );
  }
  static alphaHide(config) {
    return Object.assign(
      {
        from: { alpha: this.alpha },
        to: { alpha: 0 },
        time: 300,
        easing: Easing.Quadratic.Out,
      },
      config,
    );
  }
  static alphaScaleShow(config) {
    return Object.assign(
      {
        from: { alpha: 0, scale: { x: 0, y: 0 } },
        to: { alpha: this.alpha, scale: { x: this.scale.x, y: this.scale.y } },
        time: 200,
        easing: Easing.Quadratic.Out,
      },
      config,
    );
  }
  static alphaScaleHide(config) {
    return Object.assign(
      {
        from: {
          alpha: this.alpha,
          scale: { x: this.scale.x, y: this.scale.y },
        },
        to: { alpha: 0, scale: { x: 0, y: 0 } },
        time: 300,
        easing: Easing.Quadratic.Out,
      },
      config,
    );
  }

  static moveFromDxDy(config) {
    const { dx = 0, dy = 0 } = config;

    return Object.assign(
      {
        onStart: (object, tween) => {
          const startPosition = {};
          const finishPosition = new Point().copyFrom(object.position);

          startPosition.x = finishPosition.x + dx;
          startPosition.y = finishPosition.y + dy;

          tween.from(startPosition).to(finishPosition);

          //startPosition =
          //  /* config.fromCurrentPosition ? */ new Point().copyFrom(
          //    this.position
          //  ) /* : this.origPosition*/;
        },
        /* onUpdate: (object, elapsed) => {
          elapsed = 1 - elapsed;

          if (config.dx) {
            this.position.x = startPosition.x + config.dx * elapsed;
          }

          if (config.dy) {
            this.position.y = startPosition.y + config.dy * elapsed;
          }
        }, */
      },
      config,
    );
  }

  static moveToDxDy(config) {
    const { dx, dy } = config;

    return Object.assign(
      {
        onStart: (object, tween) => {
          const startPosition = new Point().copyFrom(object.position);
          const finishPosition = {};

          dx && (finishPosition.x = startPosition.x + dx);
          dy && (finishPosition.y = startPosition.y + dy);

          tween.from(startPosition).to(finishPosition);
        },
        /* onUpdate: (object, elapsed) => {
          if (config.dx) {
            this.position.x = startPosition.x + config.dx * elapsed;
          }

          if (config.dy) {
            this.position.y = startPosition.y + config.dy * elapsed;
          }
        }, */
      },
      config,
    );
  }

  static moveBezier(config) {
    return Object.assign(
      {
        to: {x: [0, 100, 200], y: [0, -100, 200]},
        time: 750,
        interpolation: Interpolation.Geom.Bezier,
      },
      config
    )
  }

  static moveToPosition(config) {
    return Object.assign(
      {
        onStart: (object, tween) => {
          const startPosition = new Point().copyFrom(object.position);
          const finishPosition =
            object.positions[config.position].calculateFor(object);

          tween.from(startPosition).to(finishPosition);
        },
      },
      config,
    );
  }
}
