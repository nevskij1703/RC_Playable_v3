import { sound } from "@pixi/sound";
/** Бихейвиор для автоматической постановки всех звуков на паузу,
 * когда пользователь переключается из плейэбла в другие приложения.
 *
 * Подкдлючите behavior к PlayableController
 *
  behaviors: [
    {behavior: SoundControlBehavior}
  ],
 */
import Behavior from "./Behavior";
//import { APPLICATION_EVENTS } from '../../Core/Application';

const CHECK_INTERVAL = 100;

export default class SoundControlBehavior extends Behavior {
  static create(obj, behaviorConfig) {
    if (!SoundControlBehavior.instance) {
      super.create(obj, behaviorConfig);
    }

    obj.soundControlBehavior = SoundControlBehavior.instance;
  }

  setup() {
    SoundControlBehavior.instance = this;
    this.paused = false;

    this.globalTimer = setInterval(() => this.updateState(), CHECK_INTERVAL);
  }

  updateState() {
    if (document.hidden && !this.paused) {
      this.setPaused();
    } else if (!document.hidden && this.paused) {
      this.setResumed();
    }
  }

  setPaused() {
    this.paused = true;
    //sound.toggleMuteAll();
    sound.pauseAll();
    //this.target.app.emit(APPLICATION_EVENTS.playablePause);
  }

  setResumed() {
    this.paused = false;
    //sound.toggleMuteAll();
    sound.resumeAll();
    //this.target.app.emit(APPLICATION_EVENTS.playableResume);
  }
}
