import {
  Animations,
  Animation,
  Container,
  Easing,
  ObjectLinks,
  Rewards,
} from "PlayableAdsEngine";
import { FOOD_EVENTS } from "./Food";
import { EVENTS, OBJECTS } from "../../../const";
import Ingredient from "./Ingredient";

export default class Dish extends Container {
  setup() {
    super.setup();

    this.clone = ObjectLinks.get(this.config.clone);

    this.view.on("pointertap", this.onTap.bind(this));

    this.view.eventMode = "dynamic";
    this.updateInteractive("auto");
  }

  updateInteractive(value) {
    if (value == "auto") this.lock();
    else this.unlock();
  }

  updateFakeDish(product) {
    this.clone.updateIcon([product]);
  }

  resetFakeDish() {
    this.clone.changeParent(OBJECTS.table);
    this.clone.position = this.position;
    this.clone.scale = this.scale;

    this.clone.resetChildrenVisibility();
    this.clone.icon["plate"].visible = true;
    this.clone.icon["pita"].visible = true;
    this.clone.icon["pita_closed"].visible = true;
  }

  flyToTooltip() {
    this.clone.changeParent(OBJECTS.fakeDishContainer);

    const allTooltips = [
      ObjectLinks.get(OBJECTS.tooltip1),
      ObjectLinks.get(OBJECTS.tooltip2),
      ObjectLinks.get(OBJECTS.tooltip3),
    ].filter((t) => t && t.visible);

    let tooltipIcon = null;
    if (this._targetTooltip) {
      tooltipIcon = this._targetTooltip.getIncompleteIconByProducts(
        this.clone.icon
      );
    }
    if (!tooltipIcon) {
      for (const t of allTooltips) {
        const icon = t.getIncompleteIconByProducts(this.clone.icon);
        if (icon) {
          tooltipIcon = icon;
          break;
        }
      }
    }

    const allIncompleteIcons = allTooltips.flatMap((t) =>
      t.getIncompleteIcons()
    );

    const destIcon = tooltipIcon || allIncompleteIcons[0];
    if (!destIcon) {
      this.clone.hide();
      this._targetTooltip = null;
      this._targetBuyer = null;
      return Promise.resolve();
    }

    const newPos = this.clone.parent.baseObject.getLocalPositionFor(destIcon);

    this.clone.show();

    return new Promise((resolve) => {
      new Animation(this.clone, {
        from: {
          position: { x: this.clone.position.x, y: this.clone.position.y },
          scale: { x: this.scale.x, y: this.scale.y },
        },
        to: {
          position: { x: newPos.x, y: newPos.y },
          scale: { x: 0.5, y: 0.5 },
        },
        duration: 300,
        autoStart: true,
        onComplete: () => {
          this.clone.hide();
          if (tooltipIcon) {
            tooltipIcon.baseObject.updateCounter(
              --tooltipIcon.baseObject.count
            );
            if (!tooltipIcon.baseObject.count) {
              tooltipIcon.baseObject.scenarios.showCheck.reset().start();
            }
            window.application.sound.play("complete");
          } else {
            window.application.eventEmitter.emit(EVENTS.falseDish);
            allIncompleteIcons.forEach((icon) =>
              icon.baseObject.scenarios.showCross.reset().start()
            );
          }
          this._targetTooltip = null;
          this._targetBuyer = null;
          resolve();
        },
      });
    });
  }

  onTap() {
    if (this.locked)
      !this.scenarios.bounce.isActive && this.scenarios.bounce.reset().start();
    else window.application.eventEmitter.emit(FOOD_EVENTS.dishTap, this);
  }

  getTapTutorialPoint() {
    return this.tutorialTap;
  }

  getDefaultConfig(config) {
    const superConfig = super.getDefaultConfig(config);

    const { scale = { x: 1, y: 1 } } = superConfig;

    return Object.assign(superConfig, {
      name: "dish",
      pivot: { x: 66, y: 60 },
      scenarios: {
        bounce: [
          Rewards.startAnimationInstant("bounce"),
          Rewards.startAnimationInstant("jump"),
          Rewards.wait(300),
        ],
      },
      animations: {
        bounce: {
          from: { scale: { x: scale.x, y: scale.y } },
          to: { scale: { x: 1.1 * scale.x, y: 1.1 * scale.y } },
          duration: 150,
          yoyo: true,
          easing: Easing.Quadratic.InOut,
        },
        jump: {
          creator: Animations.moveToDxDy,
          dy: -15,
          duration: 150,
          yoyo: true,
          easing: Easing.Quadratic.InOut,
        },
      },
      children: [
        {
          name: "tutorialTap",
          position: { x: 66, y: 60 },
        },

        {
          name: "plate",
          image: "dish/plate",
          position: { x: 0, y: 30 },
        },

        {
          name: "pita",
          image: "dish/pita1",
          position: { x: 14, y: 34 },
          visible: false,
          animations: {
            show: {
              creator: Animations.moveFromDxDy,
              dy: -50,
              duration: 150,
              easing: Easing.Quadratic.Out,
            },
          },
        },

        {
          name: "pita_opened",
          image: "dish/pita2",
          position: { x: 32 + 78, y: 0 + 54 },
          pivot: {x: 78, y: 54},
          visible: false,
          animations: {
            show: {
              creator: Animations.moveFromDxDy,
              dy: -50,
              duration: 150,
              easing: Easing.Quadratic.Out,
            },
            close: {
              from: {rotation: 0},
              to: {rotation: -.14},
              time: 75,
              easing: Easing.Sinusoidal.In
            }
          },
        },

        {
          name: "meat",
          class: Ingredient,
          showAnimConfig: {dx: -25},
          children: [
            {
              name: "meat_1",
              image: "dish/meat_1",
              position: { x: 3, y: 49 },
            },
            {
              name: "meat_2",
              image: "dish/meat_2",
              position: { x: 46, y: 57 },
            },
            {
              name: "meat_3",
              image: "dish/meat_3",
              position: { x: 14, y: 61 },
            },
            {
              name: "meat_4",
              image: "dish/meat_4",
              position: { x: 12, y: 34 },
            },
            {
              name: "meat_5",
              image: "dish/meat_5",
              position: { x: 21, y: 47 },
            },
            {
              name: "meat_6",
              image: "dish/meat_6",
              position: { x: 71, y: 53 },
            },
            {
              name: "meat_7",
              image: "dish/meat_7",
              position: { x: 66, y: 49 },
            },
            {
              name: "meat_8",
              image: "dish/meat_8",
              position: { x: 32, y: 55 },
            },
            {
              name: "meat_9",
              image: "dish/meat_9",
              position: { x: 66, y: 64 },
            },
            {
              name: "meat_10",
              image: "dish/meat_10",
              position: { x: 35, y: 44 },
            },
            {
              name: "meat_11",
              image: "dish/meat_11",
              position: { x: 63, y: 48 },
            },
          ],
        },

        {
          name: "cucumbers",
          class: Ingredient,
          children: [
            {
              name: "cucumber_1",
              image: "dish/cucumber_1",
              position: { x: 19, y: 30 },
            },
            {
              name: "cucumber_2",
              image: "dish/cucumber_2",
              position: { x: 15, y: 38 },
            },
            {
              name: "cucumber_3",
              image: "dish/cucumber_3",
              position: { x: 18, y: 53 },
            },
            {
              name: "cucumber_4",
              image: "dish/cucumber_4",
              position: { x: 74, y: 53 },
            },
            {
              name: "cucumber_5",
              image: "dish/cucumber_5",
              position: { x: 31, y: 60 },
            },
            {
              name: "cucumber_6",
              image: "dish/cucumber_6",
              position: { x: 62, y: 55 },
            },
            {
              name: "cucumber_7",
              image: "dish/cucumber_7",
              position: { x: 56, y: 56 },
            },
            {
              name: "cucumber_8",
              image: "dish/cucumber_8",
              position: { x: 47, y: 59 },
            },
            {
              name: "cucumber_9",
              image: "dish/cucumber_9",
              position: { x: 32, y: 42 },
            },
            {
              name: "cucumber_10",
              image: "dish/cucumber_10",
              position: { x: 53, y: 46 },
            },
          ],
        },

        {
          name: "tomato",
          class: Ingredient,
          showAnimConfig: {dy: 0, dx: -25},
          children: [
            {
              name: "tomato_1",
              image: "dish/tomato_1",
              position: { x: 12, y: 30 },
            },
            {
              name: "tomato_2",
              image: "dish/tomato_2",
              position: { x: 22, y: 37 },
            },
            {
              name: "tomato_3",
              image: "dish/tomato_3",
              position: { x: 34, y: 42 },
            },
            {
              name: "tomato_4",
              image: "dish/tomato_4",
              position: { x: 47, y: 44 },
            },
          ],
        },

        {
          name: "fry",
          class: Ingredient,
          showAnimConfig: {dy: -25, dx: 0},
          children: [
            {
              name: "fry_1",
              image: "dish/fry_1",
              position: { x: 63, y: 68 },
            },
            {
              name: "fry_2",
              image: "dish/fry_2",
              position: { x: 79, y: 66 },
            },
            {
              name: "fry_3",
              image: "dish/fry_3",
              position: { x: 75, y: 50 },
            },
            {
              name: "fry_4",
              image: "dish/fry_4",
              position: { x: 67, y: 59 },
            },
            {
              name: "fry_5",
              image: "dish/fry_5",
              position: { x: 55, y: 46 },
            },
            {
              name: "fry_6",
              image: "dish/fry_6",
              position: { x: 60, y: 48 },
            },
            {
              name: "fry_7",
              image: "dish/fry_7",
              position: { x: 6, y: 23 },
            },
            {
              name: "fry_8",
              image: "dish/fry_8",
              position: { x: 40, y: 30 },
            },
            {
              name: "fry_9",
              image: "dish/fry_9",
              position: { x: 38, y: 32 },
            },
            {
              name: "fry_10",
              image: "dish/fry_10",
              position: { x: 19, y: 14 },
            },
          ],
        },
        {
          name: "pita_closed",
          image: "dish/pita3",
          position: { x: 25 + 82, y: 23 + 35 },
          pivot: {x: 82, y: 35},
          visible: false,
          animations: {
            close: {
              from: {rotation: .17},
              to: {rotation: 0},
              time: 75,
              easing: Easing.Sinusoidal.In
            }
          }
        },
      ],
    });
  }
}
