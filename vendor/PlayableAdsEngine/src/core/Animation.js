import { Tween } from "tweedle.js";

export default class Animation {
  #resolvePromise = undefined;
  #completeList = [];

  constructor(obj, config) {
    this.tween = new Tween(obj);

    if (typeof config === "function") {
      config = config.call(obj, {});
    }

    if (config.creator) {
      config = config.creator.call(
        obj,
        Object.assign({}, config, { creator: null })
      );
    }

    this.config(config);

    this.#completeList.push(this.#end);

    this.tween.onComplete(() => {
      this.#completeList.forEach((method) => {
        method.apply(this);
      });
    });
  }

  start(resolve) {
    if (!this.#resolvePromise && resolve) {
      this.#resolvePromise = resolve;
    }

    this.tween.start();

    return this;
  }

  startPromise() {
    if (this.#resolvePromise) {
      return Promise.reject();
    }

    return new Promise((resolve) => {
      this.start(resolve);
    });
  }

  stop() {
    this.tween.stop();

    this.#end();

    return this;
  }

  reset() {
    this.tween.reset();

    return this;
  }

  restart() {
    this.tween.restart();

    return this;
  }
  resume() {
    this.tween.resume();

    return this;
  }

  config(config) {
    const {
      from,
      to,
      time,
      duration,
      loop,
      repeat,
      easing,
      yoyo,
      interpolation,
      autoStart,
      onStart,
      onUpdate,
      onComplete,
    } = config;

    const tween = this.tween;

    to && tween.to(to);

    from && tween.from(from);
    loop && tween.repeat();
    if (yoyo) {
      tween.yoyo(yoyo);
      !loop && tween.repeat(1);
    }

    repeat && tween.repeat(repeat);
    easing && tween.easing(easing);

    interpolation && tween.interpolation(interpolation);

    duration && tween.duration(duration);
    time && tween.duration(time);

    onStart && tween.onStart(onStart);
    onUpdate && tween.onUpdate(onUpdate);
    onComplete && this.#completeList.push(onComplete);
    /*    on.start && tween.onStart(on.start);
    on.update && tween.onUpdate(on.update);
    on.end && tween.onComplete(on.end);*/

    autoStart && tween.start();

    return this;
  }

  #end() {
    if (this.#resolvePromise) {
      const resolvePromise = this.#resolvePromise;

      this.#resolvePromise = null;
      resolvePromise();
    }
  }

  get isActive() {
    return this.tween.isPlaying();
  }

  /*  static create(obj, config) {


    //tween.from(config.from);

    /!*if (!window.is_webgl && config.to && config.to.alpha !== undefined && config.easing === 'outBack') {
        tween.on('update', () => {
            if (obj.alpha > 1) {
                obj.alpha = 1;
            }
        });
    }*!/

    return new Tween(obj);
  }*/

  /*static removeAll(obj) {
      let tweens = PIXI.tweenManager.getTweensForTarget(obj);

      for (let i = 0; i < tweens.length; i++) {
          let tween = tweens[i];
          tween.stop();

          PIXI.tweenManager.removeTween(tween);
      }
  }*/
}
