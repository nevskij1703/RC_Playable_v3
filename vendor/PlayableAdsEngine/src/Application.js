import { sound } from "@pixi/sound";
import { EventEmitter } from "@pixi/utils";
import { Assets, Spritesheet } from "pixi.js";
import { Group } from "tweedle.js";
import Animation from "./core/Animation";
import ObjectFactory from "./core/ObjectFactory";
import ObjectPool from "./core/ObjectPool";
import Analytics from "./core/Analytics";
import { getRandomInt } from "./utils";

export const ASSETS_TYPES = {
  images: "images",
  spritesheets: "spritesheets",
  sounds: "sounds",
  spine: "spine",
  atlas: "atlas",
};

export const APPLICATION_EVENTS = {
  playableStart: "playableStart",
  playableFinish: "playableFinish",
  playableRestart: "playableRestart",
  playableResize: "playableResize",
  playablePause: "playablePause",
  playableResume: "playableResume",
  playableFirstInteraction: "playableFirstInteraction",
};

export class Application {
  constructor(rendererClass, options = {}) {
    this.rendererClass = rendererClass;
    this.options = options;

    this.ASSETS_TYPES = ASSETS_TYPES;

    this.assetsConfig = {
      [ASSETS_TYPES.images]: {},
      [ASSETS_TYPES.spritesheets]: {},
      [ASSETS_TYPES.sounds]: {},
      [ASSETS_TYPES.spine]: {},
      [ASSETS_TYPES.atlas]: {},
    };

    this.rendererConfig = this.options.rendererConfig;

    this.eventEmitter = new EventEmitter();
    this.objectFactory = new ObjectFactory(this.options.objectFactory);
    this.sound = sound;
    this.soundMuted = false;

    this.version;

    sound.volumeAll = options.sound.volume;

    this.waitAnimationPool = new ObjectPool({
      config: {},
      startSize: 50,
      additionalSize: 5,
      createObject: () => new Animation({}, {}),
    });

    this.firstInteraction = false;

    this.analytics = new Analytics(this.options.analytics);

    window.RATIO = {
      /* X */
      XLG: 2.15,
      /* 16/8 */
      LG: 1.99,
      /* 16/9 */
      MD: 1.76,
      /* 5/3 */
      SM: 1.65,
      /* 16/10 */
      XSM: 1.59,
      /* 3/2 */
      MN: 1.49,
      /* 4/3 */
      EMN: 1.32,
    };
  }

  importAll(requireContext, assetsType) {
    requireContext.keys().forEach((key) => {
      let name = key.substring(2);
      if (assetsType === ASSETS_TYPES.images) {
        name = name.slice(0, -4);
      }
      this.assetsConfig[assetsType][name] = requireContext(key);
    });
  }

  /**
   * Вызывается сборщиком, когда файл onload
   * @returns {Promise<void>}
   */
  async init() {
    //window.is_adwords = typeof is_adwords !== "undefined";

    Assets.addBundle(
      ASSETS_TYPES.images,
      this.assetsConfig[ASSETS_TYPES.images],
    );
    Assets.addBundle(
      ASSETS_TYPES.spritesheets,
      this.assetsConfig[ASSETS_TYPES.spritesheets],
    );
    Assets.addBundle(ASSETS_TYPES.spine, this.assetsConfig[ASSETS_TYPES.spine]);
    Assets.addBundle(ASSETS_TYPES.atlas, this.assetsConfig[ASSETS_TYPES.atlas]);

    await Assets.loadBundle(ASSETS_TYPES.images);
    await Assets.loadBundle(ASSETS_TYPES.spritesheets);
    await Assets.loadBundle(ASSETS_TYPES.spine);
    await Assets.loadBundle(ASSETS_TYPES.atlas);

    for (const key in this.assetsConfig[ASSETS_TYPES.sounds]) {
      sound.add(key.split(".")[0], this.assetsConfig[ASSETS_TYPES.sounds][key]);
    }

    for (const key in this.assetsConfig[ASSETS_TYPES.spritesheets]) {
      const json = Assets.get(key);

      const spritesheet = new Spritesheet(
        Assets.get(`spritesheet_${key.split(".")[0]}`),
        json,
      );

      await spritesheet.parse();

      for (const key in spritesheet.textures) {
        const texture = spritesheet.textures[key];

        Assets.cache.set(key, texture);
      }
    }

    this.renderer = new this.rendererClass(this.rendererConfig); // PIXI Application

    this.renderer.view.className = "playable";
    /*    setTimeout(() => {
      this.renderer.view.classList.add('visible');
    }, 50);*/

    this.version = this.setupVersion();

    console.log(
      "v:",
      this.version,
      "analytics:",
      window.applicationSettings.analytics,
    );

    this.setup();
  }

  setupVersion() {
    const versionsInSettings = window.applicationSettings.versions;
    const defaultVersions = PLAYABLE_DEFAULT_VERSIONS;

    console.log(versionsInSettings, defaultVersions);

    const versionsList =
      versionsInSettings === undefined ? defaultVersions : versionsInSettings;

    const countVersions = versionsList.length;

    return versionsList[
      countVersions === 1 ? 0 : getRandomInt(0, countVersions - 1)
    ];
  }

  setup() {
    this.renderer.ticker.add(() =>
      Group.shared.update(
        this.renderer.ticker.elapsedMS < 200
          ? this.renderer.ticker.elapsedMS
          : 0,
      ),
    );

    this.createVisualObjects(this.renderer.stage, this.options.children);

    document.body.appendChild(this.renderer.view);

    this.eventEmitter.emit(APPLICATION_EVENTS.playableStart);

    if (!window.is_dapi) {
      this.addEventResize();
      this.onResize(this.screenSize);
    }

    this.addEventFirstAction();
  }

  createVisualObjects(parentPixiObject, objects, parentObject) {
    objects.forEach((object) => {
      if (object) {
        const _obj = this.objectFactory.create(object);

        if (_obj.view) {
          parentPixiObject.addChild(_obj.view);
          _obj.view.baseObject = _obj;
        }

        if (parentObject && _obj.name) {
          parentObject[_obj.name] = _obj;
        }
      }
    });
  }

  addEventFirstAction() {
    const firstAction = () => {
      window.removeEventListener("touchstart", firstAction);
      window.removeEventListener("mousedown", firstAction);

      this.firstUserAction();

      this.firstInteraction = true;

      this.eventEmitter.emit(APPLICATION_EVENTS.playableFirstInteraction);
    };

    window.addEventListener("touchstart", firstAction);
    window.addEventListener("mousedown", firstAction);
  }

  addEventResize() {
    window.addEventListener("orientationchange", () => {
      this.onResize(this.screenSize);
    });
    window.addEventListener("resize", () => {
      this.onResize(this.screenSize);
    });
  }

  onResize(screenSize) {
    if (this.isNotFirstResize) {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }

      this.resizeTimeout = setTimeout(() => {
        this.renderer.onResize(screenSize.width, screenSize.height);

        this.eventEmitter.emit(APPLICATION_EVENTS.playableResize);
      }, 50);
    } else {
      this.isNotFirstResize = true;

      this.renderer.onResize(screenSize.width, screenSize.height);

      this.eventEmitter.emit(APPLICATION_EVENTS.playableResize);
    }
  }

  setClickEvent(obj) {
    obj.eventMode = "static";

    obj.view.on("pointertap", function (e) {
      e.stopPropagation();

      window.application.clickInstall();
    });
  }

  clickInstall() {}
  playableFinished() {}
  firstUserAction() {}

  get isIOS() {
    const nav = navigator.userAgent || window.opera;

    return (
      (/iPad|iPhone|iPod/.test(nav) || /Intel Mac/.test(nav)) &&
      !window.MSStream
    );
  }

  get screenSize() {
    return {
      width: document.body.clientWidth,
      height: document.body.clientHeight,
    };
  }
}
