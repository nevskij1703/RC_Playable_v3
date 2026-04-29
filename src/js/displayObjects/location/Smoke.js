import { Particle, ObjectLinks, Rewards, Easing } from "PlayableAdsEngine";

export default class Smoke extends Particle {
  reset() {
    //this.view.setupPIXIAttributes();
    //this.setupPositions();

    const container = ObjectLinks.get(this.config.container);

    this.config.prepend
      ? container.view.addChildAt(this.view, 0)
      : container.view.addChild(this.view);

    const rndScale = 0.5 + Math.random() * 0.5;
    const offset = this.config.offset || { x: 0, y: 0 };
    const x = offset.x + Math.random() * 48;
    const alpha = 0.5 + Math.random() * 0.5;

    // this.alpha = .5 + Math.random()*.5;
    this.scale = { x: rndScale, y: rndScale };

    this.animations.move.config({
      from: {
        alpha: 0.5 * alpha,
        position: {
          y: offset.y + Math.random() * 12,
          x,
        },
      },
      to: {
        alpha,
        position: {
          y: offset.y + 12 - (32 + Math.random() * 20),
          x,
        },
      },
      duration: this.config.flyTime,
      easing: Easing.Exponential.Out,
    });

    this.view.position.x = Math.random() * 20 - 10;
  }

  getDefaultConfig(config) {
    return Object.assign(super.getDefaultConfig(config), {
      image: "location/smoke",
      scale: { x: 0.5, y: 0.5 },
      pivot: { x: 60, y: 40 },
      scenarios: {
        main: [
          Rewards.call("reset"),
          Rewards.show(),
          Rewards.startAnimationInstant({
            from: { alpha: 0 },
            to: { alpha: 1 },
            duration: config.flyTime * 0.1,
          }),
          Rewards.startAnimationInstant("move"),
          Rewards.wait(config.flyTime * 0.5),
          Rewards.startAnimation({
            from: { alpha: 1 },
            to: { alpha: 0 },
            duration: config.flyTime * 0.5,
          }),
        ],
      },
    });
  }
}
