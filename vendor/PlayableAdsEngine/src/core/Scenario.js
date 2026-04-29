export default class Scenario {
  constructor(obj, config) {
    let rewards;

    if (Array.isArray(config)) {
      rewards = config;
    } else if (config && Array.isArray(config.rewards)) {
      rewards = config.rewards;
    } else {
      throw new Error("Unexpected scenario config type");
    }

    this.name = config.name;

    this.obj = obj;
    this.rewards = rewards || [];
    this.args = [];
    this.loop = config.loop || false;
    this.repeat = config.repeat || 0;
    this.acceptNoArgs = config.acceptNoArgs || false;

    this.isActive = false;

    this.currentRunNumber = 0;

    this.reset();
  }

  getNextStepNumber() {
    if (this.rewards.length === 0) {
      return null;
    }

    if (this.currentStepNumber === null) {
      return 0;
    }

    if (this.currentStepNumber !== this.rewards.length - 1) {
      return this.currentStepNumber + 1;
    }

    if (this.loop || this.repeat > this.repeatNumber) {
      this.repeatNumber++;

      return 0;
    }

    return null;
  }

  startNextStep() {
    if (!this.isActive) {
      return;
    }

    this.currentStepNumber = this.getNextStepNumber();

    if (this.currentStepNumber === null) {
      this.isActive = false;

      this.finish();

      return;
    }

    const reward = this.rewards[this.currentStepNumber];

    this._currentReward = reward.call(this.obj, ...this.args);

    const runNumber = this.currentRunNumber;

    if (this._currentReward && this._currentReward instanceof Promise) {
      this._currentReward
        .then(() => {
          if (runNumber === this.currentRunNumber) {
            this._currentReward = null;

            this.startNextStep();
          }
        })
        .catch(this.#onCatch);
    } else {
      this.startNextStep();
    }
  }

  reset() {
    this._rejectPromise && this._rejectPromise();

    this.currentStepNumber = null;
    this.repeatNumber = 0;
    this.isActive = false;

    this._currentReward = null;

    this._resolvePromise = null;
    this._rejectPromise = null;

    return this;
  }

  start(...args) {
    this.currentRunNumber++;

    this.isActive = true;

    this.args = this.acceptNoArgs ? [] : args;

    this.startNextStep();

    return this;
  }

  startPromise(...args) {
    const promise = new Promise((resolve, reject) => {
      this._resolvePromise = resolve;
      this._rejectPromise = reject;

      this.start(...args);
    });

    promise.catch(this.#onCatch);

    return promise;
  }

  resume() {
    this.isActive = true;

    this.startNextStep();

    return this;
  }

  stop(interrupt = true) {
    this.isActive = false;

    this._rejectPromise && this._rejectPromise();

    if (interrupt && this._currentReward && this._currentReward.object) {
      typeof this._currentReward.object.stop === "function" &&
        this._currentReward.object.stop(true);
      this._currentReward = null;
    }

    return this;
  }

  finish() {
    if (this._resolvePromise) {
      this._resolvePromise();

      this._resolvePromise = null;
    }
  }

  #onCatch(error) {
    error && console.log(error);
  }
}
