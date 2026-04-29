import { Group, Layer as PixiLayer } from "@pixi/layers";
import BaseViewObject from "./BaseViewObject";

export default class Layer extends BaseViewObject {
  setup() {
    super.setup();

    const { zIndex = 0 } = this.config;

    this.group = new Group(zIndex);
  }

  // прописываем в общем конфиге, что будет поддержка layers (меняется app.stage и появляется список layers к которому смогут обращаться создаваемые объекты)

  setupView() {
    this.view = new PixiLayer();
  }
}
