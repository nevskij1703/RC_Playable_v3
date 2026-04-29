import {
  AtlasAttachmentLoader,
  Spine as PixiSpine,
  SkeletonJson,
  TextureAtlas,
} from "@pixi-spine/all-4.1";
import { Assets } from "pixi.js";
import BaseViewObject from "./BaseViewObject";

export default class Spine extends BaseViewObject {
  setup() {
    super.setup();

    const { mixes, currentAnimation, skinName } = this.config;

    mixes && this.setMixes(mixes);
    currentAnimation && this.setAnimation(0, currentAnimation, true);
    skinName && this.setSkinByName(skinName);

    // Нужно будет замиксинить debug в dev-сборке
    /* this.view.debug = new SpineDebugRenderer();
    this.view.debug.drawDebug = true; */
  }

  setupView() {
    const { fileName } = this.config;

    const spineAtlas = new TextureAtlas(
      Assets.get(`${fileName}.atlas.txt`),
      function (line, callback) {
        callback(Assets.get(fileName));
      },
    );

    var spineAtlasLoader = new AtlasAttachmentLoader(spineAtlas);
    var spineJsonParser = new SkeletonJson(spineAtlasLoader);

    var spineData = spineJsonParser.readSkeletonData(
      Assets.get(`${fileName}.json`),
    );

    this.view = new PixiSpine(spineData);
  }

  setSkinByName(skinName) {
    this.view.skeleton.setSkinByName(skinName);
  }

  setMixes(mixes) {
    mixes.forEach((mix) => {
      this.view.stateData.setMix(...mix);
    });
  }

  setAnimation(trackIndex = 0, animationName, loop = true) {
    const state = this.hasAnimation(animationName);

    state && state.setAnimation(trackIndex, animationName, loop);
  }

  addAnimation(trackIndex = 0, animationName, loop = true, delay = 0) {
    const state = this.hasAnimation(animationName);

    state && state.addAnimation(trackIndex, animationName, loop, delay);
  }

  stop() {
    this.view.autoUpdate = false;
  }

  play() {
    this.view.autoUpdate = true;
  }

  /**
   *
   * @param {string} name - название анимации
   * @returns Promise который зарезолвится после выполнения анимации
   */
  startAnimation(name) {
    const { state } = this.view;

    state.clearListeners();

    return new Promise((resolve) => {
      this.setAnimation(0, name, false);

      const onComplete = (entry) => {
        if (entry.animation.name === name) {
          state.removeListener(listener);
          resolve();
        }
      };

      const listener = {
        complete: onComplete,
      };

      state.addListener(listener);
    });
  }

  hasAnimation(animationName) {
    const { view } = this;
    const { state } = view;

    if (state.hasAnimation(animationName)) {
      return state;
    } else {
      console.log(`animation ${animationName} not found`);

      return undefined;
    }
  }
}
