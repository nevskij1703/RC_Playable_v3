import { Spine } from "PlayableAdsEngine";
import {
    AtlasAttachmentLoader,
    Spine as PixiSpine,
    SkeletonJson,
    TextureAtlas,
  } from "@pixi-spine/all-4.1";
  import { Assets } from "pixi.js";

export default class SpineCustom extends Spine {
  setupView() {
    const { fileName, atlasFileName = fileName, assetsFileName = fileName, jsonFileName = fileName } = this.config;

    const spineAtlas = new TextureAtlas(
      Assets.get(`${atlasFileName}.atlas.txt`),
      function (line, callback) {
        callback(Assets.get(assetsFileName));
      },
    );

    var spineAtlasLoader = new AtlasAttachmentLoader(spineAtlas);
    var spineJsonParser = new SkeletonJson(spineAtlasLoader);

    var spineData = spineJsonParser.readSkeletonData(
      Assets.get(`${jsonFileName}.json`),
    );

    this.view = new PixiSpine(spineData);
  }
}