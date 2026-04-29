import { Container, Easing, PixiGraphics, Rewards } from "PlayableAdsEngine";

const START_ANGLE = -Math.PI / 2;

const FILLING_TIME = 10000;

export default class Timer extends Container {
  setupLogic() {
    super.setupLogic();

    this.progress.view.mask = this.progress.view.addChild(new PixiGraphics());

    this.reset();

    this.animations.filling.tween.onUpdate((object, elapsed) => {
      this.updateMask(elapsed);
    });
  }

  start(duration) {
    const animationFilling = this.animations.filling;
    animationFilling.tween.duration(duration);

    return Rewards.startAnimation("filling");
  }

  reset() {
    this.updateMask(0);
  }

  updateMask(progress) {
    this.progress.view.mask
      .clear()
      .beginFill(0xff0000)
      .lineTo(0, -12.5)
      .arc(0, 0, 25, START_ANGLE, START_ANGLE + progress * 2 * Math.PI);
  }

  isActive() {
    return this.animations.filling.isActive;
  }

  getDefaultConfig(config) {
    const { fillingTime = FILLING_TIME } = config;
    return Object.assign(super.getDefaultConfig(config), {
      animations: {
        filling: {
          time: fillingTime,
        },
        show: {
          from: { scale: { x: 0, y: 0 } },
          to: { scale: { x: 1, y: 1 } },
          time: 300,
          easing: Easing.Quadratic.Out,
        },
        hide: {
          from: { scale: { x: 1, y: 1 } },
          to: { scale: { x: 0, y: 0 } },
          time: 200,
          easing: Easing.Quadratic.In,
        },
      },
      children: [
        {
          image: "ui/timer",
          anchor: { x: 0.5, y: 0.5 },
        },
        {
          name: "progress",
          image: "ui/timer_progress",
          anchor: { x: 0.5, y: 0.5 },
        },
      ],
    });
  }
}
