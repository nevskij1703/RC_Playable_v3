import { Easing } from "PlayableAdsEngine";

export const ANIMATION_RESOURCE_TAP = {
  from: { scale: { x: 1, y: 1 } },
  to: { scale: { x: 0.9, y: 0.9 } },
  duration: 150,
  easing: Easing.Quadratic.InOut,
  yoyo: true,
};
