import Rewards from "../behaviors/universalBehavior/Rewards";
import { TAP_TUTORIAL_EVENTS } from "./TutorialFinger";
import Scenario from "../core/Scenario";
import { Easing } from "tweedle.js";
import Animations from "../core/Animations";

const TUTORIAL_RESET_TIME = 3000;

export const TUTORIAL_TYPES = {
  tap: "tap",
  swipe: "swipe",
  doubleTap: "doubleTap",
};

export default class Tutorial {
  #active = false;
  constructor(tutorialFinger) {
    this.target = null;
    this.currentTutorialMethod = null;
    this.tutorialFinger = tutorialFinger;

    window.application.eventEmitter.on(
      TAP_TUTORIAL_EVENTS.tutorialTap,
      (target) => {
        if (this.target.name === target.name) {
          this.target.scenarios.tutorialTap &&
            this.target.scenarios.tutorialTap.reset().start();
        }
      }
    );
    window.application.eventEmitter.on(
      TAP_TUTORIAL_EVENTS.tutorialTapStop,
      (target) => {
        if (this.target.name === target.name) {
          //this.target.scenarios.tutorialTap && this.target.scenarios.tutorialTap.stop();
          //target.scale = target.config.scale;
        }
      }
    );
  }

  startTutorialTap(args) {
    this.currentTutorialMethod = this.startTutorialTap;
    args.tutorialType = TUTORIAL_TYPES.tap;

    this.#active = true;

    this.setTarget(args.target);

    if (!this.target.scenarios.tutorialTap) {
      this.target.scenarios.tutorialTap = new Scenario(this.target, [
        Rewards.startAnimation({
          from: { scale: { x: this.target.scale.x, y: this.target.scale.y } },
          to: {
            scale: {
              x: this.target.scale.x - 0.2,
              y: this.target.scale.y - 0.2,
            },
          },
          duration: 350,
          yoyo: true,
          easing: Easing.Quadratic.Out /*'outQuad'*/,
        }),
      ]);
    }

    this.tutorialFinger.setTarget(args.target) &&
      (args.active ? this.tutorialFinger.scenarios.startTutorialFast.stop().reset().start(args) : this.tutorialFinger.scenarios.startTutorial.stop().reset().start(args));
  }

  startTutorialSwipe(args) {
    this.currentTutorialMethod = this.startTutorialSwipe;
    args.tutorialType = TUTORIAL_TYPES.swipe;

    let {dx = 0, dy = 0} = args;

    dx *= this.tutorialFinger.scale.x;
    dy *= this.tutorialFinger.scale.y;

    this.#active = true;

    this.setTarget(args.target);

    if (args.moveTarget && !this.target.scenarios.tutorialSwipe) {
      this.target.scenarios.tutorialSwipe = new Scenario(this.target, [
        Rewards.show(),
        Rewards.startAnimation({
          creator: Animations.moveToDxDy,
              dx,
              dy,
              duration: 600,
              easing: Easing.Quadratic.InOut
        }),
        Rewards.hide(),
        Rewards.wait(250),
        () => {
          this.target.position.x = this.target.position.x - dx;
          this.target.position.y = this.target.position.y - dy;
        }
      ]);
    }

    this.tutorialFinger.setTarget(args.target) &&
      this.tutorialFinger.scenarios.startTutorial.stop().reset().start(args);
  }

  setTarget(target) {
    this.target = target;
  }

  getTarget() {
    return this.target;
  }

  resetTutorial() {
    this.stopTutorial();
    this.currentTutorialMethod({
      target: this.target,
      delay: TUTORIAL_RESET_TIME,
    });
  }

  stopTutorial() {
    this.#active = false;

    this.tutorialFinger.scenarios.stopTutorial.reset().start();
  }

  get isActive() {
    return this.#active;
  }

  get isTutorialFingerActive() {
    return this.tutorialFinger.scenarios.tutorialLoop.isActive;
  }

  isActiveOnTarget(target) {
    return this.getTarget() === target && this.isActive;
  }
}
