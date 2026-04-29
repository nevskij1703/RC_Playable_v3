import Container from "../../components/Container";
import Animations from "../../core/Animations";
import BaseBehaviors from "./../../behaviors/BaseBehaviors";

export default class ButtonInstall extends Container {
  getDefaultConfig(config) {
    const { baseImage, textImage } = config;

    return Object.assign(super.getDefaultConfig(config), {
      behaviors: [BaseBehaviors.clickInstall],

      animations: {
        show: {
          creator: Animations.alphaScaleShow,
          time: 300,
        },
      },
      children: [
        {
          image: baseImage,
          anchor: { x: 0.5, y: 0.5 },
        },
        Object.assign(
          {
            anchor: { x: 0.5, y: 0.5 },
          },
          textImage
        ),
      ],
    });
  }
}
