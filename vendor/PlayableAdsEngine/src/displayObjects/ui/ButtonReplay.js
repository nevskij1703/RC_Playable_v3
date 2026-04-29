import Container from "../../components/Container";
import BaseBehaviors from "../../behaviors/BaseBehaviors";
import Rewards from "../../behaviors/universalBehavior/Rewards";
import Animations from "../../core/Animations";

export default class ButtonReplay extends Container {
  /* getTapTutorialPoint() {
    return this.tutorialTapPoint;
  } */

  getDefaultConfig(config) {
    return Object.assign(super.getDefaultConfig(config), {
      behaviors: [BaseBehaviors.clickInstall],
      scenarios: {
        tutorialTap: [Rewards.startAnimation("tap")],
      },
      animations: {
        show: {
          creator: Animations.alphaScaleShow,
          time: 300,
        },
        tap: {
          from: { scale: { x: 1, y: 1 } },
          to: { scale: { x: 0.9, y: 0.9 } },
          time: 350,
          yoyo: true,
        },
      },
      children: [
        {
          image: "ui/button_install",
          anchor: { x: 0.5, y: 0.5 },
        },
        {
          image: "replay",
          anchor: { x: 0.5, y: 0.5 },
          position: { x: 0, y: -2.5 },
        },
        /* {
          name: "tutorialTapPoint",
          position: { x: -50, y: -75 },
        }, */
      ],
    });
  }
}
