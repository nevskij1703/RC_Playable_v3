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

    let tooltip = ObjectLinks.get(OBJECTS.tooltip);
    let tooltipIcon = tooltip.getIncompleteIconByProducts(this.view);
    let tooltipIncompleteIcons = tooltip.getIncompleteIcons();
    let newPos = this.parent.baseObject.getLocalPositionFor(
      tooltipIcon ? tooltipIcon : tooltipIncompleteIcons[0]
    );

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
          tooltipIcon &&
            tooltipIcon.baseObject.updateCounter(
              --tooltipIcon.baseObject.count
            );
          tooltipIcon &&
            !tooltipIcon.baseObject.count &&
            tooltipIcon.baseObject.scenarios.showCheck.reset().start();
          if (!tooltipIcon) {
            window.application.eventEmitter.emit(EVENTS.falseCola);
            tooltipIncompleteIcons.forEach((icon) =>
              icon.baseObject.scenarios.showCross.reset().start()
            );
          } else window.application.sound.play("complete");

          this.changeParent(OBJECTS.cola);
          this.position = this.config.position;
          this.scale = this.config.scale || {x: 1, y: 1};

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

    const tooltipPosition = ObjectLinks.get(OBJECTS.tooltip).getLocalPositionFor(this)

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