import BaseBehaviors from "../../behaviors/BaseBehaviors";
import Rewards from "../../behaviors/universalBehavior/Rewards";
import Sprite from "../../components/Sprite";
import HitAreaBehavior from "./../../behaviors/HitAreaBehavior";
import Triggers from "./../../behaviors/universalBehavior/Triggers";

export default class MisclickArea extends Sprite {
  getDefaultConfig(config) {
    return Object.assign(super.getDefaultConfig(config), {
      behaviors: [BaseBehaviors.clickInstall, HitAreaBehavior.hitAreaBehavior],
      hitAreaData: {
        //edit: true,
        type: "rect",
        position: { x: -750, y: -750 },
        width: 1500,
        height: 1500,
      },
      on: [
        {
          t: Triggers.onTap(),
          r: Rewards.stopSound("music"),
        },
      ],
    });
  }
}
