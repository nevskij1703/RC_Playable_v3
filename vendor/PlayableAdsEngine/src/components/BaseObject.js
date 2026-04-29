import Animation from "../core/Animation";
import Scenario from "../core/Scenario";

export default class BaseObject {
  constructor(options) {
    this.config = Object.assign(this.getDefaultConfig(options), options);

    this.name = undefined;

    this.scenarios = {};
    this.animations = {};

    this.locked;

    this.setup();
    this.setupLogic();
  }

  setup() {
    const { name, locked = false } = this.config;

    name && (this.name = name);

    this.locked = locked;
  }

  setupLogic() {
    this.addLogic(this.config);
  }

  addLogic(config) {
    const { animations, scenarios } = config;

    animations && this.setupAnimations(animations);
    scenarios && this.setupScenarios(scenarios);
  }

  setupScenarios(scenarios) {
    for (const name in scenarios) {
      const scenarioConfig = scenarios[name];
      this.scenarios[name] = new Scenario(
        this,
        Array.isArray(scenarioConfig)
          ? { rewards: scenarioConfig }
          : scenarioConfig,
      );
    }
  }

  setupAnimations(animations) {
    for (const name in animations) {
      const animationConfig = animations[name];
      this.animations[name] = new Animation(this, animationConfig);
    }
  }

  lock() {
    this.locked = true;
  }
  unlock() {
    this.locked = false;
  }

  getDefaultConfig() {
    return {
      scenarios: undefined,
      animations: undefined,
    };
  }
}
