import {
  Animations,
  Container,
  Easing,
  ObjectLinks,
  Rewards,
  Triggers,
} from "PlayableAdsEngine";

export const FOOD_EVENTS = {
  foodTap: "foodTap",
  addMeatToDish: "addMeatToDish",
  dishTap: "dishTap",

  sausageFried: "sausageFried",
};

export default class Food extends Container {
  setup() {
    super.setup();

    this.counter = 0;
  }

  get activeElements() {
    return [];
  }

  updateInteractive(value) {
    if (value == "auto") this.lock();
    else this.unlock();

    // this.view.eventMode = value;
  }

  changeParent(linkID) {
    let newParent = ObjectLinks.get(linkID, this);
    let prevParent = this.parent;
    let position = newParent.getLocalPositionFor(this);

    if (this.view) {
      newParent.addChild(this.view);
    }

    if (this.name) {
      newParent && (newParent[this.name] = this);
      prevParent && delete prevParent.baseObject[this.name];
    }

    this.position = position;
  }

  getTapTutorialPoint() {
    return this.tutorialTap;
  }

  getDefaultConfig(config) {
    const superConfig = super.getDefaultConfig(config);

    return Object.assign(superConfig, {
      on: [
        {
          t: Triggers.onTap(),
          r: Rewards.startScenario("action"),
        },
      ],
      // devDrag: true,
      scenarios: {
        action: [
          Rewards.playSound("whoosh"),
          Rewards.startScenario([
            Rewards.if(() => !this.locked, Rewards.withArgs(
              () => this,
              Rewards.emitEvent(FOOD_EVENTS.foodTap)
            )),
            Rewards.if(
              () => this.counter == 0,
              Rewards.startScenario([
                () => (this.counter = 1),
                Rewards.startScenario(
                  Rewards.forEach(
                    () => this.activeElements,
                    Rewards.startScenario([
                      Rewards.onTarget(
                        (obj) => obj,
                        Rewards.startScenarioInstant([
                          Rewards.startAnimationInstant({
                            from: { scale: { x: 1, y: 1 } },
                            to: { scale: { x: 1.1, y: 1.1 } },
                            duration: 150,
                            yoyo: true,
                            easing: Easing.Quadratic.InOut,
                          }),
                          Rewards.startAnimation({
                            creator: Animations.moveToDxDy,
                            dy: -15,
                            //to: { rotation: 0.5 },
                            duration: 150,
                            yoyo: true,
                            easing: Easing.Quadratic.InOut,
                          }),
                        ])
                      ),
                      Rewards.startAnimation("waitStep"),
                    ])
                  )
                ),
                Rewards.wait(() => Math.max(2, (this.activeElements.length - 1)) * 150),
                () => (this.counter = 0),
              ])
            ),
          ]),
        ],
      },
      animations: {
        waitStep: {
          duration: 25,
        },
        bounce: {},
      },
    });
  }
}
