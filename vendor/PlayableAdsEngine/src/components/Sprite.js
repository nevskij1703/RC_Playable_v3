import { Assets, Sprite as PixiSprite } from "pixi.js";
import Container from "./Container";

export default class Sprite extends Container {
  setup() {
    super.setup();

    const { anchor } = this.config;

    anchor && this.anchor.set(...Object.values(anchor));
  }

  setupView() {
    const { image } = this.config;

    this.view = image ? PixiSprite.from(Assets.get(image)) : new PixiSprite();
  }

  set texture(value) {
    this.view.texture = value;
  }

  get anchor() {
    return this.view.anchor;
  }
  get origWidth() {
    return this.view.texture.orig.width;
  }

  get origHeight() {
    return this.view.texture.orig.height;
  }

  get texture() {
    return this.view.texture;
  }
}
