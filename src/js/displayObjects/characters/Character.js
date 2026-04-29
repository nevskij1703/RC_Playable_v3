import { Animations, Container, Easing, Spine } from "PlayableAdsEngine";
import { CHARACTER_ANIMATIONS, TIMINGS } from "../../const";

export default class Character extends Container {
  onResize(positionName) {
      this.spine.applyPosition(positionName);
  }

  setAnimation(animationName, loop = false) {
    this.spine.setAnimation(0, animationName, loop);
  }

  addAnimation(animationName, loop = true) {
    this.spine.addAnimation(0, animationName, loop);
  }

  getDefaultConfig(config) {
    const {spineConfig = {}} = config;
    return Object.assign(super.getDefaultConfig(config), {
      visible: false,
      animations: {
        show: {creator: Animations.alphaShow, time: 150},
        moveToStart: {
          creator: Animations.moveFromDxDy,
          dx: 400,
          time: 1250
        },
        moveOut: {
          creator: Animations.moveToDxDy,
          dx: -300,
          time: TIMINGS.characterMoveOut,
          easing: Easing.Quintic.Out
        },
        move: {
          duration: TIMINGS.characterMove,
          easing: Easing.Quintic.Out
        },
        hide: {
          creator: Animations.alphaHide,
          time: TIMINGS.characterMoveOut*.5,
          easing: Easing.Quintic.Out
        }
      },
      children: [
        Object.assign({
          name: "spine",
          class: Spine,
          currentAnimation: CHARACTER_ANIMATIONS.idle,
          scale: {x: .55, y: .55},
          position: { x: 0, y: 10 },
          position_portrait: { x: 0, y: 0 }
        }, spineConfig),
      ]
    });
  }
}
