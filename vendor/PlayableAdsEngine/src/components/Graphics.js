import BaseViewObject from "./BaseViewObject";
import {Graphics as PixiGraphics} from "pixi.js";

const BASE_COLOR = 0xd7d7d7;

export default class Graphics extends BaseViewObject {

  setupView() {

    const { color = BASE_COLOR, rect } = this.config;

    this.view = new PixiGraphics();

    color && this.beginFill(color);
    rect && this.view.drawRect(...rect);
    this.view.endFill();

  }

  clear() {
    this.view.clear();
  }

  beginFill(color) {
    this.view.beginFill(color);
  }

}