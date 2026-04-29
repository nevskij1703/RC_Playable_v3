import {
  APPLICATION_EVENTS,
  Animation,
  Animations,
  BaseObject,
  Easing,
  ObjectLinks,
  Particle,
  ParticleEmitter,
  Rewards,
  Triggers,
  Tutorial,
} from "PlayableAdsEngine";
import {
  OBJECTS,
  PRODUCTS_TYPES,
  TIMINGS,
  EVENTS,
  CHARACTER_ANIMATIONS,
} from "../../const";
import { FOOD_EVENTS } from "../../displayObjects/location/food/Food";
import Cola from "../../displayObjects/location/food/Cola";
import Smoke from "../../displayObjects/location/Smoke";
import Tortilla from "../../displayObjects/location/food/Tortilla";

const TUTORIAL_DELAY_FOR_NEW_PRODUCT = 2000;

// будет список фиксированных заказов, они будут появляться, если выполняются их условия (товар есть в наличии) если не выполняется, то рандомим уже из открытых товаров
export const ORDERS_LIST = [
  {
    id: 1,
    order: [
      {
        products: [PRODUCTS_TYPES.meat],
        count: 2,
        tutorialSteps: [
          {
            object: OBJECTS.tortilla,
          },
          {
            object: OBJECTS.grill,
          },
          {
            object: OBJECTS.meat,
          },
          {
            object: "dish",
          },
        ],
      },
      {
        cola: true,
        count: 1,
        tutorialSteps: [
          {
            object: OBJECTS.cola,
          },
        ],
      },
    ],
    complete: false,
  },
  {
    id: 2,
    order: [
      {
        products: [PRODUCTS_TYPES.meat, PRODUCTS_TYPES.cucumbers],
        count: 3,
        tutorialSteps: [
          {
            object: OBJECTS.tortilla,
          },
          {
            object: OBJECTS.grill,
          },
          {
            object: OBJECTS.meat,
          },
          {
            object: OBJECTS.cucumbers,
          },
          {
            object: "dish",
          },
        ],
      },
      {
        cola: true,
        count: 3,
        tutorialSteps: [
          {
            object: OBJECTS.cola,
          },
          {
            object: OBJECTS.cola,
          },
          {
            object: OBJECTS.cola,
          },
        ],
      },
    ],
    complete: false,
  },
  {
    id: 3,
    order: [
      {
        products: [PRODUCTS_TYPES.meat, PRODUCTS_TYPES.fry, PRODUCTS_TYPES.cucumbers],
        count: 9,
        tutorialSteps: [
          {
            object: OBJECTS.tortilla,
          },
          {
            object: OBJECTS.grill,
          },
          {
            object: OBJECTS.meat,
          },
          {
            object: OBJECTS.fry,
          },
          {
            object: OBJECTS.cucumbers,
          },
          {
            object: "dish",
          },
        ],
      },
      {
        products: [
          PRODUCTS_TYPES.meat,
          PRODUCTS_TYPES.tomato,
          PRODUCTS_TYPES.fry,
        ],
        count: 12,
        tutorialSteps: [
          {
            object: OBJECTS.tortilla,
          },
          {
            object: OBJECTS.grill,
          },
          {
            object: OBJECTS.meat,
          },
          {
            object: OBJECTS.fry,
          },
          {
            object: OBJECTS.tomato,
          },
          {
            object: "dish",
          },
        ],
      },
    ],
    complete: false,
  },
];

const BUYERS_POSITIONS_X = [378, 256, 38, -128];

export const BUYERS_LIST = [
  {
    name: "italian_man",
  },
  {
    name: "pretty_woman",
  },
  {
    name: "old_grambler",
  },
  {
    name: "old_stylish_woman",
  },

  /*{
    name: "Mr_Abrams",
  },
  {
    name: "Miss_Sherry",
  },
  {
    name: "David",
  },
  {
    name: "Alexa",
  },*/
];

export default class PlayableController extends BaseObject {
  setupComponents() {
    this.tutorial = new Tutorial(ObjectLinks.get(OBJECTS.tutorialFinger));

    this.emptyDishes = [OBJECTS.dish1, OBJECTS.dish2, OBJECTS.dish3];

    this.currentDishes = [];

    this.completedDishesCount = 0;

    this.tooltip = ObjectLinks.get(OBJECTS.tooltip);
    this.buyers = ObjectLinks.get(OBJECTS.buyers);
    this.cola = ObjectLinks.get(OBJECTS.cola);

    ParticleEmitter.createPools({
      startSize: 100,
      poolAdditionalSize: 25,
      coin1: {
        class: Particle,
        image: "ui/coin_reward",
        flyTime: 350,
        container: OBJECTS.coins,
        source: OBJECTS.coins,
        p1: OBJECTS.p1,
        destination: OBJECTS.coinsFinish1,
      },
      coin2: {
        class: Particle,
        image: "ui/coin_reward",
        flyTime: 350,
        container: OBJECTS.coins,
        source: OBJECTS.coins,
        p1: OBJECTS.p2,
        destination: OBJECTS.coinsFinish2,
      },
      coin3: {
        class: Particle,
        image: "ui/coin_reward",
        flyTime: 350,
        container: OBJECTS.coins,
        source: OBJECTS.coins,
        p1: OBJECTS.p3,
        destination: OBJECTS.coinsFinish3,
      },
      smoke: {
        class: Smoke,
        scale: { x: 2, y: 2 },
        flyTime: 600,
        // prepend: true,
        container: OBJECTS.smokeContainer,
        offset: {
          x: 128,
          y: 48,
        },
      },
    });
  }

  updateNextBuyer() {
    const buyer = this.getNextBuyer();
    const order = this.getNextOrder();

    this.currentBuyer = buyer;
    this.currentBuyer.order = order;

    this.updateTooltip(order);
  }

  checkDish(dish) {
    let order = { products: [] };
    let buyerOrder = this.currentBuyer.order.order;

    Object.keys(PRODUCTS_TYPES).forEach(
      (product) => dish[product].visible && order.products.push(product)
    );

    let matchDish = buyerOrder.find(
      (products) =>
        products.products &&
        products.products.toString() == order.products.toString()
    );

    matchDish && this.removeProductsFromOrder(buyerOrder, matchDish);

    return matchDish;
  }

  removeProductsFromOrder(order, products) {
    const productsIndex = order.indexOf(products);

    if (productsIndex !== -1) {
      if (!--order[productsIndex].count) order.splice(productsIndex, 1);
    }
  }

  removeColaFromOrder(order) {
    const cola = order.find((product) => product.cola);
    const productsIndex = order.indexOf(cola);

    if (productsIndex !== -1) {
      if (!--order[productsIndex].count) order.splice(productsIndex, 1);
    }
  }

  isOrderActual(order) {
    return order.length;
  }

  checkCola() {
    let buyerOrder = this.currentBuyer.order.order;

    return buyerOrder.find((order) => order.cola);
  }

  updateTooltip(order) {
    this.tooltip.updateIcons(order.id);
  }

  getNextBuyer() {
    return BUYERS_LIST.shift();
  }

  getNextOrder() {
    return ORDERS_LIST.shift();
  }

  lockDishes() {
    ObjectLinks.get(OBJECTS.dish1).updateInteractive("auto");
    ObjectLinks.get(OBJECTS.dish2).updateInteractive("auto");
    ObjectLinks.get(OBJECTS.dish3).updateInteractive("auto");
  }

  unlockDishes() {
    this.currentDishes.forEach((dish) => dish.updateInteractive("dynamic"));
  }

  updateProductsInteractive() {
    let eventMode = this.currentDishes.filter(
      (dish) => dish.visible && !dish[PRODUCTS_TYPES.tomato].visible
    ).length
      ? "dynamic"
      : "auto";

    ObjectLinks.get(PRODUCTS_TYPES.tomato).updateInteractive(eventMode);

    eventMode = this.currentDishes.filter(
      (dish) => dish.visible && !dish[PRODUCTS_TYPES.fry].visible
    ).length
      ? "dynamic"
      : "auto";
    ObjectLinks.get(PRODUCTS_TYPES.fry).updateInteractive(eventMode);

    eventMode = this.currentDishes.filter(
      (dish) => dish.visible && !dish[PRODUCTS_TYPES.cucumbers].visible
    ).length
      ? "dynamic"
      : "auto";
    ObjectLinks.get(PRODUCTS_TYPES.cucumbers).updateInteractive(eventMode);
  }

  updatePansInteractive() {
    let emptyDishesCount = this.currentDishes.filter(
      (dish) => dish[OBJECTS.meat].visible
    ).length;
  }

  updateMeatInteractive() {
    let meatCount =
      ObjectLinks.get(OBJECTS.meat).meat1.visible &&
      !ObjectLinks.get(OBJECTS.meat).meat1.animations.hide.isActive;

    ObjectLinks.get(OBJECTS.meat).updateInteractive(
      meatCount ? "dynamic" : "auto"
    );
  }

  updateGrillInteractive(value) {
    ObjectLinks.get(OBJECTS.grill).updateInteractive(value);
  }

  updateTortillaInteractive() {
    const emptyDishes = this.emptyDishes.length;

    ObjectLinks.get(OBJECTS.tortilla).updateInteractive(
      emptyDishes ? "dynamic" : "auto"
    );
  }

  addProductToDish(product) {
    let emptyDish;
    let emptyDishes = this.currentDishes.filter(
      (dish) => !dish[product.config.linkID].visible
    );

    emptyDish = emptyDishes[0];

    if (emptyDish) {
      emptyDish[product.config.linkID].scenarios.show.reset().start();
      emptyDish.updateFakeDish(product.config.linkID);

      if (product.config.linkID == OBJECTS.meat) {
        const meat = ObjectLinks.get(OBJECTS.meat);
        let usedMeat;

        if (meat.meat3.visible) usedMeat = meat.meat3;
        else if (meat.meat2.visible) usedMeat = meat.meat2;
        else if (meat.meat1.visible) usedMeat = meat.meat1;

        usedMeat && usedMeat.hide();
      }
    }
  }

  getEmptyDish() {
    let dish = this.emptyDishes.pop();

    this.currentDishes.push(ObjectLinks.get(dish));
    this.currentDishes.sort((dish1, dish2) => {
      if (dish1.config.linkID < dish2.config.linkID) return -1;
      else return 1;
    });
    return dish;
  }

  getVisibleCola() {
    let cola = this.cola.children.filter((cola) => cola.visible);

    cola = cola.length ? cola[cola.length - 1].baseObject : undefined;

    return cola;
  }

  removeDishFromCurrent(dish) {
    const dishIndex = this.currentDishes.indexOf(dish);

    if (dishIndex !== -1) {
      this.currentDishes.splice(dishIndex, 1);

      this.emptyDishes.push(dish.config.linkID);
      this.emptyDishes.sort();
    }
  }

  removeCurrentBuyer(buyer) {
    const buyerIndex = this.currentBuyers.indexOf(buyer);

    if (buyerIndex !== -1) {
      this.currentBuyers.splice(buyerIndex, 1);

      // BUYERS_LIST.push(buyer);
    }

    this.removeBuyerFromScene(buyer);
  }

  getActiveOrders() {
    return this.currentBuyer.order;
  }

  getActiveDish() {
    return this.currentDishes[0];
  }

  getActivePan() {}

  setDishEmpty(dish) {
    dish["pita"].visible = false;
    dish["pita_closed"].visible = false;
    dish["pita_opened"].visible = false;
    Object.keys(PRODUCTS_TYPES).forEach(
      (product) => (dish[product].visible = false)
    );
  }

  // туториал обновляем после каждой смены заказа
  updateTutorial(order = this.getActiveOrders()) {
    if (order) {
      this.tutorialOrder = order.order[0];
      if (!this.tutorialOrder) return;
      this.currentTutorialStep = this.tutorialOrder.tutorialSteps[0]; // нужно проверять, не взяли ли уже этот предмет и если взяли то искать след шаг, но можно подзабить если первый товар будет заменяться

      if (!this.emptyDishes.length)
        this.currentTutorialStep = { object: "dish" };

      this.tutorial.startTutorialTap({
        target:
          this.currentTutorialStep.object == "dish"
            ? this.getActiveDish()
            : this.currentTutorialStep.object == "pan"
            ? this.getActivePan()
            : this.currentTutorialStep.object == "cola"
            ? this.getVisibleCola()
            : ObjectLinks.get(this.currentTutorialStep.object),
        delay: TUTORIAL_DELAY_FOR_NEW_PRODUCT,
      });
    }
  }

  resumeTutorial() {
    if (this.currentTutorialStep) {
      const target =
          this.currentTutorialStep.object == "dish"
            ? this.getActiveDish()
            : this.currentTutorialStep.object == "pan"
            ? this.getActivePan()
            : this.currentTutorialStep.object == "cola"
            ? this.getVisibleCola()
            : ObjectLinks.get(this.currentTutorialStep.object),
        delay =
          this.currentTutorialStep.delay !== undefined
            ? this.currentTutorialStep.delay
            : TUTORIAL_DELAY_FOR_NEW_PRODUCT;

      target &&
        this.tutorial.startTutorialTap({
          target,
          delay,
        });
    }
  }

  stopTutorial() {
    this.tutorialOrder = undefined;
    this.currentTutorialStep = undefined;
    this.tutorial.stopTutorial();
  }

  pauseTutorial() {
    this.tutorial.stopTutorial();
  }

  nextTutorialStep(object) {
    if (this.currentTutorialStep) {
      if (
        object.config.linkID === this.currentTutorialStep.object ||
        object.config.name === this.currentTutorialStep.object
      ) {
        this.tutorial.stopTutorial();

        if (!this.tutorialOrder.count) this.updateTutorial();

        const { tutorialSteps } = this.tutorialOrder;

        this.currentTutorialStep =
          tutorialSteps[tutorialSteps.indexOf(this.currentTutorialStep) + 1];

      } else {
        this.tutorial.stopTutorial();
      }

      if (this.currentTutorialStep) {
        this.resumeTutorial();
      } else {
        this.stopTutorial();
      }
    }
  }

  showDrinks() {
    this.cola.children.sort((obj1, obj2) => {
      return obj1.baseObject.config.linkID < obj2.baseObject.config.linkID
        ? 1
        : -1;
    });
    this.cola.children.forEach((drink) => {
      !drink.baseObject.visible && drink.baseObject.show();
      // drink.baseObject.onResize();
    });
  }

  getDefaultConfig(config) {
    return Object.assign(super.getDefaultConfig(config), {
      scenarios: {
        main: [
          Rewards.call("setupComponents"),

          () =>
            this.buyers[BUYERS_LIST[0].name].animations.moveToStart.config({
              time: 750,
            }),
          Rewards.startScenarioInstant(
            Rewards.forEach(
              BUYERS_LIST,
              Rewards.onTarget(
                (obj) => this.buyers[obj.name],
                Rewards.startScenario([
                  Rewards.show(),
                  Rewards.startAnimationInstant("moveToStart"),
                  Rewards.wait(250),
                ])
              )
            )
          ),
          Rewards.call("updateNextBuyer"),
          Rewards.call("updateTutorial"),
          Rewards.wait(650),
          Rewards.call("updateMeatInteractive"),
          Rewards.onTarget(OBJECTS.tooltip, Rewards.call("show")),
        ],

        emitCoins: {
          repeat: 12,
          rewards: [
            Rewards.startScenarioInstant([
              Rewards.onTarget(
                () => ParticleEmitter.getParticle("coin1"),
                Rewards.startScenarioInstant("main")
              ),
              Rewards.onTarget(
                () => ParticleEmitter.getParticle("coin2"),
                Rewards.startScenarioInstant("main")
              ),
              Rewards.onTarget(
                () => ParticleEmitter.getParticle("coin3"),
                Rewards.startScenarioInstant("main")
              ),
            ]),
            Rewards.wait(30),
          ],
        },

        emitProductCoins: [
          Rewards.startScenario([
            Rewards.startScenario({
              rewards: [
                Rewards.startScenarioInstant([
                  Rewards.onTarget(
                    (particle) => ParticleEmitter.getParticle(particle),
                    Rewards.startScenarioInstant("main")
                  ),
                ]),
                Rewards.wait(50),
              ],
              repeat: 3,
            }),
          ]),
        ],

        emitProductCoinsAdditional: [
          Rewards.playSound("complete"),
          Rewards.startScenarioInstant({
            rewards: [
              Rewards.startScenario([
                Rewards.onTarget(
                  (particle) => ParticleEmitter.getParticle(particle),
                  Rewards.startScenarioInstant("main")
                ),
              ]),
              Rewards.wait(30),
            ],
            repeat: 12,
          }),
        ],

        buyerMoveOut: [
          Rewards.onTarget(
            (buyer) => buyer,
            Rewards.startAnimationInstant("moveOut")
          ),
          Rewards.wait(TIMINGS.characterMoveOut * 0.25),
          Rewards.onTarget((buyer) => buyer, Rewards.hide()),
        ],

        addFood: [
          Rewards.playSound("tap"),
          Rewards.if(
            (food) => food instanceof Cola,
            Rewards.startScenarioInstant("addCola"),
            Rewards.if(
              (food) => food instanceof Tortilla,
              Rewards.startScenarioInstant("addTortilla"),
              Rewards.startScenario([
                Rewards.withArgs(
                  (food) => food,
                  Rewards.call("addProductToDish")
                ),
                Rewards.call("updateProductsInteractive"),
                Rewards.call("updateMeatInteractive"),
                Rewards.call("nextTutorialStep"),
              ])
            )
          ),
        ],

        updateBuyer: [
          Rewards.call("lockDishes"),
          Rewards.call("stopTutorial"),
          Rewards.onTarget(OBJECTS.tooltip, Rewards.hide()),
          Rewards.playSound("coins_fly_old"),
          Rewards.startScenarioInstant("emitCoins"),
          Rewards.startScenario("setCurrentBuyerHappy"),
          Rewards.wait(250),
          () => {
            switch (BUYERS_LIST.length) {
              case 3:
                window.application.sound.play("male_happy");
                break;
              case 2:
                window.application.sound.play(([1,2].includes(window.application.version) ? "female_happy" : "female_haha"), { volume: 1.3 });
                break;
            }
          },
          Rewards.wait(1500),
          Rewards.withArgs(
            () => this.buyers[this.currentBuyer.name],
            Rewards.startScenario("buyerMoveOut")
          ),
          Rewards.if(
            () => [1,3].includes(window.application.version) && BUYERS_LIST.length == 3 || [2,4].includes(window.application.version) && BUYERS_LIST.length == 2,
            Rewards.startScenario("showMisclick")
          ),
          Rewards.call("updateNextBuyer"),
          Rewards.startScenarioInstant("moveOtherBuyers"),
          Rewards.withArgs(
            () => this.buyers[this.currentBuyer.name],
            Rewards.startScenario("moveBuyer")
          ),
          Rewards.call("showDrinks"),
          Rewards.if(
            () => !BUYERS_LIST.length,
            Rewards.onTarget(OBJECTS.tooltip, function () {
              this.view.pivot.x += 76;
            })
          ),
          Rewards.onTarget(OBJECTS.tooltip, Rewards.show()),
          Rewards.call("unlockDishes"),
          () => this.updateTutorial(),
        ],

        moveBuyer: [
          Rewards.onTarget(
            (buyer) => buyer,
            Rewards.startAnimationInstant({
              to: { position: { x: -128 } },
              time: 350,
            })
          ),
          // Rewards.onTarget((buyer) => buyer, Rewards.startAnimation("move")),
        ],

        moveOtherBuyers: [
          Rewards.startScenario(
            Rewards.forEach(
              () => BUYERS_LIST.map((buyer) => this.buyers[buyer.name]),
              Rewards.onTarget(
                (obj) => obj,
                Rewards.startScenario([
                  Rewards.wait(200),
                  function () {
                    this.animations.move.config({
                      from: { position: { x: this.position.x } },
                      to: {
                        position: {
                          x: BUYERS_POSITIONS_X[
                            BUYERS_POSITIONS_X.indexOf(this.position.x) + 1
                          ],
                        },
                      },
                    });
                  },
                  Rewards.startAnimationInstant("move"),
                ])
              )
            )
          ),
        ],

        addCola: [
          Rewards.if(
            () => !this.currentBuyer.order.order.length,
            Rewards.stopScenario("addCola")
          ),
          Rewards.call("pauseTutorial"),
          Rewards.if(
            () => this.checkCola(),
            Rewards.startScenario([
              Rewards.withArgs(
                () => this.currentBuyer.order.order,
                Rewards.call("removeColaFromOrder")
              ),
            ])
          ),
          Rewards.onTarget(
            (cola) => cola,
            Rewards.callNonInstant("flyToTooltip")
          ),
          Rewards.if(
            () => !this.isOrderActual(this.currentBuyer.order.order),
            Rewards.startScenario("updateBuyer")
          ),
          Rewards.call("nextTutorialStep"),
        ],

        cookMeat: [
          // Rewards.startScenarioInstant("cookMeat"),
          Rewards.call("updateMeatInteractive"),
          Rewards.call("nextTutorialStep"),
        ],

        addTortilla: [
          Rewards.playSound("tap"),
          Rewards.call("pauseTutorial"),
          Rewards.onTarget(
            () => this.getEmptyDish(),
            Rewards.startScenario([
              Rewards.call("resetFakeDish"),
              Rewards.call("updateInteractive", "dynamic"),
              Rewards.onChild("pita", Rewards.show()),
              Rewards.onChild("pita_opened", Rewards.show()),
            ])
          ),
          Rewards.call("updateProductsInteractive"),
          Rewards.call("updateTortillaInteractive"),
          Rewards.call("nextTutorialStep"),
        ],

        putDish: [
          Rewards.onTarget(
            (dish) => dish,
            Rewards.call("updateInteractive", "auto")
          ),
          Rewards.call("pauseTutorial"),
          Rewards.if(
            (dish) => this.checkDish(dish),
            Rewards.startScenario([
              Rewards.onTarget(
                (dish) => dish,
                Rewards.startScenario([
                  Rewards.onChild(
                    "pita_opened",
                    Rewards.startAnimation("close")
                  ),
                  Rewards.onChild("pita_opened", Rewards.hide()),
                  Rewards.onChild("pita_closed", Rewards.show()),
                  Rewards.onChild(
                    "pita_closed",
                    Rewards.startAnimation("close")
                  ),
                ])
              ),
              Rewards.withArgs((dish) => dish, Rewards.call("setDishEmpty")),
              Rewards.onTarget(
                (dish) => dish,
                Rewards.callNonInstant("flyToTooltip")
              ),
              // Rewards.wait(250),
              Rewards.withArgs(
                (dish) => dish,
                Rewards.call("removeDishFromCurrent")
              ),
              Rewards.if(
                () =>
                  !this.isOrderActual(this.currentBuyer.order.order) &&
                  !this.scenarios.updateBuyer.isActive &&
                  !this.tooltip.getIncompleteIcons().length,
                Rewards.startScenario("updateBuyer"),
                () => this.updateTutorial()
              ),
            ]),
            Rewards.startScenario([
              Rewards.withArgs((dish) => dish, Rewards.call("setDishEmpty")),
              Rewards.withArgs(
                (dish) => dish,
                Rewards.call("removeDishFromCurrent")
              ),
              Rewards.onTarget(
                (dish) => dish,
                Rewards.callNonInstant("flyToTooltip")
              ),
            ])
          ),
          Rewards.call("updateTortillaInteractive"),
          Rewards.call("updateProductsInteractive"),
          Rewards.call("nextTutorialStep"),
        ],

        setCurrentBuyerAngry: [
          Rewards.withArgs(
            () => CHARACTER_ANIMATIONS.angry,
            Rewards.startScenario("changeCurrentBuyerAnimation")
          ),
        ],

        setCurrentBuyerHappy: [
          Rewards.withArgs(
            () => CHARACTER_ANIMATIONS.happy,
            Rewards.startScenario("changeCurrentBuyerAnimation")
          ),
        ],

        changeCurrentBuyerAnimation: [
          Rewards.onTarget(
            () => this.buyers[this.currentBuyer.name],
            Rewards.withArgs(
              (animation) => animation,
              Rewards.call("setAnimation")
            )
          ),
          Rewards.onTarget(
            () => this.buyers[this.currentBuyer.name],
            Rewards.withArgs(
              () => CHARACTER_ANIMATIONS.idle,
              Rewards.call("addAnimation")
            )
          ),
        ],

        showMisclick: [
          Rewards.if(
            () => !window.is_adwords,
            Rewards.onTarget(OBJECTS.buttonInstall, Rewards.hide())
          ),
          Rewards.if(
            () => window.is_adwords || window.is_unity,
            Rewards.onTarget(
              OBJECTS.nextLevelMisclick,
              Rewards.startScenario("play")
            ),
            Rewards.onTarget(OBJECTS.misclickArea, Rewards.show())
          ),
        ],

        sliceMeat: [
          Rewards.onTarget(OBJECTS.knife, Rewards.startAnimation("moveUp")),
          Rewards.onTarget(
            OBJECTS.knife,
            Rewards.onChild("knife", Rewards.startAnimationInstant("work"))
          ),
          Rewards.onTarget(OBJECTS.knife, Rewards.startAnimationInstant("cut")),
          Rewards.wait(50),
          Rewards.onTarget(
            OBJECTS.grill,
            Rewards.onChild("kebab", Rewards.startAnimationInstant("pulse"))
          ),
          Rewards.wait(100),
          Rewards.playSound("slice_meat"),
          Rewards.onTarget(OBJECTS.meat, Rewards.call("addMeat")),
          Rewards.onTarget(OBJECTS.grill, Rewards.call("cutMeat")),
          Rewards.wait(350),
          Rewards.onTarget(
            OBJECTS.knife,
            Rewards.onChild("knife", Rewards.stopAnimation("work"))
          ),
          Rewards.onTarget(
            OBJECTS.grill,
            Rewards.onChild("kebab", Rewards.stopAnimation("pulse"))
          ),
          Rewards.onTarget(
            OBJECTS.grill,
            Rewards.onChild("kebab", Rewards.startAnimationInstant("toDefault"))
          ),
          Rewards.onTarget(OBJECTS.knife, Rewards.startAnimation("moveDown")),
        ],

        win: [],

        fail: [],
      },

      on: [
        {
          t: Triggers.onceEvent(APPLICATION_EVENTS.playableStart),
          r: Rewards.startScenario("main"),
        },

        {
          t: Triggers.onEvent(FOOD_EVENTS.foodTap),
          r: Rewards.startScenario("addFood"),
        },

        {
          t: Triggers.onEvent(FOOD_EVENTS.dishTap),
          r: Rewards.startScenario("putDish"),
        },

        {
          t: Triggers.onEvent(EVENTS.addMeat),
          r: Rewards.startScenario([
            Rewards.call("pauseTutorial"),
            Rewards.call("updateGrillInteractive", "auto"),
            Rewards.startScenario("sliceMeat"),
            Rewards.call("updateGrillInteractive", "dynamic"),
            Rewards.wait(10),
            Rewards.call("updateProductsInteractive"),
            Rewards.call("updateMeatInteractive"),
            Rewards.call("nextTutorialStep"),
          ]),
        },

        {
          t: Triggers.onEvent(EVENTS.falseDish),
          r: Rewards.startScenario([
            Rewards.if(
              () =>
                this.buyers[this.currentBuyer.name].spine.view.state.getCurrent(
                  0
                ).animation.name != CHARACTER_ANIMATIONS.happy,
              Rewards.startScenario("setCurrentBuyerAngry")
            ),
            Rewards.call("updateTutorial"),

            () => {
              switch (BUYERS_LIST.length) {
                case 3:
                  window.application.sound.play("male_angry");
                  break;
                case 2:
                  window.application.sound.play("female_angry");
                  break;
              }
            },
          ]),
        },

        {
          t: Triggers.onEvent(EVENTS.falseCola),
          r: Rewards.startScenario([
            Rewards.if(
              () =>
                this.buyers[this.currentBuyer.name].spine.view.state.getCurrent(
                  0
                ).animation.name != CHARACTER_ANIMATIONS.happy,
              Rewards.startScenario("setCurrentBuyerAngry")
            ),
            Rewards.call("updateTutorial"),
            () => {
              switch (BUYERS_LIST.length) {
                case 3:
                  window.application.sound.play("male_angry");
                  break;
                case 2:
                  window.application.sound.play("female_angry");
                  break;
              }
            },
          ]),
        },

        {
          t: Triggers.onceEvent(APPLICATION_EVENTS.playableFirstInteraction),
          c: () => window.is_mraid,
          r: Rewards.playSound("music", { loop: true, volume: 0.5 }),
        },
        {
          t: Triggers.onceEvent(APPLICATION_EVENTS.playableStart),
          c: () => !window.is_mraid,
          r: Rewards.playSound("music", { loop: true, volume: 0.5 }),
        },
      ],
    });
  }
}
