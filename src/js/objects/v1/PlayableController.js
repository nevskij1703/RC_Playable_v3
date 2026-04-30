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

const SLOT_CHARACTERS = ["italian_man", "pretty_woman", "old_grambler"];
const SLOT_TOOLTIPS = [OBJECTS.tooltip1, OBJECTS.tooltip2, OBJECTS.tooltip3];

// Цены ингредиентов: лепёшка автоматически добавляется к каждому шаверма-блюду.
const PRICES = {
  tortilla: 3,
  meat: 5,
  tomato: 2,
  fry: 3,
  cucumbers: 4,
  cola: 5,
};

function dishPrice(dish) {
  if (dish.cola) return PRICES.cola;
  // shaverma: tortilla (база) + сумма ингредиентов
  let sum = PRICES.tortilla;
  for (const p of dish.products) sum += PRICES[p] || 0;
  return sum;
}

// Меню: 4 шавермы + кола. Все блюда в единственном экземпляре в заказе
// (никаких stack'ов). У клиента в order может быть до 3 таких блюд.
export const DISH_TEMPLATES = [
  {
    products: [OBJECTS.cola],
    cola: true,
    tutorialSteps: [{ object: OBJECTS.cola }],
  },
  {
    products: [PRODUCTS_TYPES.meat],
    tutorialSteps: [
      { object: OBJECTS.tortilla },
      { object: OBJECTS.grill },
      { object: OBJECTS.meat },
      { object: "dish" },
    ],
  },
  {
    products: [PRODUCTS_TYPES.meat, PRODUCTS_TYPES.cucumbers],
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

// Compatibility (старые импорты).
export const ORDER_TEMPLATES = DISH_TEMPLATES;
export const ORDERS_LIST = DISH_TEMPLATES;
export const BUYERS_LIST = SLOT_CHARACTERS.map((name) => ({ name }));

// Канонический ключ блюда — отсортированный список продуктов через "+".
export function dishKeyForProducts(products) {
  return products.slice().sort().join("+");
}

// Ключ из visible-полей в icon container (используется при выдаче собранного
// dish для матчинга со slot.products).
export function dishKeyFromIconView(iconView) {
  if (!iconView || !iconView.children) return "";
  const names = iconView.children
    .filter(
      (c) =>
        c.visible &&
        c.baseObject &&
        ["meat", "cucumbers", "tomato", "fry", "cola"].includes(
          c.baseObject.name
        )
    )
    .map((c) => c.baseObject.name);
  return names.sort().join("+");
}

export default class PlayableController extends BaseObject {
  setupComponents() {
    this.tutorial = new Tutorial(ObjectLinks.get(OBJECTS.tutorialFinger));

    this.emptyDishes = [OBJECTS.dish1, OBJECTS.dish2, OBJECTS.dish3];
    this.currentDishes = [];
    this.completedDishesCount = 0;
    this.buyersContainer = ObjectLinks.get(OBJECTS.buyers);
    this.cola = ObjectLinks.get(OBJECTS.cola);

    this.activeBuyers = [null, null, null];
    this.totalServed = 0;
    this.totalSpawned = 0;
    this.spawningSlots = new Set();

    // Пре-генерируем заказы для всех TOTAL_BUYERS — фиксируем сюжет уровня.
    // spawnBuyerInSlot берёт заказ из очереди по индексу this.totalSpawned.
    this.preGeneratedOrders = [];
    for (let i = 0; i < TOTAL_BUYERS; i++) {
      this.preGeneratedOrders.push(this.generateRandomOrder());
    }

    // HUD: общее количество клиентов уровня. Целевая сумма монет НЕ
    // сообщается игроку — счётчик просто накапливает.
    const hud = ObjectLinks.get(OBJECTS.hudPanel);
    if (hud) hud.setTotal(TOTAL_BUYERS);

    // Все пулы монет летят к HUD-панели и стартуют из тултипа клиента
    // (бабл с заказом). Каждому слоту — свой пул со своим source.
    ParticleEmitter.createPools({
      startSize: 100,
      poolAdditionalSize: 25,
      coin1: {
        class: Particle,
        image: "ui/coin_reward",
        flyTime: 600,
        container: OBJECTS.coins,
        source: OBJECTS.tooltip1,
        destination: OBJECTS.hudPanel,
      },
      coin2: {
        class: Particle,
        image: "ui/coin_reward",
        flyTime: 600,
        container: OBJECTS.coins,
        source: OBJECTS.tooltip2,
        destination: OBJECTS.hudPanel,
      },
      coin3: {
        class: Particle,
        image: "ui/coin_reward",
        flyTime: 600,
        container: OBJECTS.coins,
        source: OBJECTS.tooltip3,
        destination: OBJECTS.hudPanel,
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

  generateRandomOrder() {
    const dishCount = 1 + Math.floor(Math.random() * 3);
    const dishes = [];
    for (let i = 0; i < dishCount; i++) {
      const t = DISH_TEMPLATES[Math.floor(Math.random() * DISH_TEMPLATES.length)];
      dishes.push({
        products: t.products.slice(),
        dishKey: dishKeyForProducts(t.products),
        cola: !!t.cola,
        tutorialSteps: t.tutorialSteps.slice(),
        complete: false,
        slotRef: null, // PIXI slot view binding
      });
    }
    return dishes;
  }

  hasMoreBuyers() {
    return this.totalSpawned < TOTAL_BUYERS;
  }

  spawnBuyerInSlot(slotIndex, isInitial = false) {
    if (!this.hasMoreBuyers()) return;
    if (this.activeBuyers[slotIndex]) return;
    if (this.spawningSlots.has(slotIndex)) return;

    this.spawningSlots.add(slotIndex);

    const characterName = SLOT_CHARACTERS[slotIndex];
    const character = this.buyersContainer[characterName];
    const tooltip = ObjectLinks.get(SLOT_TOOLTIPS[slotIndex]);
    // Берём заранее сгенерированный заказ (см. setupComponents).
    const dishes =
      (this.preGeneratedOrders && this.preGeneratedOrders[this.totalSpawned]) ||
      this.generateRandomOrder();

    tooltip.resetForReuse();
    tooltip.updateIcons(0);

    // Равномерное распределение слотов в бабле (увеличен под иконки 0.75x).
    const Y_LAYOUT = {
      1: [175],
      2: [110, 245],
      3: [70, 175, 280],
    };
    const ys = Y_LAYOUT[dishes.length] || [175];

    const orderGroup = tooltip.container.icons.children.find((c) => c.visible);
    if (orderGroup && orderGroup.children) {
      dishes.forEach((dish, i) => {
        const slot = orderGroup.children[i];
        if (slot && slot.baseObject && slot.baseObject.setProducts) {
          slot.baseObject.setProducts(dish.products);
          slot.position.y = ys[i];
          dish.slotRef = slot.baseObject;
        }
      });
    }

    const buyer = {
      slotIndex,
      characterName,
      character,
      tooltip,
      dishes,
      tutorialDishIndex: 0,
      tutorialStepIndex: 0,
      complete: false,
    };

    this.activeBuyers[slotIndex] = buyer;
    this.totalSpawned++;

    this.animateCharacterIn(buyer, isInitial);

    // Состав открытых заказов изменился — пересчитать кликабельность
    // ингредиентов (новый клиент мог разблокировать какой-то топинг).
    this.updateProductsInteractive();
    this.updateTortillaInteractive();
  }

  animateCharacterIn(buyer, isInitial) {
    const { character, tooltip } = buyer;

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

    setTimeout(
      () => {
        if (this.activeBuyers[buyer.slotIndex] === buyer) {
          tooltip.show();
        }
        this.spawningSlots.delete(buyer.slotIndex);
      },
      isInitial ? 600 : 500
    );

    setTimeout(
      () => {
        if (this.activeBuyers[buyer.slotIndex] === buyer) {
          this.updateTutorial();
        }
      },
      isInitial ? 800 : 700
    );
  }

  releaseSlot(buyer) {
    const slotIndex = buyer.slotIndex;
    if (this.activeBuyers[slotIndex] !== buyer) return;

    this.activeBuyers[slotIndex] = null;
    this.totalServed++;
    buyer.complete = true;

    const character = buyer.character;
    const tooltip = buyer.tooltip;

    character.setAnimation(CHARACTER_ANIMATIONS.happy, false);
    character.addAnimation(CHARACTER_ANIMATIONS.idle, true);

    setTimeout(() => {
      character.animations.moveOut.reset().start();
      setTimeout(() => {
        character.animations.hide.reset().start();
      }, TIMINGS.characterMoveOut * 0.4);

      tooltip.hide();
      // Монетки вылетают из бабла клиента сразу после его исчезновения.
      this.emitCoinsForSlot(slotIndex, buyer);
    }, 800);

    // Сразу после ухода — пересчёт интерактивов: возможно, какой-то топинг
    // больше не нужен и должен быть locked.
    this.updateProductsInteractive();

    setTimeout(() => {
      this.spawnBuyerInSlot(slotIndex, false);
      this.updateTutorial();
    }, 800 + TIMINGS.characterMoveOut + SPAWN_DELAY_MS);
  }

  // ---------- Lookup утилиты ----------

  getActiveBuyers() {
    return this.activeBuyers.filter((b) => b !== null);
  }

  // Все открытые dish-elements (по всем активным клиентам).
  getOpenDishes() {
    const open = [];
    for (const buyer of this.activeBuyers) {
      if (!buyer) continue;
      for (const dish of buyer.dishes) {
        if (!dish.complete) open.push({ buyer, dish });
      }
    }
    return open;
  }

  getPrimaryBuyer() {
    return this.activeBuyers.find(
      (b) => b !== null && b.dishes.some((d) => !d.complete)
    );
  }

  // Случайный клиент с открытым dish того же ключа.
  findBuyerForDishKey(dishKey) {
    const matches = [];
    for (const buyer of this.activeBuyers) {
      if (!buyer || buyer.complete) continue;
      const dish = buyer.dishes.find(
        (d) => !d.complete && d.dishKey === dishKey
      );
      if (dish) matches.push({ buyer, dish });
    }
    if (!matches.length) return null;
    return matches[Math.floor(Math.random() * matches.length)];
  }

  findBuyerForCola() {
    return this.findBuyerForDishKey(dishKeyForProducts([OBJECTS.cola]));
  }

  // ---------- Smart cooking (perfect-matching gate) ----------
  //
  // Жёсткий инвариант: множество тарелок-в-работе (`currentDishes`) обязано
  // допускать ИДЕАЛЬНОЕ распределение по открытым «не-cola» заказам — каждой
  // тарелке свой distinct заказ, и её visible-ингредиенты ⊆ products заказа.
  //
  // Любое действие, увеличивающее supply (addTortilla / положить ингредиент),
  // допускается ТОЛЬКО если результирующее состояние тоже допускает идеальное
  // распределение. Над-сборка (3 шавермы при 2 заказах) невозможна по
  // построению — gate отвергнет лишнюю тортилью или ингредиент.
  //
  // Реализация: backtracking bipartite matching. supply ≤ 3, demand ≤ 9 —
  // мгновенно.

  // Visible ингредиенты на тарелке (без plate/pita).
  visibleIngredients(dish) {
    const keys = ["meat", "tomato", "cucumbers", "fry"];
    return keys.filter((k) => dish[k] && dish[k].visible);
  }

  // Открытые «не-cola» заказы по всем активным клиентам.
  openMealBuyerDishes() {
    const out = [];
    for (const buyer of this.activeBuyers) {
      if (!buyer) continue;
      for (const d of buyer.dishes) {
        if (d.complete || d.cola) continue;
        out.push({ buyer, buyerDish: d });
      }
    }
    return out;
  }

  // Идеальное соответствие: каждой supply[i] свой distinct demand[j]
  // такой, что supply[i] ⊆ demand[j]. Backtracking.
  _canMatch(supply, demand) {
    if (supply.length > demand.length) return false;
    const used = new Array(demand.length).fill(false);
    const fits = (sIdx, dIdx) =>
      supply[sIdx].every((p) => demand[dIdx].includes(p));
    const rec = (i) => {
      if (i >= supply.length) return true;
      for (let j = 0; j < demand.length; j++) {
        if (used[j] || !fits(i, j)) continue;
        used[j] = true;
        if (rec(i + 1)) return true;
        used[j] = false;
      }
      return false;
    };
    return rec(0);
  }

  _currentSupply() {
    return this.currentDishes
      .filter((d) => d.visible)
      .map((d) => this.visibleIngredients(d));
  }

  _currentDemand() {
    return this.openMealBuyerDishes().map(
      ({ buyerDish }) => buyerDish.products
    );
  }

  // Лепёшку (новую пустую тарелку) можно положить, только если matching
  // ещё допустим после добавления.
  canTapTortilla() {
    if (this.emptyDishes.length === 0) return false;
    const supply = this._currentSupply();
    supply.push([]); // гипотетическая пустая тарелка
    return this._canMatch(supply, this._currentDemand());
  }

  // Возвращает тарелку, на которую можно положить linkID
  // (meat/tomato/cucumbers/fry) с сохранением matching-инварианта; или null.
  // Из нескольких валидных предпочитает наиболее «достроенную» (greedy:
  // сначала закрыть начатую — короче TTR заказа).
  _pickPlateForIngredient(linkID) {
    const candidates = this.currentDishes.filter(
      (d) => d.visible && (!d[linkID] || !d[linkID].visible)
    );
    if (!candidates.length) return null;

    const baseSupply = this.currentDishes.map((d) => ({
      dish: d,
      ings: this.visibleIngredients(d),
    }));
    const demand = this._currentDemand();

    candidates.sort(
      (a, b) =>
        this.visibleIngredients(b).length - this.visibleIngredients(a).length
    );
    for (const c of candidates) {
      const supply = baseSupply.map(({ dish, ings }) => {
        if (dish !== c) return ings;
        return ings.includes(linkID) ? ings : [...ings, linkID];
      });
      if (this._canMatch(supply, demand)) return c;
    }
    return null;
  }

  // Можно ли тапнуть ингредиент (meat / tomato / cucumbers / fry).
  canAddIngredient(linkID) {
    return !!this._pickPlateForIngredient(linkID);
  }

  // Cola — отдельный путь (тарелки не задействованы).
  canTapCola() {
    return !!this.findBuyerForCola();
  }

  // Готовое блюдо: матчим dishKey ровно с открытым заказом.
  canTapDish(dish) {
    const dishKey = dishKeyFromIconView(dish);
    if (!dishKey) return false;
    return !!this.findBuyerForDishKey(dishKey);
  }

  // Тарелка ещё «достраиваема»: её ингредиенты — подмножество какого-то
  // открытого заказа. Используется как fallback в putDish: если dishKey не
  // совпал ни с одним заказом точно, но тарелка достраиваема — bounce+cross
  // (не сбрасываем). С matching-gate стрянутые состояния по построению не
  // возникают, проверка остаётся defensive.
  isDishStillBuildable(dish) {
    const ings = this.visibleIngredients(dish);
    if (!ings.length) return true;
    const open = this.openMealBuyerDishes();
    return open.some(({ buyerDish }) =>
      ings.every((i) => buyerDish.products.includes(i))
    );
  }

  // ---------- Cross-popup в точке тапа ----------

  showCrossAtFood(food) {
    try {
      const cross = ObjectLinks.get(OBJECTS.crossPopup);
      if (!cross || !cross.view) return;
      const tapPoint = food.getTapTutorialPoint
        ? food.getTapTutorialPoint()
        : food;
      const view = tapPoint && tapPoint.view ? tapPoint.view : food.view;
      if (!view) return;
      const globalPos = view.getGlobalPosition();
      const local = cross.view.parent.toLocal(globalPos);
      cross.view.position.set(local.x, local.y);
      if (cross.scenarios && cross.scenarios.popup) {
        cross.scenarios.popup.reset && cross.scenarios.popup.reset();
        cross.scenarios.popup.start && cross.scenarios.popup.start();
      } else {
        cross.show();
        setTimeout(() => cross.hide && cross.hide(), 500);
      }
    } catch (e) {}
  }

  // ---------- Привязка dish/cola к клиенту перед полётом ----------

  // Возвращает true и проставляет _targetTooltip/_targetBuyer/_targetDish,
  // если есть подходящий клиент. Иначе false.
  prepareDishFlight(dish) {
    const dishKey = dishKeyFromIconView(dish);
    const match = this.findBuyerForDishKey(dishKey);
    if (!match) return false;
    dish._targetTooltip = match.buyer.tooltip;
    dish._targetBuyer = match.buyer;
    dish._targetDish = match.dish;
    return true;
  }

  prepareColaFlight(cola) {
    const match = this.findBuyerForCola();
    if (!match) return false;
    cola._targetTooltip = match.buyer.tooltip;
    cola._targetBuyer = match.buyer;
    cola._targetDish = match.dish;
    return true;
  }

  // ---------- Tutorial ----------

  updateTutorial() {
    const buyer = this.getPrimaryBuyer();
    if (!buyer) {
      this.stopTutorial();
      return;
    }
    const firstDish = buyer.dishes.find((d) => !d.complete);
    if (!firstDish) {
      this.stopTutorial();
      return;
    }
    buyer.tutorialDish = firstDish;
    buyer.currentTutorialStep = firstDish.tutorialSteps[0];

    this.tutorialOrder = firstDish;
    this.currentTutorialStep = buyer.currentTutorialStep;

    if (!this.currentTutorialStep) {
      this.stopTutorial();
      return;
    }

    if (!this.emptyDishes.length && this.currentTutorialStep.object !== "cola") {
      this.currentTutorialStep = { object: "dish" };
    }

    const target =
      this.currentTutorialStep.object == "dish"
        ? this.getActiveDish()
        : this.currentTutorialStep.object == "pan"
        ? this.getActivePan()
        : this.currentTutorialStep.object == "cola"
        ? this.getVisibleCola()
        : ObjectLinks.get(this.currentTutorialStep.object);

    if (!target) {
      // Невозможно показать tutorial-step (объект скрыт/уничтожен): тихо
      // не падаем, просто откладываем подсказку.
      this.stopTutorial();
      return;
    }

    this.tutorial.startTutorialTap({
      target,
      delay: TUTORIAL_DELAY_FOR_NEW_PRODUCT,
    });
  }

  resumeTutorial() {
    if (!this.currentTutorialStep) return;
    const target =
      this.currentTutorialStep.object == "dish"
        ? this.getActiveDish()
        : this.currentTutorialStep.object == "pan"
        ? this.getActivePan()
        : this.currentTutorialStep.object == "cola"
        ? this.getVisibleCola()
        : ObjectLinks.get(this.currentTutorialStep.object);
    if (!target) {
      this.stopTutorial();
      return;
    }
    const delay =
      this.currentTutorialStep.delay !== undefined
        ? this.currentTutorialStep.delay
        : TUTORIAL_DELAY_FOR_NEW_PRODUCT;
    this.tutorial.startTutorialTap({ target, delay });
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

      if (!buyer.tutorialDish || buyer.tutorialDish.complete) {
        this.updateTutorial();
        return;
      }

      const tutorialSteps = buyer.tutorialDish.tutorialSteps;
      const nextIdx = tutorialSteps.indexOf(step) + 1;
      buyer.currentTutorialStep = tutorialSteps[nextIdx];
      this.currentTutorialStep = buyer.currentTutorialStep;

      if (buyer.currentTutorialStep) this.resumeTutorial();
      else this.stopTutorial();
    } else {
      this.tutorial.stopTutorial();
    }
  }

  // ---------- Dishes utilities ----------

  lockDishes() {
    ObjectLinks.get(OBJECTS.dish1).updateInteractive("auto");
    ObjectLinks.get(OBJECTS.dish2).updateInteractive("auto");
    ObjectLinks.get(OBJECTS.dish3).updateInteractive("auto");
  }

  unlockDishes() {
    this.currentDishes.forEach((dish) => dish.updateInteractive("dynamic"));
  }

  // Топинги всегда оставляем кликабельными — smart-cooking gate работает
  // в момент тапа в сценарии `addFood`, где проверяется canPickTopping и
  // показывается cross при отказе. Полагаться на закешированный lock-state
  // оказалось хрупко (рассинхрон при быстрых тапах / спавнах клиентов).
  updateProductsInteractive() {
    [PRODUCTS_TYPES.tomato, PRODUCTS_TYPES.cucumbers, PRODUCTS_TYPES.fry].forEach(
      (topping) => {
        const obj = ObjectLinks.get(topping);
        if (obj) obj.updateInteractive("dynamic");
      }
    );
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
    ObjectLinks.get(OBJECTS.tortilla).updateInteractive(
      this.canTapTortilla() ? "dynamic" : "auto"
    );
  }

  addProductToDish(product) {
    const linkID = product.config.linkID;
    // Выбор тарелки через тот же matching-gate, что отработал в
    // canAddIngredient — никакой расхождения «пропустили / не нашли».
    const target = this._pickPlateForIngredient(linkID);
    if (!target) return;

    target[linkID].scenarios.show.reset().start();
    target.updateFakeDish(linkID);

    if (linkID == OBJECTS.meat) {
      const meat = ObjectLinks.get(OBJECTS.meat);
      let usedMeat;
      if (meat.meat3.visible) usedMeat = meat.meat3;
      else if (meat.meat2.visible) usedMeat = meat.meat2;
      else if (meat.meat1.visible) usedMeat = meat.meat1;
      usedMeat && usedMeat.hide();
    }
  }

  getEmptyDish() {
    let dish = this.emptyDishes.pop();
    this.currentDishes.push(ObjectLinks.get(dish));
    this.currentDishes.sort((d1, d2) => {
      if (d1.config.linkID < d2.config.linkID) return -1;
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
    this.cola.children.sort((a, b) =>
      a.baseObject.config.linkID < b.baseObject.config.linkID ? 1 : -1
    );
    this.cola.children.forEach((drink) => {
      !drink.baseObject.visible && drink.baseObject.show();
    });
  }

  // Если на столе кол не осталось — пополняем все 3. Так пользователь не
  // упирается в пустую полку: визуально cola «бесконечная», логически
  // ограничивает только наличие заказов.
  maybeRefillCola() {
    const visible = this.cola.children.filter((c) => c.visible).length;
    if (visible === 0) {
      this.showDrinks();
    }
  }

  emitCoinsForSlot(slotIndex, buyer) {
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

    // HUD: считаем стоимость заказа клиента и тикаем счётчики.
    // Прибавление синхронизировано с прилётом монеток (≈ flyTime).
    const hud = ObjectLinks.get(OBJECTS.hudPanel);
    if (hud && buyer) {
      let sum = 0;
      for (const d of buyer.dishes) sum += dishPrice(d);
      hud.addClient();
      setTimeout(() => hud.addCoins(sum), 480);
    }
  }

  // Вызывается после прилёта блюда/колы.
  // dish._targetDish — ссылка на dish-record клиента.
  onDeliveryComplete(buyer) {
    if (!buyer) return;
    if (buyer.dishes.every((d) => d.complete)) {
      // Последний клиент игры → переход в стор.
      if (
        !this.hasMoreBuyers() &&
        this.getActiveBuyers().length === 1 &&
        this.getActiveBuyers()[0] === buyer
      ) {
        this.activeBuyers[buyer.slotIndex] = null;
        this.totalServed++;
        buyer.complete = true;
        // moveOut
        const character = buyer.character;
        character.setAnimation(CHARACTER_ANIMATIONS.happy, false);
        character.addAnimation(CHARACTER_ANIMATIONS.idle, true);
        setTimeout(() => {
          buyer.tooltip.hide();
          // Монетки вылетают сразу после исчезновения бабла последнего клиента.
          this.emitCoinsForSlot(buyer.slotIndex, buyer);
          this.triggerStore();
        }, 600);
        return;
      }
      // releaseSlot сам эмитит монетки в момент tooltip.hide().
      this.releaseSlot(buyer);
    }
  }

  triggerStore() {
    const misclickArea = ObjectLinks.get(OBJECTS.misclickArea);
    const nextLevelMisclick = ObjectLinks.get(OBJECTS.nextLevelMisclick);
    if (window.is_adwords || window.is_unity) {
      if (
        nextLevelMisclick &&
        nextLevelMisclick.scenarios &&
        nextLevelMisclick.scenarios.play
      ) {
        nextLevelMisclick.scenarios.play.reset &&
          nextLevelMisclick.scenarios.play.reset();
        nextLevelMisclick.scenarios.play.start &&
          nextLevelMisclick.scenarios.play.start();
      }
    } else if (misclickArea && misclickArea.show) {
      misclickArea.show();
    }
  }

  // Для совместимости: проверка валидности dish, проставка targets и
  // помечание dish-record клиента complete=true (визуально showCheck сделает
  // сам в Dish.flyToTooltip onComplete).
  checkDish(dish) {
    if (!this.prepareDishFlight(dish)) return undefined;
    // Помечаем dish клиента complete=true заранее, чтобы повторные
    // конкурентные тапы не ложились на тот же slot.
    if (dish._targetDish) dish._targetDish.complete = true;
    return dish._targetDish;
  }

  checkCola() {
    return !!this.findBuyerForCola();
  }

  // Для cola flow (addCola сценарий).
  prepareColaAndMark(cola) {
    if (!this.prepareColaFlight(cola)) return false;
    if (cola._targetDish) cola._targetDish.complete = true;
    return true;
  }

  // ---------- Конфиг сценариев ----------

  getDefaultConfig(config) {
    return Object.assign(super.getDefaultConfig(config), {
      scenarios: {
        main: [
          Rewards.call("setupComponents"),

          () => {
            try {
              const s = window.application && window.application.sound;
              if (s && !s.context.muted && s.toggleMuteAll) s.toggleMuteAll();
              if (window.application) window.application.soundMuted = true;
            } catch (e) {}
          },

          () => {
            this.spawnBuyerInSlot(0, true);
            setTimeout(() => this.spawnBuyerInSlot(1, true), 250);
            setTimeout(() => this.spawnBuyerInSlot(2, true), 500);
          },
          Rewards.wait(900),
          Rewards.call("updateMeatInteractive"),
          () => this.updateTutorial(),
        ],

        // Главный gate: проверяем тип food и smart-cooking.
        addFood: [
          Rewards.playSound("tap"),
          Rewards.if(
            (food) => food instanceof Cola,
            // Cola
            Rewards.if(
              () => this.canTapCola(),
              Rewards.startScenarioInstant("addCola"),
              Rewards.startScenario([
                Rewards.withArgs(
                  (food) => food,
                  Rewards.call("showCrossAtFood")
                ),
              ])
            ),
            Rewards.if(
              (food) => food instanceof Tortilla,
              // Tortilla — пропускаем, только если matching ещё допустим.
              Rewards.if(
                () => this.canTapTortilla(),
                Rewards.startScenarioInstant("addTortilla"),
                Rewards.startScenario([
                  Rewards.withArgs(
                    (food) => food,
                    Rewards.call("showCrossAtFood")
                  ),
                ])
              ),
              // meat / tomato / cucumbers / fry — единый matching-gate.
              Rewards.if(
                (food) => this.canAddIngredient(food.config.linkID),
                Rewards.startScenario([
                  Rewards.withArgs(
                    (food) => food,
                    Rewards.call("addProductToDish")
                  ),
                  Rewards.call("updateProductsInteractive"),
                  Rewards.call("updateTortillaInteractive"),
                  Rewards.call("updateMeatInteractive"),
                  Rewards.call("nextTutorialStep"),
                ]),
                Rewards.startScenario([
                  Rewards.withArgs(
                    (food) => food,
                    Rewards.call("showCrossAtFood")
                  ),
                ])
              )
            )
          ),
        ],

        addCola: [
          Rewards.call("pauseTutorial"),
          Rewards.if(
            (cola) => this.prepareColaAndMark(cola),
            Rewards.startScenario([
              Rewards.onTarget(
                (cola) => cola,
                Rewards.callNonInstant("flyToTooltip")
              ),
              Rewards.withArgs(
                (cola) => cola && cola._targetBuyer,
                Rewards.call("onDeliveryComplete")
              ),
              Rewards.call("maybeRefillCola"),
              () => this.updateTutorial(),
            ]),
            Rewards.startScenario([
              Rewards.withArgs(
                (cola) => cola,
                Rewards.call("showCrossAtFood")
              ),
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
              Rewards.call("updateTortillaInteractive"),
              Rewards.call("updateProductsInteractive"),
              () => this.updateTutorial(),
            ]),
            Rewards.if(
              (dish) => this.isDishStillBuildable(dish),
              // «Недостроенная» тарелка — её ингредиенты ещё подмножество
              // какого-то открытого заказа. Не очищаем: только баунс +
              // красный крестик, чтобы игрок понял "ещё не готово".
              Rewards.startScenario([
                Rewards.withArgs(
                  (dish) => dish,
                  Rewards.call("showCrossAtFood")
                ),
                Rewards.onTarget(
                  (dish) => dish,
                  Rewards.startScenarioInstant("bounce")
                ),
                Rewards.onTarget(
                  (dish) => dish,
                  Rewards.call("updateInteractive", "dynamic")
                ),
              ]),
              // «Застрявшая» сборка — никто не сможет принять её.
              // Очищаем и возвращаем slot в пул.
              Rewards.startScenario([
                Rewards.withArgs(
                  (dish) => dish,
                  Rewards.call("showCrossAtFood")
                ),
                Rewards.withArgs((dish) => dish, Rewards.call("setDishEmpty")),
                Rewards.withArgs(
                  (dish) => dish,
                  Rewards.call("removeDishFromCurrent")
                ),
                Rewards.call("updateTortillaInteractive"),
                Rewards.call("updateProductsInteractive"),
                () => this.updateTutorial(),
              ])
            )
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
