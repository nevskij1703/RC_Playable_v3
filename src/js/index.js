import { Application, PixiRenderer, appConfig } from "PlayableAdsEngine";
import config from "./config";

appConfig.analytics.path =
  "https://prod-analytics.matryoshka.com/EventReceiver/batch";
appConfig.analytics.appId = "PlayableAds_PROD";
appConfig.analytics.apiKey = "d5afc635-1fa5-4625-bc56-35ff503d13bc";


window.application = new Application(
  PixiRenderer,
  Object.assign(appConfig, config)
);
