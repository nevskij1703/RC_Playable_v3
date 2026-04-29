import {
  Application,
  APPLICATION_EVENTS,
  PixiRenderer,
  BaseObject,
  Container,
  MainContainer,
  Sprite,
  DraggingBehavior,
  PIXI,
  Behavior,
  appConfig,
} from "PlayableAdsEngine";
import config from "config";

const EVENTS = Object.assign({}, APPLICATION_EVENTS);
const DEV_KEYS = [];
const CLASSES = {
  BaseObject,
  Sprite,
  Container,
  DraggingBehavior,
  PIXI,
  MainContainer,
  Behavior,
};

window.dev = {
  CLASSES,
  EVENTS,
  DEV_KEYS,
};

appConfig.objectFactory.objectDefault.behaviors.push({
  behavior: devDragBehavior,
  devDragImage: true,
});

appConfig.analytics.path =
  "https://qa-analytics.matryoshka.com/EventReceiver/batch";
appConfig.analytics.appId = "PlayableAds_QA";
appConfig.analytics.apiKey = "0d0cfc96-c7c4-4cc9-8a55-2e2f8f217045";


window.application = new Application(
  PixiRenderer,
  Object.assign(appConfig, config)
);

/**
 * devDrag-бихевиор для навешивания на создаваемые объекты
 */
function devDragBehavior(/*config*/) {
  if (!this.config || !this.config.devDrag) {
    return;
  }

  /*if (!this.config.image && config.devDragImage) {
    this.config.image = Texture.WHITE;
    this.config.devDrag !== true && (this.tint = this.config.devDrag)

    this.setupTexture()
  }*/

  Behavior.applyFor(this, {
    behavior: DraggingBehavior,
    offsetDependent: true,
    handlers: {
      start: () =>
        window.application.eventEmitter.emit(EVENTS.devObjectSelected, this),
    },
  });
}
