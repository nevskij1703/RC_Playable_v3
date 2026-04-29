import {
    Animations,
    Container,
    Easing,
    Rewards,
  } from "PlayableAdsEngine";
  

  
  export default class Ingredient extends Container {
    getDefaultConfig(config) {
      const superConfig = super.getDefaultConfig(config);

      const {showAnimConfig = {}} = config;
  
      return Object.assign(superConfig, {
        visible: false,
        scenarios: {
          show: [
            Rewards.startScenarioInstant(
              Rewards.forEach(
                function () {
                  return this.children;
                },
                Rewards.onTarget(
                  (obj) => obj,
                  function () {
                    this.baseObject.visible = false;
                  }
                )
              )
            ),
            Rewards.startScenarioInstant(
              Rewards.forEach(
                function () {
                  return this.children;
                },
                Rewards.onTarget(
                  (obj) => obj.baseObject,
                  Rewards.startScenario([
                    Rewards.show(),
                    Rewards.startAnimationInstant(Object.assign({
                      creator: Animations.moveFromDxDy,
                      dy: 25,
                      duration: 150,
                      easing: Easing.Quadratic.Out,
                    }, showAnimConfig)),
                    Rewards.wait(10),
                  ])
                )
              )
            ),
            Rewards.show()
          ],
        }
      });
    }
  }
  