import { MaskBehavior } from "PlayableAdsEngine";
import Food from "./Food";

export default class Fries extends Food {
  get activeElements() {
    return [this.potato_3, this.potato_2, this.potato_1];
  }

  getTapTutorialPoint() {
    return this.tutorialTap;
  }

  getDefaultConfig(config) {
    const superConfig = super.getDefaultConfig(config);

    return Object.assign(superConfig, {
        behaviors: [MaskBehavior.maskBehavior],
        maskData: {vertices: [-200, -200, 0, 80, 100, 80, 200, -200]},
      pivot: { x: 53, y: 48 },
      children: [
        {
          name: "tutorialTap",
          position: { x: 53, y: 48 },
        },
        {
          name: "potato_1",
          image: "fry/potato2_ready1",
          position: { x: 9, y: 14 },
        },
        {
          name: "potato_2",
          image: "fry/potato2_ready2",
          position: { x: 8, y: 12 },
        },
        {
          name: "potato_3",
          image: "fry/potato2_ready3",
          position: { x: 53, y: 48 },
          pivot: { x: 53, y: 48 },
        },
      ],
    });
  }
}
