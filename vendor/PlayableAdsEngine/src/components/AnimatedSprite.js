import { AnimatedSprite as PixiAnimatedSprite, Assets } from "pixi.js";
import Sprite from "./Sprite";

export default class AnimatedSprite extends Sprite {
  setupView() {
    const {
      images,
      startFrame = 1,
      endFrame,
      speed = 0.1,
      loop = true,
      yoyo = false,
      autoStart = false,
    } = this.config;

    const textures = [];

    for (let i = startFrame; i <= endFrame; i++) {
      textures.push(Assets.get(`${images}${i}`));
    }

    if (yoyo) {
      for (let i = endFrame - 1; i >= startFrame; i--) {
        textures.push(Assets.get(`${images}${i}`));
      }
    }

    this.view = new PixiAnimatedSprite(textures);

    this.view.animationSpeed = speed;
    this.view.loop = loop;
    autoStart && this.play();
  }

  play(startFrame = 0) {
    this.view.currentFrame = startFrame;
    this.view.play();
  }
}
