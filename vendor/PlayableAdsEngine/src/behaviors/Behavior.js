export default class Behavior {
  static create(obj, config) {
    return new this(obj, config)
  }

  static isInstanceOfBehavior(obj) {
    return obj.prototype instanceof Behavior
  }

  static canBeAppliedFor() {
    return true
  }

  constructor(obj, config) {
    this.target = obj
    this.config = config

    this.setup()
  }

  setup() {}

  static applyFor(obj, behavior) {
    let callable = behavior
    let config = {}

    if (behavior.behavior) {
      callable = behavior.behavior;
      config = Object.assign({}, behavior)
    }

    if (Behavior.isInstanceOfBehavior(callable)) {
      callable.canBeAppliedFor(obj) && callable.create(obj, config)
    } else {
      callable.call(obj, config)
    }
  }
}
