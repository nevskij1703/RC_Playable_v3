import { Animations, Rewards } from "PlayableAdsEngine";

export const SCENARIO_HIDE = [
  Rewards.startAnimation({ creator: Animations.alphaHide }),
  Rewards.hide(),
];
