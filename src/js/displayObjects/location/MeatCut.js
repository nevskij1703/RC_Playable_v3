import { Container, Rewards } from "PlayableAdsEngine";
import SpineCustom from "../../objects/SpineCustom";

export default class MeatCut extends Container {
  getDefaultConfig(config) {
    const superConfig = super.getDefaultConfig(config);

    return Object.assign(superConfig, {
    //   visible: false,
      scenarios: {
        idle: {
          rewards: [
            Rewards.wait(5000),
            Rewards.wait(5000),
            Rewards.wait(5000),
            Rewards.onChild("cut_1", Rewards.hide()),
            Rewards.onChild("cut_2", Rewards.hide()),
            Rewards.onChild("cut_3", Rewards.hide()),
            Rewards.onChild("cut_4", Rewards.hide()),
            Rewards.wait(5000),
          ],
          loop: true,
        },
      },
      children: [
        {
          name: "cut_4",
          class: SpineCustom,
          currentAnimation: "1st",
          fileName: "kebab_cut",
          skinName: "05",
        //   visible: false,
          alpha: 0.001,
        },
        {
          name: "cut_3",
          class: SpineCustom,
          currentAnimation: "1st",
          fileName: "kebab_cut",
          skinName: "03",
          alpha: 0.001,
        //   visible: false,
        },
        {
          name: "cut_2",
          class: SpineCustom,
          currentAnimation: "1st",
          fileName: "kebab_cut",
          skinName: "02",
          alpha: 0.001,
            // visible: false,
        },
        {
          name: "cut_1",
          class: SpineCustom,
          currentAnimation: "1st",
          fileName: "kebab_cut",
          skinName: "01",
          //   visible: false,
        }
      ],
    });
  }
}
