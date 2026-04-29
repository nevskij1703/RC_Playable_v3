import Rewards from "../behaviors/universalBehavior/Rewards";
import { TUTORIAL_TYPES } from "./Tutorial";
import Container from "./Container";
import ObjectLinks from "../core/ObjectLinks";
import Animations from "../core/Animations";
import Animation from "../core/Animation";
import { Easing } from "tweedle.js";

export const TAP_TUTORIAL_EVENTS = {
  tutorialTap: "tutorialTap",
  tutorialTapStop: "tutorialTapStop",
  tutorialSwipe: "tutorialSwipe",
  tutorialSwipeStop: "tutorialSwipeStop",
};

export default class TutorialFinger extends Container {
  getTarget() {
    return this.target;
  }

  setTarget(target) {
    if (target) {
      this.target = ObjectLinks.get(target);
    } else {
      this.target = null;
    }

    return this.target;
  }

  updateTarget() {
    if (this.target) {
      if (typeof this.target.getTapTutorialPoint === "function") {
        this.setSamePositionAs(this.target.getTapTutorialPoint());
      } else {
        this.setSamePositionAs(this.target);
      }
    } else {
      this.scenarios.stopTutorial.reset().start();
    }
  }

  getDefaultConfig(config) {
    return Object.assign(super.getDefaultConfig(config), {
      scenarios: {
        startTutorial: [
          (args) => this.animations.wait.config({ duration: args.delay }),
          Rewards.startAnimation("wait"),
          Rewards.if(
            () => !this.scenarios.tutorialLoop.isActive,
            Rewards.startScenario([
              Rewards.startScenarioInstant("tutorialLoop"),
              Rewards.show(),
            ])
          ),
        ],
        startTutorialFast: [
          (args) => this.animations.wait.config({ duration: args.delay }),
          Rewards.startAnimation("wait"),
          Rewards.if(
            () => !this.scenarios.tutorialLoopFast.isActive,
            Rewards.startScenario([
              Rewards.startScenarioInstant("tutorialLoopFast"),
              Rewards.show(),
            ])
          ),
        ],
        stopTutorial: [
          Rewards.stopAnimation("wait"),
          Rewards.stopScenario("startTutorial"),
          Rewards.stopScenario("startTutorialFast"),
          Rewards.stopScenario("tutorialLoop"),
          Rewards.stopScenario("tutorialLoopFast"),
          Rewards.onChild("finger", Rewards.hide()),
          () =>
            window.application.eventEmitter.emit(
              TAP_TUTORIAL_EVENTS.tutorialTapStop,
              this.target
            ),
            () =>
            window.application.eventEmitter.emit(
              TAP_TUTORIAL_EVENTS.tutorialSwipeStop,
              this.target
            ),
          Rewards.hide(),
        ],
        tutorialLoopFast: {
          loop: true,
          rewards: [
            Rewards.call("updateTarget"),
            Rewards.onChild(
              "finger",
              Rewards.set({
                rotation: 0,
                scale: { x: 1, y: 1 },
              })
            ),
            Rewards.onChild("finger", Rewards.applyPosition()),

            Rewards.onChild(
              "finger",
              Rewards.if(function () {
                return !this.visible;
              }, Rewards.startScenario([
                Rewards.show(),
                Rewards.startAnimation("moveIn"),
              ]))
            ),

            Rewards.startScenario((args) => {
              switch (args.tutorialType) {
                case TUTORIAL_TYPES.tap:
                  this.finger.animations.tap.config({ duration: 300 });
                  return "tapFast";
                case TUTORIAL_TYPES.swipe:
                  this.finger.animations.swipe = new Animation(this.finger, { 
                    creator: Animations.moveToDxDy,
                    dx: args.dx,
                    dy: args.dy,
                    duration: 600,
                    easing: Easing.Quadratic.InOut 
                  });
                  return "swipeFast";
              }
            })
          ],
        },
        tutorialLoop: {
          loop: true,
          rewards: [
            Rewards.call("updateTarget"),
            Rewards.onChild(
              "finger",
              Rewards.set({
                rotation: 0,
                scale: { x: 1, y: 1 },
                visible: false,
              })
            ),
            Rewards.onChild("finger", Rewards.applyPosition()),
            Rewards.onChild("finger", Rewards.show()),
            Rewards.onChild("finger", Rewards.startAnimation("moveIn")),

            Rewards.startScenario((args) => {
              switch (args.tutorialType) {
                case TUTORIAL_TYPES.tap:
                  this.finger.animations.rotate_left.config({ duration: 150 });
                  this.finger.animations.rotate_right.config({ duration: 150 });
                  this.finger.animations.tap.config({ duration: 300 });
                  return "tap";
                case TUTORIAL_TYPES.doubleTap:
                  this.finger.animations.rotate_left.config({ duration: 250 });
                  this.finger.animations.rotate_right.config({ duration: 250 });
                  this.finger.animations.tap.config({ duration: 500 });
                  return "doubleTap";
                case TUTORIAL_TYPES.swipe:
                  this.finger.animations.swipe = new Animation(this.finger, { 
                    creator: Animations.moveToDxDy,
                    dx: args.dx,
                    dy: args.dy,
                    duration: 600,
                    easing: Easing.Quadratic.InOut 
                  });
                  return "swipe";
              }
            }),

            Rewards.onChild("finger", Rewards.hide()),
            Rewards.onChild("finger", Rewards.startAnimation("moveOut")),
            Rewards.startAnimation("wait1000"),
          ],
        },

        tap: [
          function () {
            window.application.eventEmitter.emit(
              TAP_TUTORIAL_EVENTS.tutorialTap,
              this.target
            );
          },
          Rewards.onChild("finger", Rewards.startScenario("tap")),
        ],
        tapFast: [
          function () {
            window.application.eventEmitter.emit(
              TAP_TUTORIAL_EVENTS.tutorialTap,
              this.target
            );
          },
          Rewards.onChild("finger", Rewards.startAnimation("tap")),
        ],
        doubleTap: {
          repeat: 1,
          rewards: [
            Rewards.onChild("finger", Rewards.startScenarioInstant("tap")),
            Rewards.onChild("finger", Rewards.startAnimation("tap")),
          ],
        },
        swipe: [
          function () {
            window.application.eventEmitter.emit(
              TAP_TUTORIAL_EVENTS.tutorialSwipe,
              this.target
            );
          },
          Rewards.onChild(
            "finger",
            Rewards.startAnimationInstant("rotate_left")
          ),
          Rewards.onChild("finger", Rewards.startAnimation("swipe")),
          Rewards.onChild("finger", Rewards.startAnimation("rotate_right")),
        ],
        swipeFast: [
          function () {
            window.application.eventEmitter.emit(
              TAP_TUTORIAL_EVENTS.tutorialSwipe,
              this.target
            );
          },
          Rewards.onChild(
            "finger",
            Rewards.startAnimationInstant("rotate_left")
          ),
          Rewards.onChild("finger", Rewards.startAnimation("swipe")),
          Rewards.onChild("finger", Rewards.startAnimation("rotate_right")),
        ],
      },
      animations: {
        wait: {},
        wait1000: { duration: 1000 },
      },
      children: [
        {
          name: "finger",
          image: "ui/hand",
          pivot: { x: 47, y: 25 },
          visible: false,
          scenarios: {
            tap: [
              Rewards.startScenarioInstant("rotate"),
              Rewards.startAnimation("tap"),
            ],
            rotate: [
              Rewards.startAnimation("rotate_left"),
              Rewards.startAnimation("rotate_right"),
            ]
          },
          animations: {
            show: Animations.alphaShow,
            moveIn: {
              creator: Animations.moveFromDxDy,
              dx: 50,
              dy: 50,
              duration: 300,
            },
            moveOut: {
              creator: Animations.moveToDxDy,
              fromCurrentPosition: true,
              dx: 50,
              dy: 50,
              duration: 300,
            },
            tap: {
              from: { scale: { x: 1, y: 1 } },
              to: { scale: { x: 0.7, y: 0.7 } },
              duration: 150,
              easing: Easing.Sinusoidal.InOut /*'inOutSine'*/,
              yoyo: true,
            },
            rotate_left: {
              from: { rotation: 0 },
              to: { rotation: -0.1 },
              duration: 150,
              easing: Easing.Sinusoidal.InOut,
            },
            rotate_right: {
              from: { rotation: -0.1 },
              to: { rotation: 0 },
              duration: 150,
              easing: Easing.Sinusoidal.InOut,
            },
            swipe: {
              creator: Animations.moveToDxDy,
              dx: 100,
              dy: -70,
              duration: 600,
              easing: Easing.Quadratic.InOut /*'inOutQuad'*/,
            },
            hide: {
              creator: Animations.alphaHide,
              duration: 200,
            },
          },
        },
      ],
    });
  }
}
