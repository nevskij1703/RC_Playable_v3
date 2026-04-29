import {
  Easing,
  Particle,
  ParticleEmitter,
  Rewards,
  Animation,
} from "PlayableAdsEngine";

export default class Coin extends Particle {
  setup() {
    super.setup();

    const pivotX = 92 - Math.random() * 184;
    const pivotY = 42 - Math.random() * 84;

    this.animations.show = new Animation(this, {
      to: {
        pivot: { x: Math.sign(pivotX)*Math.max(48, Math.abs(pivotX)), y: Math.sign(pivotY)*Math.max(20, Math.abs(pivotY)) },
      },
      // to: {pivot: {x: 0, y: 0}},
      duration: 250,
      easing: Easing.Sinusoidal.InOut,
    });

    this.animations.defaultPivot = new Animation(this, {
      to: { pivot: { x: 0, y: 0 } },
      duration: this.config.flyTime || 150,
      easing: Easing.Sinusoidal.InOut,
    });
  }

  getDefaultConfig(config) {
    const superConfig = super.getDefaultConfig(config);

    return Object.assign(superConfig, {
      scenarios: {
        main: [
          Rewards.call("reset"),
          Rewards.show(),
          Rewards.wait(250),
          Rewards.startAnimationInstant("defaultPivot"),
          Rewards.startAnimation("move"),
          () => this.hide(),
          () => ParticleEmitter.free(this),
        ],
      },
    });
  }
}
