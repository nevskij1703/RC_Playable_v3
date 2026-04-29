import BaseViewObject from "./BaseViewObject";
import { Container as PixiContainer } from "pixi.js";

export default class Container extends BaseViewObject {
  setup() {
    super.setup();

    const { children, sortableChildren } = this.config;

    sortableChildren && (this.view.sortableChildren = true);

    children &&
      window.application.createVisualObjects(this.view, children, this);
  }

  setupView() {
    this.view = new PixiContainer();
  }

  get anchor() {
    return { x: 0.5, y: 0.5 };
  }

  get origWidth() {
    return 0; //this.view.width;
  }

  get origHeight() {
    return 0; //this.view.height;
  }

  get children() {
    return this.view.children;
  }
}
