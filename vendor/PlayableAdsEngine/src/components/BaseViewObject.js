import { APPLICATION_EVENTS } from "../Application";
import ObjectLinks from "../core/ObjectLinks";
import Position from "../core/Position";
import BaseObject from "./BaseObject";

export default class BaseViewObject extends BaseObject {
  constructor(options) {
    super(options);

    this.view;
  }
  setup() {
    this.setupView();

    super.setup();

    const {
      visible,
      position,
      pivot,
      scale,
      rotation,
      alpha,
      tint,
      adaptivePosition = false,
    } = this.config;

    position &&
      !adaptivePosition &&
      this.position.set(...Object.values(position));
    pivot && this.pivot.set(...Object.values(pivot));
    scale && this.scale.set(...Object.values(scale));
    rotation && (this.rotation = rotation);
    alpha && (this.alpha = alpha);
    tint && (this.tint = tint);

    visible !== undefined && (this.visible = visible);

    this.positions = Position.createPositionsFromConfig(this.config);

    adaptivePosition &&
      window.application.eventEmitter.on(
        APPLICATION_EVENTS.playableResize,
        () => this.applyPosition()
      );
  }

  applyPosition(name) {
    this.currentPositionName = name ? name : this.detectPositionName();

    //console.log(this, this.currentPositionName)

    this.position = this.positions[this.currentPositionName].calculateFor(this);
  }

  detectPositionName() {
    const isPortrait =
      window.application.rendererConfig.onlyPortrait ||
      window.application.renderer.isPortrait;
    let positionName = isPortrait
      ? Position.PORTRAIT_NAME
      : Position.DEFAULT_NAME;

    if (Object.keys(this.positions).length < 3) {
      return positionName;
    }

    for (let key in window.RATIO) {
      if (window.application.renderer.getLandscapeRatio >= window.RATIO[key]) {
        break;
      }

      let name = (isPortrait ? "portrait_" : "") + key.toLowerCase();

      if (this.positions[name]) {
        positionName = name;
      }
    }

    return positionName;
  }

  setSamePositionAs(linkID) {
    this.position = this.parent.baseObject.getLocalPositionFor(
      ObjectLinks.get(linkID, this)
    );
  }
  getLocalPositionFor(visualObject) {
    return this.view.toLocal(
      visualObject.parent.toGlobal(visualObject.position)
    );
  }
  show() {
    this.animations.show && this.animations.show.start();
    this.view.visible = true;
  }

  async showAsync() {
    this.view.visible = true;
    this.animations.show && (await this.animations.show.startPromise());
  }

  async hide() {
    const animationHide = this.animations.hide;
    if (animationHide) {
      if (animationHide.tween.isPlaying()) {
        return;
      }
      await animationHide.startPromise();
    }
    this.view.visible = false;
  }

  set visible(value) {
    this.view.visible = value;
  }
  set rotation(value) {
    this.view.rotation = value;
  }
  set position(value) {
    this.view.position = value;
  }
  set alpha(value) {
    this.view.alpha = value;
  }
  set x(value) {
    this.view.x = value;
  }
  set y(value) {
    this.view.y = value;
  }
  set eventMode(value) {
    this.view.eventMode = value;
  }
  set scale(value) {
    this.view.scale = value;
  }
  set texture(value) {
    this.view.texture = value;
  }
  set tint(value) {
    this.view.tint = value;
  }

  get visible() {
    return this.view.visible;
  }
  get position() {
    return this.view.position;
  }
  get pivot() {
    return this.view.pivot;
  }
  get rotation() {
    return this.view.rotation;
  }
  get scale() {
    return this.view.scale;
  }
  get alpha() {
    return this.view.alpha;
  }
  get width() {
    return this.view.width;
  }
  get height() {
    return this.view.height;
  }
  get x() {
    return this.view.x;
  }
  get y() {
    return this.view.y;
  }
  get parent() {
    return this.view.parent;
  }
  get eventMode() {
    return this.view.eventMode;
  }
  get texture() {
    return this.view.texture;
  }
  get tint() {
    return this.view.tint;
  }

  setTexture(texture) {
    this.view.texture = texture;
  }
  addChild(object) {
    return this.view.addChild(object);
  }

  getDefaultConfig(options) {
    return Object.assign(
      {
        position: { x: 0, y: 0 },
        scale: { x: 1, y: 1 },
        //rotation: { x: 0, y: 0 },
        children: [],
      },
      options
    );
  }
}
