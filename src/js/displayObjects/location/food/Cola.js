import { Animation, Animations, ObjectLinks } from "PlayableAdsEngine";
import Food from "./Food";
import { EVENTS, OBJECTS } from "../../../const";

export default class Cola extends Food {
  get activeElements() {
    return [
    ];
  }

  flyToTooltip() {
    this.changeParent(OBJECTS.fakeDishContainer);

    const allTooltips = [
      ObjectLinks.get(OBJECTS.tooltip1),
      ObjectLinks.get(OBJECTS.tooltip2),
      ObjectLinks.get(OBJECTS.tooltip3),
    ].filter((t) => t && t.visible);

    let tooltipIcon = null;
    if (this._targetTooltip) {
      tooltipIcon = this._targetTooltip.getIncompleteIconByProducts(this.view);
    }
    if (!tooltipIcon) {
      for (const t of allTooltips) {
        const icon = t.getIncompleteIconByProducts(this.view);
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
      this.hide();
      this.changeParent(OBJECTS.cola);
      this.position = this.config.position;
      this.scale = this.config.scale || { x: 1, y: 1 };
      return Promise.resolve();
    }

    const newPos = this.parent.baseObject.getLocalPositionFor(destIcon);

    return new Promise((resolve) => {
      new Animation(this, {
        from: {
          position: { x: this.position.x, y: this.position.y },
          scale: { x: this.scale.x, y: this.scale.y },
        },
        to: {
          position: { x: newPos.x, y: newPos.y },
          scale: { x: 0.78, y: 0.78 },
        },
        duration: 250,
        autoStart: true,
        onComplete: () => {
          this.hide();
          if (tooltipIcon) {
            tooltipIcon.baseObject.scenarios.showCheck.reset().start();
            try {
              window.application.sound.play("complete");
            } catch (e) {}
          } else {
            window.application.eventEmitter.emit(EVENTS.falseCola);
            allIncompleteIcons.forEach((icon) =>
              icon.baseObject.scenarios.showCross.reset().start()
            );
          }

          this.changeParent(OBJECTS.cola);
          this.position = this.config.position;
          this.scale = this.config.scale || { x: 1, y: 1 };
          // _targetBuyer остаётся для onDeliveryComplete; чистим только tooltip.
          this._targetTooltip = null;

          resolve();
        },
      });
    });
  }

  makePath() {
    const points = {
      x: [this.position.x],
      y: [this.position.y],
    };

    const someTooltip =
      ObjectLinks.get(OBJECTS.tooltip1) ||
      ObjectLinks.get(OBJECTS.tooltip2) ||
      ObjectLinks.get(OBJECTS.tooltip3);
    const tooltipPosition = someTooltip
      ? someTooltip.getLocalPositionFor(this)
      : { x: 0, y: 0 };

    points.x.push(tooltipPosition.x - this.position.x * 0.5);
    points.y.push(tooltipPosition.y - this.position.y * 0.5);

    points.x.push(tooltipPosition.x);
    points.y.push(tooltipPosition.y);

    this.position = { x: points.x[0], y: points.y[0] };

    return points;
  }

  getDefaultConfig(config) {
    const superConfig = super.getDefaultConfig(config);

    return Object.assign(superConfig, {
      name: "cola",
      pivot: { x: 27, y: 44 },
      animations: {
        show: Animations.alphaShow
      },
      children: [
        {
          name: "tutorialTap",
          position: { x: 27, y: 44 },
        },
        {
          name: "cola",
          image: "location/drink"
        }
      ],
    });
  }
}