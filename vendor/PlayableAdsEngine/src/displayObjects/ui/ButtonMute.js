import { sound } from "@pixi/sound";
import { Assets } from "pixi.js";
import Sprite from "../../components/Sprite";
import Triggers from "../../behaviors/universalBehavior/Triggers";

export default class ButtonMute extends Sprite {
  toggle() {
    sound.toggleMuteAll();

    this.updateView();
  }

  updateView() {
    const muted = sound.context.muted;

    window.application.soundMuted = muted;

    this.texture = Assets.get(`ui/button_sound_${muted ? "off" : "on"}`);
  }
  getDefaultConfig(config) {
    if (!window.applicationSettings.buttonMute) {
      return {};
    }

    return Object.assign(super.getDefaultConfig(config), {
      image: "ui/button_sound_on",
      anchor: { x: 0.5, y: 0.5 },
      on: [
        {
          t: Triggers.onceSoundReady(),
          r: () => this.show(),
        },
        {
          t: Triggers.onTap(),
          r: () => this.toggle(),
        },
      ],
    });
  }
}
