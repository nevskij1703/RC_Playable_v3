import AdaptivePositionBehavior from "./behaviors/AdaptivePositionBehavior";
import Behavior from "./behaviors/Behavior";
import { TRCBehavior } from "./behaviors/TRCBehavior";
import Sprite from "./components/Sprite";
import ObjectLinks from "./core/ObjectLinks";
export default {
  rendererConfig: {
    adaptive: true,
    crop: true,
    size: [1500, 640],
    sizeMin: [853, 640],
    onlyPortrait: false,
  },
  sound: {
    // уровень громкости для всех звуков
    volume: 0.25,
  },
  analytics: {
    path: "",
    appId: "",
    apiKey: "",
  },
  objectFactory: {
    objectDefault: {
      class: Sprite,

      behaviors: [
        AdaptivePositionBehavior,
        TRCBehavior,
        function () {
          const { config } = this;

          if (config) {
            config.behaviors &&
              config.behaviors.forEach((behavior) =>
                Behavior.applyFor(this, behavior)
              );
            config.linkID && ObjectLinks.set(config.linkID, this);
          }
        },
      ],
    },
  },
  children: [],
};
