import Animation from "../../core/Animation";
import Condition from "../../core/Condition";
import ObjectLinks from "../../core/ObjectLinks";
import Scenario from "../../core/Scenario";
import { sound } from "@pixi/sound";

export default class Rewards {
  static emitEvent(event, ...args) {
    return function () {
      window.application.eventEmitter.emit(
        event,
        ...(args.length ? args : [this])
      );
    };
  }
  static callMethod(methodName) {
    return function () {
      this[methodName]();
    };
  }
  static show() {
    return this.callMethod("show");
  }

  static hide() {
    return this.callMethod("hide");
  }

  static set(values) {
    return function () {
      Rewards._set(this, values);
    };
  }

  static lock() {
    return function () {
      this["lock"]();
    };
  }

  static unlock() {
    return function () {
      this["unlock"]();
    };
  }

  static applyPosition(position) {
    return function () {
      this["applyPosition"](position);
    };
  }

  /* static setStage(...args) {
    return {
      r: Rewards._exec,
      args,
      callable: function (config) {
        StagedSprite.setStage(this, ...config.args);
      },
    };
  } */

  static call(methodOrFunction, ...argsWhenCall) {
    return function (...args) {
      Rewards.callNonInstant(methodOrFunction, ...argsWhenCall).call(
        this,
        ...args
      );
    };
  }

  static callNonInstant(methodOrFunction, ...argsWhenCall) {
    return function (...args) {
      args = argsWhenCall.concat(args);
      if (typeof methodOrFunction !== "function") {
        return this[methodOrFunction](...args);
      } else {
        return methodOrFunction.call(this, ...args);
      }
    };
  }

  static playSound(nameOrFunction, config) {
    return function () {
      const soundName = Rewards._resolveArg(nameOrFunction, this);
      sound.play(soundName, config);
    };
  }

  static playSoundIfNotSuspended(sound, config) {
    return {
      r: Rewards._soundCall,
      method: "playIfNotSuspended",
      args: [sound, config],
    };
  }

  static playSoundIfNotPlaying(name, config) {
    return function () {
      const targetSound = sound._sounds[name];
      !targetSound.isPlaying && targetSound.play(config);
    };
  }

  static stopSound(name) {
    return function () {
      sound.stop(name);
    };
  }

  static fadeSound(sound, config) {
    return { r: Rewards._soundCall, method: "fade", args: [sound, config] };
  }

  static pauseSound(sound) {
    return { r: Rewards._soundCall, method: "pause", args: [sound] };
  }

  static resumeSound(sound) {
    return { r: Rewards._soundCall, method: "resume", args: [sound] };
  }

  static playableFinish() {
    return function () {
      window.application.playableFinished();
    };
  }

  static playableRestart() {
    return Rewards.emitEvent("playableRestart");
  }

  static forEach(objectsOrFunction, rewards) {
    return function (...args) {
      const rewardsList = [];
      const objects = Rewards._resolveArg(objectsOrFunction, this, ...args);

      objects.forEach((object) => {
        rewardsList.push(Rewards.withArgs(object, rewards));
      });

      return rewardsList;
    };
  }

  static getAnimation(obj, nameOrConfig, ...argsWhenCall) {
    let animation;

    if (typeof nameOrConfig === "function") {
      nameOrConfig = nameOrConfig(...argsWhenCall);
    }
    if (typeof nameOrConfig === "string") {
      animation = obj.animations[nameOrConfig];
    } else {
      animation = new Animation(obj, nameOrConfig);
    }

    return animation;
  }

  static startAnimation(nameOrConfig, ...argsWhenCall) {
    return function (...args) {
      args = argsWhenCall.concat(args);
      const animation = Rewards.getAnimation(this, nameOrConfig, ...args);

      const promise = animation.startPromise();
      promise.object = animation;

      return promise;
    };
  }

  static startAnimationInstant(nameOrConfig, ...argsWhenCall) {
    return function (...args) {
      args = argsWhenCall.concat(args);
      const animation = Rewards.getAnimation(this, nameOrConfig, ...args);

      animation.start();
    };
  }

  static stopAnimation(name) {
    return function () {
      const animation = this.animations[name];
      if (!animation) {
        throw new Error(`Animation "${name}" not found for "${this.name}"`);
      }

      animation.stop();
    };
  }

  // scenario
  static getScenario(obj, nameOrConfig, ...args) {
    let scenario;

    if (typeof nameOrConfig === "function") {
      nameOrConfig = nameOrConfig.call(obj, ...args);
    }

    if (typeof nameOrConfig === "string") {
      scenario = obj.scenarios[nameOrConfig];
    } else {
      scenario = new Scenario(obj, nameOrConfig);
    }

    return scenario;
  }
  static startScenario(nameOrConfig, ...argsWhenCall) {
    return function (...args) {
      args = argsWhenCall.concat(args);
      const scenario = Rewards.getScenario(this, nameOrConfig, ...args);

      const promise = scenario.reset().startPromise(...args);
      promise.object = scenario;

      return promise;
    };
  }

  static startScenarioInstant(nameOrConfig, ...argsWhenCall) {
    return function (...args) {
      args = argsWhenCall.concat(args);
      const scenario = Rewards.getScenario(this, nameOrConfig, ...args);

      scenario.reset().start(...args);
    };
  }

  static resumeScenario(name) {
    return function () {
      if (!this.scenarios[name]) {
        throw new Error(`Scenario "${name}" not found for "${this.name}"`);
      }

      this.scenarios[name].resume();
    };
  }

  static stopScenario(name, interrupt = true) {
    return function () {
      if (!this.scenarios[name]) {
        throw new Error(`Scenario "${name}" not found for "${this.name}"`);
      }

      this.scenarios[name].stop(interrupt);
    };
  }

  static _resolveArg(arg, context, ...args) {
    return typeof arg === "function" ? arg.call(context, ...args) : arg;
  }

  static withArgs(...argsWhenCall) {
    return function (...args) {
      const reward = argsWhenCall[argsWhenCall.length - 1];
      const rewardArgs = argsWhenCall
        .slice(0, argsWhenCall.length - 1)
        .map((arg) => Rewards._resolveArg(arg, this, ...args));

      return reward.call(this, ...rewardArgs);
    };
  }

  static wait(timeOrFunction) {
    return function (...args) {
      const time = Rewards._resolveArg(timeOrFunction, this, ...args);

      const animation = window.application.waitAnimationPool.get().config({
        time,
      });

      const promise = animation.reset().startPromise();
      promise
        .then(() => window.application.waitAnimationPool.free(animation))
        .catch((data) => console.log("wait Animation catch", data));
      promise.object = animation;

      return promise;
    };
  }

  static if(conditionsOrFunction, rewardsTrue, rewardsFalse) {
    return function (...args) {
      const isConditionTruthy = Condition.areSatisfied(
        this,
        typeof conditionsOrFunction === "function"
          ? conditionsOrFunction.bind(this, ...args)
          : conditionsOrFunction
      );

      let reward = isConditionTruthy ? rewardsTrue : rewardsFalse;

      if (reward) {
        return reward.call(this, ...args);
      }
    };
  }

  static switch(conditionsOrFunction, rewardsObjects) {
    return function (...args) {
      const conditionValue = conditionsOrFunction.call(this, ...args);

      let reward = rewardsObjects[conditionValue];

      if (reward) {
        return reward.call(this, ...args);
      }
    };
  }

  static onChild(name, rewards) {
    return Rewards.onTarget(function () {
      return this[name];
    }, rewards);
  }

  static onTarget(target, rewards) {
    return function (...args) {
      const rewardsTarget = ObjectLinks.get(target, this, ...args);

      return rewards.call(rewardsTarget, ...args);
    };
  }

  static log(...args) {
    return function () {
      console.log(this, ...args);
    };
  }

  static reassignLink(linkID, ...args) {
    return {
      r: Rewards._exec,
      args,
      callable: function (config) {
        ObjectLinks.reassign(linkID, ...config.args);
      },
    };
  }

  // call on «this»
  static _set(obj, values) {
    Object.assign(obj, values);
  }

  static _soundCall(config) {
    return Rewards._callMethod(this.app.sounds, config.method, config.args);
  }

  static _callMethod(obj, method, args = []) {
    return obj[method](...args);
  }

  static _exec(config, ...args) {
    return config.callable.call(
      this,
      Object.assign({}, config, {
        args: [].concat(config.args ? config.args : [], args),
      })
    );
  }
}
