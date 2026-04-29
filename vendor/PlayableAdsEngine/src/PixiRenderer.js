import { Application } from "pixi.js";

export default class PixiRenderer extends Application {
  constructor(options) {
    super({
      /*width: options.size[0],
      height: options.size[1],*/
      //resizeTo: window,
      /*antialias: false,
      transparent: true,*/
      //resolution: 1,
    });

    this.options = options;

    this.screenRatio = 0;
  }

  onResize(screenWidth, screenHeight) {
    this.screenRatio = screenWidth / screenHeight;

    this.view.width = this.origWidth;
    this.view.height = this.origHeight;

    this.options.crop && this.cropView();

    //console.log(this.view.width, this.view.height)

    this.resizeView(screenWidth, screenHeight);

    if (this.options.onlyPortrait) {
      this.stage.rotation = this.isLandscape ? -Math.PI / 2 : 0;
    }
  }

  cropView() {
    let screenRatio = this.screenRatio,
      origRatio = this.origWidth / this.origHeight,
      minScreenRatio = this.options.sizeMin[0] / this.options.sizeMin[1];

    if (this.isPortrait) {
      if (screenRatio > origRatio) {
        this.view.height = Math.floor(
          this.origWidth /
            (screenRatio < 1 / minScreenRatio
              ? screenRatio
              : 1 / minScreenRatio)
        );
      }
    } else {
      if (screenRatio < origRatio) {
        this.view.width = Math.floor(
          this.origHeight *
            (screenRatio > minScreenRatio ? screenRatio : minScreenRatio)
        );
      }
    }
  }

  resizeView(screenWidth, screenHeight) {
    this.renderer.resize(this.view.width, this.view.height);

    let canvasWidthStyle, canvasHeightStyle;

    if (this.ratio > this.screenRatio) {
      canvasHeightStyle = Math.round(screenWidth / this.ratio);
      canvasWidthStyle = screenWidth;
    } else {
      canvasWidthStyle = Math.round(screenHeight * this.ratio);
      canvasHeightStyle = screenHeight;
    }

    if (Math.abs(canvasWidthStyle - screenWidth) < 3) {
      canvasWidthStyle = screenWidth;
    }
    if (Math.abs(canvasHeightStyle - screenHeight) < 3) {
      canvasHeightStyle = screenHeight;
    }

    this.view.style.height = canvasHeightStyle + "px";
    this.view.style.width = canvasWidthStyle + "px";
    this.view.style.left =
      Math.max((screenWidth - canvasWidthStyle) / 2, 0) + "px";
    this.view.style.top =
      Math.max((screenHeight - canvasHeightStyle) / 2, 0) + "px";
  }

  get origWidth() {
    if (!this.options.adaptive) {
      return this.options.size[0];
    }

    return this.screenRatio < 1 ? this.options.size[1] : this.options.size[0];
  }

  get origHeight() {
    if (!this.options.adaptive) {
      return this.options.size[1];
    }

    return this.screenRatio < 1 ? this.options.size[0] : this.options.size[1];
  }

  get ratio() {
    return this.view.width / this.view.height;
  }

  get isPortrait() {
    return this.ratio < 1;
  }

  get isLandscape() {
    return !this.isPortrait;
  }

  get getLandscapeRatio() {
    return this.ratio < 1 ? 1 / this.ratio : this.ratio;
  }

  /*ratioLess(ratio) {
    return this.getLandscapeRatio() < RATIO[ratio.toUpperCase()];
  }*/
}
