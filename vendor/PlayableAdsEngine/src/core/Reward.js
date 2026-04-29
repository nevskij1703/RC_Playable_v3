export default class Reward {
  static applyAll(obj, rewards = [], ...args) {
    (Array.isArray(rewards) ? rewards : [rewards]).forEach(reward => Reward.apply(obj, reward, ...args))
  }

  static apply(obj, reward, ...args) {
    if (!reward) {
      return null
    }

    if (typeof reward === 'function') {
      return reward.call(obj, ...args)
    }

    return reward.r.call(obj, Object.assign({}, reward), ...args)
  }

  static isInstant(reward) {
    if (!reward || Array.isArray(reward)) {
      return true
    }

    return !reward.nonInstant
  }
}
