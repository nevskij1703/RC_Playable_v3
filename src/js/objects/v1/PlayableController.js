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
const SLOT_COUNT = 3;
export const TOTAL_BUYERS = 20;
const SPAWN_DELAY_MS = 600;

// Слот -> закреплённый персонаж и его tooltip.
const SLOT_CHARACTERS = ["italian_man", "pretty_woman", "old_grambler"];
const SLOT_TOOLTIPS = [OBJECTS.tooltip1, OBJECTS.tooltip2, OBJECTS.tooltip3];

// Меню блюд (5 позиций по ТЗ). Каждое блюдо — одна порция (count=1).
// Заказ клиента — массив 1..3 этих блюд (см. generateRandomOrder).
export const DISH_TEMPLATES = [
  {
    cola: true,
    products: [OBJECTS.cola],
    count: 1,
    tutorialSteps: [{ object: OBJECTS.cola }],
  },
  {
    products: [PRODUCTS_TYPES.meat],
    count: 1,
    tutorialSteps: [
      { object: OBJECTS.tortilla },
      { object: OBJECTS.grill },
      { object: OBJECTS.meat },
      { object: "dish" },
    ],
  },
  {
    products: [PRODUCTS_TYPES.meat, PRODUCTS_TYPES.cucumbers],
    count: 1,
    tutorialSteps: [
      { object: OBJECTS.tortilla },
      { object: OBJECTS.grill },
      { object: OBJECTS.meat },
      { object: OBJECTS.cucumbers },
      { object: "dish" },
    ],
  },
  {
    products: [
      PRODUCTS_TYPES.meat,
      PRODUCTS_TYPES.fry,
      PRODUCTS_TYPES.cucumbers,
    ],
    count: 1,
    tutorialSteps: [
      { object: OBJECTS.tortilla },
      { object: OBJECTS.grill },
      { object: OBJECTS.meat },
      { object: OBJECTS.fry },
      { object: OBJECTS.cucumbers },
      { object: "dish" },
    ],
  },
  {
    products: [
      PRODUCTS_TYPES.meat,
      PRODUCTS_TYPES.fry,
      PRODUCTS_TYPES.tomato,
    ],
    count: 1,
    tutorialSteps: [
      { object: OBJECTS.tortilla },
      { object: OBJECTS.grill },
      { object: OBJECTS.meat },
      { object: OBJECTS.fry },
      { object: OBJECTS.tomato },
      { object: "dish" },
    ],
  },
];

// Совместимость со старыми импортами.
export const ORDER_TEMPLATES = DISH_TEMPLATES;
export const ORDERS_LIST = DISH_TEMPLATES;
export const BUYERS_LIST = SLOT_CHARACTERS.map((name) => ({ name }));

export default class PlayableController extends BaseObject {
  setupComponents() {
    this.tutorial = new Tutorial(ObjectLinks.get(OBJECTS.tutorialFinger));

    this.emptyDishes = [OBJECTS.dish1, OBJECTS.dish2, OBJECTS.dish3];

    this.currentDishes = [];

    this.completedDishesCount = 0;

    this.buyersContainer = ObjectLinks.get(OBJECTS.buyers);
    this.cola = ObjectLinks.get(OBJECTS.cola);

    // Мульти-клиент state.
    this.activeBuyers = [null, null, null];
    this.totalServed = 0;
    this.totalSpawned = 0;
    this.spawningSlots = new Set();

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
        container: OBJECTS.smokeContainer,
        offset: { x: 128, y: 48 },
      },
    });
  }

  // ---------- Buyer queue / spawn ----------

  // Случайный заказ из 1..3 блюд. Каждое блюдо — отдельная позиция со
  // своим count=1; стаков по одной позиции нет.
  generateRandomOrder() {
    const dishCount = 1 + Math.floor(Math.random() * 3); // 1, 2 или 3
    const order = [];
    for (let i = 0; i < dishCount; i++) {
      const t = DISH_TEMPLATES[Math.floor(Math.random() * DISH_TEMPLATES.length)];
      order.push(JSON.parse(JSON.stringify(t)));
    }
    return order;
  }

  hasMoreBuyers() {
    return this.totalSpawned < TOTAL_BUYERS;
  }

  // Создаёт клиента в слоте: генерит заказ из 1-3 блюд и настраивает
  // tooltip-слоты через setProducts. Анимацию входа кикает асинхронно.
  spawnBuyerInSlot(slotIndex, isInitial = false) {
    if (!this.hasMoreBuyers()) return;
    if (this.activeBuyers[slotIndex]) return;
    if (this.spawningSlots.has(slotIndex)) return;

    this.spawningSlots.add(slotIndex);

    const characterName = SLOT_CHARACTERS[slotIndex];
    const character = this.buyersContainer[characterName];
    const tooltip = ObjectLinks.get(SLOT_TOOLTIPS[slotIndex]);
    const order = this.generateRandomOrder();

    // Сначала сбросим все ProductOnTooltip slots (complete=true, hidden).
    tooltip.resetForReuse();
    tooltip.updateIcons(0); // у нас один orderGroup с id=0

    // Равномерное распределение по высоте бабла в зависимости от
    // количества блюд (1, 2 или 3). Бабл ~285 px высотой после scale.
    const Y_LAYOUT = {
      1: [140],
      2: [85, 200],
      3: [55, 140, 225],
    };
    const ys = Y_LAYOUT[order.length] || [140];

    const orderGroup = tooltip.container.icons.children.find((c) => c.visible);
    if (orderGroup && orderGroup.children) {
      order.forEach((dish, i) => {
        const slot = orderGroup.children[i];
        if (slot && slot.baseObject && slot.baseObject.setProducts) {
          slot.baseObject.setProducts(dish.products, dish.count);
          slot.position.y = ys[i];
        }
      });
    }

    const buyer = {
      slotIndex,
      characterName,
      character,
      tooltip,
      order: { order }, // совместимая обёртка
      tutorialOrderItem: order[0],
      currentTutorialStep:
        order[0] && order[0].tutorialSteps ? order[0].tutorialSteps[0] : null,
      complete: false,
    };

    this.activeBuyers[slotIndex] = buyer;
    this.totalSpawned++;

    this.animateCharacterIn(buyer, isInitial);
  }

  // Анимация входа клиента. Сбрасываем позицию персонажа в его home-точку
  // и проигрываем moveToStart (визуально — въезд из-за правого края).
  animateCharacterIn(buyer, isInitial) {
    const { character, tooltip } = buyer;

    // Сброс к home-позиции (на случай если до этого был moveOut).
    character.position = {
      x: character.config.position.x,
      y: character.config.position.y,
    };
    character.alpha = 1;
    character.show();

    character.animations.moveToStart.config({
      time: isInitial ? 750 : 1000,
    });
    character.animations.moveToStart.reset().start();

    // Tooltip показываем чуть позже, чтобы не "приплывал" впереди клиента.
    setTimeout(
      () => {
        if (this.activeBuyers[buyer.slotIndex] === buyer) {
          tooltip.show();
        }
        this.spawningSlots.delete(buyer.slotIndex);
      },
      isInitial ? 600 : 500
    );

    // После первого появления — обновим tutorial.
    setTimeout(
      () => {
        if (this.activeBuyers[buyer.slotIndex] === buyer) {
          this.updateTutorial();
        }
      },
      isInitial ? 800 : 700
    );
  }

  // Освобождает слот: проигрывает happy/moveOut, прячет tooltip,
  // и через SPAWN_DELAY_MS призывает следующего клиента (если ещё есть).
  releaseSlot(buyer) {
    const slotIndex = buyer.slotIndex;
    if (this.activeBuyers[slotIndex] !== buyer) return;

    this.activeBuyers[slotIndex] = null;
    this.totalServed++;
    buyer.complete = true;

    // Happy + moveOut + hide tooltip.
    const character = buyer.character;
    const tooltip = buyer.tooltip;

    character.setAnimation(CHARACTER_ANIMATIONS.happy, false);
    character.addAnimation(CHARACTER_ANIMATIONS.idle, true);

    // Звуковые реплики (как в оригинале — оставим минимальный набор).
    if (window.application && window.application.sound) {
      const soundName = slotIndex === 0 ? "male_happy" : "female_happy";
      try {
        window.application.sound.play(soundName, { volume: 1.1 });
      } catch (e) {}
    }

    setTimeout(() => {
      // moveOut + hide
      if (character.scenarios && character.scenarios.moveOut) {
        // если scenarios.moveOut существует — прокинуть; иначе вручную.
      }
      character.animations.moveOut.reset().start();
      setTimeout(() => {
        character.animations.hide.reset().start();
      }, TIMINGS.characterMoveOut * 0.4);

      tooltip.hide();
    }, 800);

    // Через паузу — спавним нового в этом же слоте.
    setTimeout(() => {
      this.spawnBuyerInSlot(slotIndex, false);
      // Tutorial может потребовать обновления, если на сцене появился новый.
      this.updateTutorial();
    }, 800 + TIMINGS.characterMoveOut + SPAWN_DELAY_MS);

    // Если клиентов больше не будет — финализация (заглушка для будущих фаз).
    if (
      !this.hasMoreBuyers() &&
      this.activeBuyers.every((b) => b === null)
    ) {
      // TODO (phase 4): showMisclick / store transition.
    }
  }

  // ---------- Lookup утилиты для мульти-клиента ----------

  getActiveBuyers() {
    return this.activeBuyers.filter((b) => b !== null);
  }

  getPrimaryBuyer() {
    // Первый слот, у которого ещё есть незакрытые позиции.
    return this.activeBuyers.find(
      (b) => b !== null && b.tooltip.getIncompleteIcons().length > 0
    );
  }

  // Находит клиента, у которого в заказе есть подходящее блюдо.
  // Возвращает { buyer, orderItem } или null.
  findBuyerForDish(dishProductsSorted) {
    for (const buyer of this.activeBuyers) {
      if (!buyer || buyer.complete) continue;
      const item = buyer.order.order.find(
        (o) =>
          o.products && o.products.toString() === dishProductsSorted.toString()
      );
      if (item) return { buyer, orderItem: item };
    }
    return null;
  }

  // Находит клиента, заказавшего колу.
  findBuyerForCola() {
    for (const buyer of this.activeBuyers) {
      if (!buyer || buyer.complete) continue;
      const item = buyer.order.order.find((o) => o.cola);
      if (item) return { buyer, orderItem: item };
    }
    return null;
  }

  // Уменьшаем counter в заказе клиента и удаляем позицию, если кончилась.
  decrementOrderItem(order, item) {
    const idx = order.indexOf(item);
    if (idx !== -1) {
      if (!--order[idx].count) order.splice(idx, 1);
    }
  }

  // Проверяет, завершён ли заказ клиента (по логической модели).
  isBuyerOrderComplete(buyer) {
    return !buyer.order.order.length;
  }

  // Эмиссия монет для конкретного слота.
  emitCoinsForSlot(slotIndex) {
    const particleNames = ["coin1", "coin2", "coin3"];
    const name = particleNames[slotIndex] || "coin1";

    if (window.application && window.application.sound) {
      try {
        window.application.sound.play("coins_fly_old");
      } catch (e) {}
    }

    let count = 0;
    const total = 8;
    const interval = setInterval(() => {
      const p = ParticleEmitter.getParticle(name);
      if (p && p.scenarios && p.scenarios.main) {
        p.scenarios.main.reset && p.scenarios.main.reset();
        p.scenarios.main.start && p.scenarios.main.start();
      }
      if (++count >= total) clearInterval(interval);
    }, 50);
  }

  // ---------- Совместимость со старыми вызовами ----------

  // Старая checkDish: возвращала matchDish. Сейчас находим клиента + позицию,
  // декрементим логически. Возвращаем item (truthy) или undefined.
  checkDish(dish) {
    const dishProducts = [];
    Object.keys(PRODUCTS_TYPES).forEach(
      (product) => dish[product].visible && dishProducts.push(product)
    );

    const match = this.findBuyerForDish(dishProducts);
    if (!match) return undefined;

    this.decrementOrderItem(match.buyer.order.order, match.orderItem);
    // Сохраняем матч на dish, чтобы flyToTooltip знал, к какому tooltip лететь.
    dish._targetTooltip = match.buyer.tooltip;
    dish._targetBuyer = match.buyer;
    return match.orderItem;
  }

  checkCola() {
    return !!this.findBuyerForCola();
  }

  // Привязывает к cola конкретный целевой tooltip и декрементит лог. заказ.
  prepareColaFlight(cola) {
    const match = this.findBuyerForCola();
    if (!match) return false;
    this.decrementOrderItem(match.buyer.order.order, match.orderItem);
    cola._targetTooltip = match.buyer.tooltip;
    cola._targetBuyer = match.buyer;
    return true;
  }

  // ---------- Tutorial ----------

  updateTutorial() {
    const buyer = this.getPrimaryBuyer();
    if (!buyer) {
      this.stopTutorial();
      return;
    }

    // Перейти к первой невыполненной позиции в заказе клиента.
    const firstItem = buyer.order.order[0];
    if (!firstItem) {
      this.stopTutorial();
      return;
    }
    buyer.tutorialOrderItem = firstItem;
    buyer.currentTutorialStep =
      firstItem.tutorialSteps && firstItem.tutorialSteps[0];

    // Backward-compat для других мест.
    this.tutorialOrder = buyer.tutorialOrderItem;
    this.currentTutorialStep = buyer.currentTutorialStep;

    if (!this.currentTutorialStep) {
      this.stopTutorial();
      return;
    }

    if (!this.emptyDishes.length && this.currentTutorialStep.object !== "cola") {
      this.currentTutorialStep = { object: "dish" };
    }

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
    const buyer = this.getPrimaryBuyer();
    if (!buyer || !buyer.currentTutorialStep) return;

    const step = buyer.currentTutorialStep;
    if (
      object.config.linkID === step.object ||
      object.config.name === step.object
    ) {
      this.tutorial.stopTutorial();

      // Если позиция исчезла из заказа — обновим к следующей.
      if (!buyer.tutorialOrderItem || !buyer.order.order.includes(buyer.tutorialOrderItem)) {
        this.updateTutorial();
        return;
      }

      const { tutorialSteps } = buyer.tutorialOrderItem;
      const nextIdx = tutorialSteps.indexOf(step) + 1;
      buyer.currentTutorialStep = tutorialSteps[nextIdx];
      this.currentTutorialStep = buyer.currentTutorialStep;

      if (buyer.currentTutorialStep) {
        this.resumeTutorial();
      } else {
        this.stopTutorial();
      }
    } else {
      this.tutorial.stopTutorial();
    }
  }

  // ---------- Dishes / cola утилиты (как раньше) ----------

  lockDishes() {
    ObjectLinks.get(OBJECTS.dish1).updateInteractive("auto");
    ObjectLinks.get(OBJECTS.dish2).updateInteractive("auto");
    ObjectLinks.get(OBJECTS.dish3).updateInteractive("auto");
  }

  unlockDishes() {
    this.currentDishes.forEach((dish) => dish.updateInteractive("dynamic"));
  }

  // Любой активный клиент имеет право на этот ингредиент?
  // Для phase 1 — оставляем как раньше: пока есть хоть один currentDish без
  // этого продукта, ингредиент кликабелен. Smart Cooking прилетит позже.
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

  showDrinks() {
    this.cola.children.sort((obj1, obj2) => {
      return obj1.baseObject.config.linkID < obj2.baseObject.config.linkID
        ? 1
        : -1;
    });
    this.cola.children.forEach((drink) => {
      !drink.baseObject.visible && drink.baseObject.show();
    });
  }

  // Колбэк после прилёта блюда/колы. Если у этого клиента всё закрыто — он уходит.
  onDeliveryComplete(buyer) {
    if (!buyer) return;
    // Логическая проверка дублируется визуальной (count в tooltip-иконах
    // декрементится в Dish/Cola.flyToTooltip). Используем логическую.
    if (this.isBuyerOrderComplete(buyer)) {
      this.emitCoinsForSlot(buyer.slotIndex);
      this.releaseSlot(buyer);
    }
  }

  // ---------- Конфиг сценариев ----------

  getDefaultConfig(config) {
    return Object.assign(super.getDefaultConfig(config), {
      scenarios: {
        main: [
          Rewards.call("setupComponents"),

          // Звук по умолчанию выключен (удобно для разработки/превью —
          // пользователь сможет включить через ButtonMute).
          () => {
            try {
              const s = window.application && window.application.sound;
              if (s && !s.context.muted && s.toggleMuteAll) s.toggleMuteAll();
              if (window.application) window.application.soundMuted = true;
            } catch (e) {}
          },

          () => {
            // Стартовый каскад: 3 клиента появляются с лёгкой задержкой.
            this.spawnBuyerInSlot(0, true);
            setTimeout(() => this.spawnBuyerInSlot(1, true), 250);
            setTimeout(() => this.spawnBuyerInSlot(2, true), 500);
          },
          Rewards.wait(900),
          Rewards.call("updateMeatInteractive"),
          () => this.updateTutorial(),
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

        addCola: [
          Rewards.call("pauseTutorial"),
          Rewards.if(
            (cola) => this.prepareColaFlight(cola),
            Rewards.startScenario([
              Rewards.onTarget(
                (cola) => cola,
                Rewards.callNonInstant("flyToTooltip")
              ),
              Rewards.withArgs(
                (cola) => cola && cola._targetBuyer,
                Rewards.call("onDeliveryComplete")
              ),
              () => this.updateTutorial(),
            ]),
            // Нет клиента, заказавшего колу — улетит в "ничей" tooltip и
            // покажет крестики (логика falseCola).
            Rewards.startScenario([
              Rewards.onTarget(
                (cola) => cola,
                Rewards.callNonInstant("flyToTooltip")
              ),
              () => this.updateTutorial(),
            ])
          ),
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
              Rewards.withArgs(
                (dish) => dish,
                Rewards.call("removeDishFromCurrent")
              ),
              Rewards.withArgs(
                (dish) => dish && dish._targetBuyer,
                Rewards.call("onDeliveryComplete")
              ),
              () => this.updateTutorial(),
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
            () => {
              // Сердить любого активного клиента — будут все.
              this.getActiveBuyers().forEach((b) => {
                if (
                  b.character.spine.view.state.getCurrent(0).animation.name !=
                  CHARACTER_ANIMATIONS.happy
                ) {
                  b.character.setAnimation(CHARACTER_ANIMATIONS.angry, false);
                  b.character.addAnimation(CHARACTER_ANIMATIONS.idle, true);
                }
              });
              if (window.application && window.application.sound) {
                try {
                  window.application.sound.play("male_angry");
                } catch (e) {}
              }
            },
            () => this.updateTutorial(),
          ]),
        },

        {
          t: Triggers.onEvent(EVENTS.falseCola),
          r: Rewards.startScenario([
            () => {
              this.getActiveBuyers().forEach((b) => {
                if (
                  b.character.spine.view.state.getCurrent(0).animation.name !=
                  CHARACTER_ANIMATIONS.happy
                ) {
                  b.character.setAnimation(CHARACTER_ANIMATIONS.angry, false);
                  b.character.addAnimation(CHARACTER_ANIMATIONS.idle, true);
                }
              });
              if (window.application && window.application.sound) {
                try {
                  window.application.sound.play("female_angry");
                } catch (e) {}
              }
            },
            () => this.updateTutorial(),
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
