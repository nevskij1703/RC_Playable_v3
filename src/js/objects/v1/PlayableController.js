import {
  APPLICATION_EVENTS,
  Animation,
  Animations,
  BaseObject,
  Easing,
  ObjectLinks,
  PIXI,
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
import EditorTool from "../EditorTool";
import createLockBadge from "../../displayObjects/ui/LockBadge";

const TUTORIAL_DELAY_FOR_NEW_PRODUCT = 2000;
const SPAWN_DELAY_MS = 600;

// ---------- Runtime-настройки (правятся через cheats UI) ----------
// Хранятся в localStorage; все константы баланса (число клиентов, размер
// заказа, цены) читаются отсюда, чтобы можно было крутить без правки кода.
export const RCP_SETTINGS_KEY = "rcp_runtime_settings_v1";
export const RCP_SETTINGS_DEFAULTS = {
  totalBuyers: 20,
  slotCount: 3,
  maxDishesPerOrder: 3,
  upgradeInterval: 3,
  prices: {
    tortilla: 3,
    meat: 5,
    tomato: 2,
    fry: 3,
    cucumbers: 4,
    cola: 5,
  },
};

function _clampInt(v, min, max, fallback) {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export function loadRcpSettings() {
  let stored = {};
  try {
    const raw = localStorage.getItem(RCP_SETTINGS_KEY);
    if (raw) stored = JSON.parse(raw) || {};
  } catch (e) {}
  const d = RCP_SETTINGS_DEFAULTS;
  const prices = { ...d.prices };
  if (stored.prices && typeof stored.prices === "object") {
    for (const k of Object.keys(d.prices)) {
      const v = parseInt(stored.prices[k], 10);
      if (Number.isFinite(v) && v >= 0) prices[k] = v;
    }
  }
  return {
    totalBuyers: _clampInt(stored.totalBuyers, 1, 999, d.totalBuyers),
    slotCount: _clampInt(stored.slotCount, 1, 3, d.slotCount),
    maxDishesPerOrder: _clampInt(stored.maxDishesPerOrder, 1, 3, d.maxDishesPerOrder),
    upgradeInterval: _clampInt(stored.upgradeInterval, 1, 99, d.upgradeInterval),
    prices,
  };
}

const RCP_SETTINGS = loadRcpSettings();
if (typeof window !== "undefined") window.__rcpSettings = RCP_SETTINGS;

const SLOT_COUNT = RCP_SETTINGS.slotCount;
export const TOTAL_BUYERS = RCP_SETTINGS.totalBuyers;

const SLOT_CHARACTERS = ["italian_man", "pretty_woman", "old_grambler"];
const SLOT_TOOLTIPS = [OBJECTS.tooltip1, OBJECTS.tooltip2, OBJECTS.tooltip3];

// ---------- Roguelike upgrade system ----------
// Игрок начинает с 1 тарелкой и 0 разблокированными топпингами; каждые 3
// обслуженных клиента (раунды на 3/6/9/12/15/18) получает выбор из 2-х
// апгрейдов. Категории: plate (1→3 max), topping (3 шт. — tomato/cucumbers/fry),
// income (per-ingredient +2 за тир, бесконечно).
const UPGRADE_INTERVAL = RCP_SETTINGS.upgradeInterval; // показ карточек после каждых N обслуженных
const MAX_PLATES = 3;
const TOPPING_KEYS = ["tomato", "cucumbers", "fry"]; // PRODUCTS_TYPES topping ingredients
const INCOME_KEYS = ["meat", "tomato", "cucumbers", "fry", "cola"];
const INCOME_STEP = 2; // монет добавляется к ингредиенту за каждую покупку

const TOPPING_LINK_BY_KEY = {
  tomato: OBJECTS.tomato,
  cucumbers: OBJECTS.cucumbers,
  fry: OBJECTS.fry,
};

// Иконки для карточек (берём из существующих ассетов).
const CARD_ICONS = {
  plate: "dish/plate",
  meat: "dish/meat_11",
  tomato: "dish/tomato_4",
  cucumbers: "dish/cucumber_10",
  fry: "dish/fry_10",
  cola: "ui/coin", // у Cola нет отдельного icon-asset, используем монету как заместитель
};

const PRODUCT_LABELS = {
  plate: "Тарелка",
  meat: "Мясо",
  tomato: "Помидоры",
  cucumbers: "Огурцы",
  fry: "Картошка",
  cola: "Кола",
};

// Цены ингредиентов: лепёшка автоматически добавляется к каждому шаверма-блюду.
// Значения берутся из runtime-настроек (правятся через cheats UI).
const PRICES = RCP_SETTINGS.prices;

function dishPrice(dish, boosts) {
  const b = boosts || {};
  if (dish.cola) return PRICES.cola + (b.cola || 0);
  // shaverma: tortilla (база) + сумма ингредиентов с бустами
  let sum = PRICES.tortilla;
  for (const p of dish.products) sum += (PRICES[p] || 0) + (b[p] || 0);
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

    // ---------- Roguelike state ----------
    // Стартуем с 1 тарелкой; dish2/dish3 заблокированы пока игрок не
    // купит апгрейд. Топпинги (tomato/cucumbers/fry) тоже стартуют
    // заблокированными — игрок может готовить только meat-шаверму и колу.
    this.unlockedPlateCount = 1;
    this.lockedDishes = [OBJECTS.dish2, OBJECTS.dish3];
    this.emptyDishes = [OBJECTS.dish1];

    this.unlockedToppings = new Set();
    this.incomeBoosts = { meat: 0, tomato: 0, cucumbers: 0, fry: 0, cola: 0 };
    this.upgradeRoundIndex = 0;
    this.upgradeOverlayActive = false;
    // Очередь pending-апгрейдов: если игрок успел закрыть несколько
    // «апгрейдных» интервалов до того, как предыдущий overlay был
    // выбран, копим их и показываем по одному после каждого закрытия.
    this._pendingUpgrades = 0;

    this.currentDishes = [];
    this.completedDishesCount = 0;
    this.buyersContainer = ObjectLinks.get(OBJECTS.buyers);
    this.cola = ObjectLinks.get(OBJECTS.cola);

    this.activeBuyers = Array(SLOT_COUNT).fill(null);
    this.totalServed = 0;
    this.totalSpawned = 0;
    this.spawningSlots = new Set();
    this._storeTriggered = false;

    // Dev-хук: ссылка на контроллер из консоли (рядом с window.__rcpEditor),
    // используется в чит-инструментах и при отладке.
    if (typeof window !== "undefined") window.__rcpController = this;

    // Заказы генерируются lazy в spawnBuyerInSlot — состав DISH_TEMPLATES
    // зависит от unlockedToppings, который меняется во время раунда.
    // Pre-generation удалён: иначе заказ из начала уровня может содержать
    // топпинг, который будет разблокирован только в середине игры.

    this._setupLockedVisuals();

    // HUD: общее количество клиентов уровня. Целевая сумма монет НЕ
    // сообщается игроку — счётчик просто накапливает.
    const hud = ObjectLinks.get(OBJECTS.hudPanel);
    if (hud) hud.setTotal(TOTAL_BUYERS);

    // Editor tool: чит-кнопка + перемещение объектов мышью.
    // Создаётся при старте и применяет сохранённый layout (если есть).
    if (!window.__rcpEditor) {
      window.__rcpEditor = new EditorTool();
    }
    setTimeout(() => window.__rcpEditor.applyStoredLayout(), 200);

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

  generateRandomOrder(opts) {
    const strict = opts && opts.strictSolvable;
    // Если strictSolvable — оставляем только шаблоны, у которых каждый
    // продукт уже разблокирован (meat/cola всегда доступны).
    const pool = strict
      ? DISH_TEMPLATES.filter((t) => this._templateSolvable(t))
      : DISH_TEMPLATES;
    const safePool = pool.length ? pool : DISH_TEMPLATES;

    const dishCount = 1 + Math.floor(Math.random() * RCP_SETTINGS.maxDishesPerOrder);
    const dishes = [];
    for (let i = 0; i < dishCount; i++) {
      const t = safePool[Math.floor(Math.random() * safePool.length)];
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

  // Шаблон считается решаемым, если все его non-meat/non-cola продукты
  // разблокированы. Cola и meat доступны всегда.
  _templateSolvable(template) {
    return template.products.every((p) => {
      if (p === OBJECTS.cola || p === PRODUCTS_TYPES.meat) return true;
      return this.unlockedToppings.has(p);
    });
  }

  // Считает сколько уже-активных клиентов имеют решаемые заказы (все блюда —
  // в пределах разблокированных топпингов).
  _countSolvableActive(excludeSlot) {
    let n = 0;
    for (let i = 0; i < this.activeBuyers.length; i++) {
      if (i === excludeSlot) continue;
      const b = this.activeBuyers[i];
      if (!b) continue;
      // Pending-клиенты ещё не имеют заказа — считать их «решаемыми»
      // нельзя, иначе ослабится anti-deadlock инвариант.
      if (b.pendingOrder) continue;
      const ok = b.dishes.every((d) =>
        d.products.every((p) => {
          if (p === OBJECTS.cola || p === PRODUCTS_TYPES.meat) return true;
          return this.unlockedToppings.has(p);
        })
      );
      if (ok) n++;
    }
    return n;
  }

  // Anti-deadlock инвариант: на экране ВСЕГДА минимум 2 решаемых клиента.
  // Если уже ≥ 2 решаемых — новый клиент может быть с любым заказом.
  // Иначе — форсим strictSolvable, чтобы новый сразу был решаемым.
  pickOrderForSpawn(slotIndex) {
    const solvableElsewhere = this._countSolvableActive(slotIndex);
    const strict = solvableElsewhere < 2;
    return this.generateRandomOrder({ strictSolvable: strict });
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

    const buyer = {
      slotIndex,
      characterName,
      character,
      tooltip,
      dishes: [],
      tutorialDishIndex: 0,
      tutorialStepIndex: 0,
      complete: false,
      pendingOrder: false,
    };

    if (this.upgradeOverlayActive) {
      // Во время выбора апгрейда персонаж заходит на фон, но заказ ещё
      // не сгенерирован: его состав может зависеть от выбора игрока
      // (новый разблокированный топпинг). После hideUpgradeOverlay
      // мы вызовем _assignOrder() и покажем tooltip.
      buyer.pendingOrder = true;
      // Скрываем tooltip явно — он мог остаться видимым от предыдущего
      // клиента, иначе игрок увидел бы старые иконки.
      if (tooltip && typeof tooltip.hide === "function") tooltip.hide();
    } else {
      this._assignOrder(buyer);
    }

    this.activeBuyers[slotIndex] = buyer;
    this.totalSpawned++;

    this.animateCharacterIn(buyer, isInitial);

    if (!buyer.pendingOrder) {
      // Состав открытых заказов изменился — пересчитать кликабельность
      // ингредиентов (новый клиент мог разблокировать какой-то топинг).
      this.updateProductsInteractive();
      this.updateTortillaInteractive();
    }
  }

  // Генерируем заказ для buyer и заполняем его tooltip иконками блюд.
  // Лимит решаемости (anti-deadlock) учитывается через pickOrderForSpawn.
  _assignOrder(buyer) {
    const dishes = this.pickOrderForSpawn(buyer.slotIndex);
    buyer.dishes = dishes;

    const tooltip = buyer.tooltip;
    if (!tooltip) return;
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
        // Pending-клиенту tooltip покажем после закрытия overlay'я
        // (тогда же сгенерируется заказ).
        if (
          this.activeBuyers[buyer.slotIndex] === buyer &&
          !buyer.pendingOrder
        ) {
          tooltip.show();
        }
        this.spawningSlots.delete(buyer.slotIndex);
      },
      isInitial ? 600 : 500
    );

    setTimeout(
      () => {
        if (
          this.activeBuyers[buyer.slotIndex] === buyer &&
          !buyer.pendingOrder
        ) {
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

  // Лепёшку (новую пустую тарелку) можно положить, пока есть свободный
  // слот тарелки. База шавермы (лепёшка + мясо) общая для всех заказов —
  // её разрешено собирать впрок, независимо от текущего спроса.
  canTapTortilla() {
    return this.emptyDishes.length > 0;
  }

  // Возвращает тарелку, на которую можно положить linkID
  // (meat/tomato/cucumbers/fry); или null если ни одна тарелка не
  // подходит. Greedy: сначала достраиваем самую полную тарелку.
  //
  // Мясо — база любой шавермы, кладём свободно (matching-инвариант
  // неприменим: лепёшка+мясо валидны для каждого не-cola заказа).
  //
  // Для топпингов — локальная проверка: после добавления состав тарелки
  // должен оставаться ⊆ products какого-то открытого заказа. Это не даёт
  // собрать «химеру» (помидор+огурец+картошка), которой нет ни в одном
  // заказе. Глобальный matching-гейт supply↔demand сознательно НЕ
  // используем: он создавал тупики при «лишних» заготовках лепёшка+мясо.
  _pickPlateForIngredient(linkID) {
    const candidates = this.currentDishes.filter(
      (d) => d.visible && (!d[linkID] || !d[linkID].visible)
    );
    if (!candidates.length) return null;

    candidates.sort(
      (a, b) =>
        this.visibleIngredients(b).length - this.visibleIngredients(a).length
    );

    if (linkID === OBJECTS.meat) return candidates[0];

    const demand = this._currentDemand();
    for (const c of candidates) {
      const after = this.visibleIngredients(c).concat(
        this.visibleIngredients(c).includes(linkID) ? [] : [linkID]
      );
      const fitsAny = demand.some((products) =>
        after.every((p) => products.includes(p))
      );
      if (fitsAny) return c;
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

  // Топпинги, разблокированные через апгрейд, всегда кликабельны —
  // smart-cooking gate проверяет валидность в момент тапа. Заблокированные
  // (до соответствующего апгрейда) держим в auto, чтобы тап игнорировался.
  updateProductsInteractive() {
    [PRODUCTS_TYPES.tomato, PRODUCTS_TYPES.cucumbers, PRODUCTS_TYPES.fry].forEach(
      (topping) => {
        const obj = ObjectLinks.get(topping);
        if (!obj) return;
        if (this.unlockedToppings && !this.unlockedToppings.has(topping)) {
          obj.updateInteractive("auto");
        } else {
          obj.updateInteractive("dynamic");
        }
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
      for (const d of buyer.dishes) sum += dishPrice(d, this.incomeBoosts);
      hud.addClient();
      setTimeout(() => hud.addCoins(sum), 480);
    }

    // Триггер апгрейда: каждые UPGRADE_INTERVAL обслуженных, кроме самого
    // последнего клиента (после 20-го уходим в стор без апгрейда).
    // Через очередь, чтобы быстрые подряд закрытия не «съедали» апгрейды:
    // если предыдущий overlay ещё не закрыт — новый апгрейд встаёт в pending
    // и покажется автоматически после выбора текущего.
    setTimeout(() => {
      if (
        this.totalServed > 0 &&
        this.totalServed < TOTAL_BUYERS &&
        this.totalServed % UPGRADE_INTERVAL === 0
      ) {
        this._enqueueUpgrade();
      }
    }, 1100);
  }

  // ---------- Roguelike upgrades ----------

  // Setup стартовых визуалов: заблокированные тарелки и топпинги
  // полупрозрачны и помечены замком. Топпинги ещё и не реагируют на тап.
  // Бейджи и dim-плашки рисуются как siblings топпингов в table-view —
  // alpha-каскад от родителя не гасит их.
  _setupLockedVisuals() {
    this._lockBadges = []; // храним для удаления при апгрейде

    const tableObj = ObjectLinks.get(OBJECTS.table);
    if (!tableObj || !tableObj.view) return;

    // Тарелки 2 и 3: белые тарелки на столе нарисованы на спрайте table.png
    // (статичная часть). Покрываем их dim-кругом + замком в Layer table.
    const dishPositions = {
      [OBJECTS.dish2]: { x: 68, y: -105 },
      [OBJECTS.dish3]: { x: 198, y: -105 },
    };
    for (const linkID of this.lockedDishes) {
      const pos = dishPositions[linkID];
      if (!pos) continue;
      const dim = new PIXI.Graphics();
      dim.beginFill(0x000000, 0.4);
      dim.drawCircle(pos.x, pos.y, 50);
      dim.endFill();
      tableObj.view.addChild(dim);

      const badge = createLockBadge(34);
      badge.position.set(pos.x, pos.y);
      tableObj.view.addChild(badge);

      this._lockBadges.push({ kind: "plate", linkID, badge, dim });
    }

    // Топпинги: tomato/cucumbers/fry — Food-контейнеры. Делаем сам контейнер
    // полупрозрачным (alpha 0.25) и блокируем интерактив. Бейдж ставим как
    // sibling в table.view, чтобы он остался непрозрачным.
    const toppingPositions = {
      tomato: { x: -66, y: 8 },
      fry: { x: 41, y: 6 },
      cucumbers: { x: 148, y: 5 },
    };
    for (const key of TOPPING_KEYS) {
      const linkID = TOPPING_LINK_BY_KEY[key];
      const obj = ObjectLinks.get(linkID);
      if (!obj || !obj.view) continue;
      obj.view.alpha = 0.25;
      if (typeof obj.updateInteractive === "function") {
        obj.updateInteractive("auto");
      }

      const pos = toppingPositions[key];
      if (!pos) continue;
      const badge = createLockBadge(34);
      badge.position.set(pos.x, pos.y);
      tableObj.view.addChild(badge);

      this._lockBadges.push({ kind: "topping", key, badge, obj });
    }
  }

  // Алгоритм выбора 2-х карточек: сначала определяем доступные категории,
  // потом подбираем 2 разных. Edge case (всё максилось) → 2 income разных
  // ингредиентов.
  pickUpgradeCards() {
    const plateAvail = this.unlockedPlateCount < MAX_PLATES;
    const lockedToppingKeys = TOPPING_KEYS.filter(
      (k) => !this.unlockedToppings.has(k)
    );
    const toppingAvail = lockedToppingKeys.length > 0;

    // Доступные ingredient-keys для income (только разблокированные +
    // всегда meat и cola).
    const incomeIngredients = INCOME_KEYS.filter((k) => {
      if (k === "meat" || k === "cola") return true;
      return this.unlockedToppings.has(k);
    });

    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const buildPlateCard = () => ({
      type: "plate",
      productKey: "plate",
      label: "+1 порция",
      sub: `${this.unlockedPlateCount} → ${this.unlockedPlateCount + 1}`,
      iconKey: CARD_ICONS.plate,
      badge: "+1",
      accentColor: 0x7561c8,
      apply: () => this.applyPlateUpgrade(),
    });

    const buildToppingCard = () => {
      const k = pickRandom(lockedToppingKeys);
      return {
        type: "topping",
        productKey: k,
        label: PRODUCT_LABELS[k] || k,
        sub: "теперь доступно",
        iconKey: CARD_ICONS[k],
        badge: "NEW",
        accentColor: 0xe07a2a,
        apply: () => this.applyToppingUpgrade(k),
      };
    };

    const buildIncomeCard = (excludeKey) => {
      const pool = incomeIngredients.filter((k) => k !== excludeKey);
      if (!pool.length) return null;
      const k = pickRandom(pool);
      const cur = this.incomeBoosts[k] || 0;
      return {
        type: "income",
        productKey: k,
        label: `${PRODUCT_LABELS[k] || k}`,
        sub: `+${cur} → +${cur + INCOME_STEP} монет`,
        iconKey: CARD_ICONS[k],
        badge: `+${INCOME_STEP}`,
        accentColor: 0x4fa8e0,
        apply: () => this.applyIncomeUpgrade(k),
      };
    };

    const cats = [];
    if (plateAvail) cats.push("plate");
    if (toppingAvail) cats.push("topping");
    cats.push("income"); // всегда

    if (cats.length >= 2) {
      // Веса: топпинги/тарелки приоритетнее income (чтобы игрок успел
      // открыть весь контент перед тем, как начнёт качать только цены).
      const weighted = cats.flatMap((c) =>
        c === "income" ? [c] : [c, c]
      );
      // Берём 2 РАЗНЫЕ категории.
      const first = pickRandom(weighted);
      const remaining = cats.filter((c) => c !== first);
      const second = pickRandom(remaining);

      const buildOne = (cat, exclude) => {
        if (cat === "plate") return buildPlateCard();
        if (cat === "topping") return buildToppingCard();
        return buildIncomeCard(exclude);
      };
      const c1 = buildOne(first, null);
      const c2 = buildOne(second, c1 && c1.productKey);
      return [c1, c2].filter(Boolean);
    }

    // Только income доступен (всё разблокировано) → 2 income разных
    // ингредиентов. Защита: если incomeIngredients < 2, дублируем единственный.
    const c1 = buildIncomeCard(null);
    const c2 = buildIncomeCard(c1 && c1.productKey);
    return [c1, c2].filter(Boolean);
  }

  applyPlateUpgrade() {
    if (this.unlockedPlateCount >= MAX_PLATES) return;
    if (!this.lockedDishes.length) return;
    const linkID = this.lockedDishes.shift();
    this.emptyDishes.push(linkID);
    this.unlockedPlateCount++;

    // Убрать замок и dim для этой тарелки.
    this._lockBadges = this._lockBadges.filter((entry) => {
      if (entry.kind === "plate" && entry.linkID === linkID) {
        if (entry.badge && entry.badge.parent) entry.badge.parent.removeChild(entry.badge);
        if (entry.dim && entry.dim.parent) entry.dim.parent.removeChild(entry.dim);
        return false;
      }
      return true;
    });

    // canTapTortilla теперь true — обновим интерактив тортильи.
    this.updateTortillaInteractive();
  }

  applyToppingUpgrade(key) {
    if (this.unlockedToppings.has(key)) return;
    this.unlockedToppings.add(key);

    const linkID = TOPPING_LINK_BY_KEY[key];
    const obj = ObjectLinks.get(linkID);
    if (obj && obj.view) {
      // Анимация раскрытия: alpha 0.25 → 1 + bounce. Анимация на baseObject
      // через proxy alpha/scale → view (как делает HudPanel._bounce).
      new Animation(obj, {
        from: { alpha: 0.25, scale: { x: 0.85, y: 0.85 } },
        to: { alpha: 1, scale: { x: 1, y: 1 } },
        duration: 320,
        easing: Easing.Back.Out,
        autoStart: true,
        onComplete: () => {
          // Гарантируем финальные значения (на случай прерванной анимации).
          obj.view.alpha = 1;
          obj.view.scale.set(1, 1);
        },
      });
      // Восстанавливаем интерактив (Food.unlock через updateInteractive).
      if (typeof obj.updateInteractive === "function") {
        obj.updateInteractive("dynamic");
      }
    }

    this._lockBadges = this._lockBadges.filter((entry) => {
      if (entry.kind === "topping" && entry.key === key) {
        if (entry.badge && entry.badge.parent) entry.badge.parent.removeChild(entry.badge);
        return false;
      }
      return true;
    });

    // Обновим matching gate / интерактивы.
    this.updateProductsInteractive();
    this.updateTortillaInteractive();
  }

  applyIncomeUpgrade(key) {
    if (!(key in this.incomeBoosts)) return;
    this.incomeBoosts[key] += INCOME_STEP;
  }

  // ---------- Show / hide overlay ----------

  // Поставить апгрейд в очередь и попытаться показать сразу.
  _enqueueUpgrade() {
    this._pendingUpgrades++;
    this._tryShowNextUpgrade();
  }

  // Если overlay свободен и в очереди что-то есть — показать. Если показ
  // не удался (нет overlay-объекта или мало карточек) — апгрейд остаётся
  // в очереди и попробуем снова на следующем hideUpgradeOverlay().
  _tryShowNextUpgrade() {
    if (this.upgradeOverlayActive) return;
    if (this._pendingUpgrades <= 0) return;
    const shown = this.showUpgradeOverlay();
    if (shown) this._pendingUpgrades--;
  }

  showUpgradeOverlay() {
    if (this.upgradeOverlayActive) return false;
    const overlay = ObjectLinks.get(OBJECTS.upgradeOverlay);
    if (!overlay || typeof overlay.show !== "function") return false;

    const cards = this.pickUpgradeCards();
    if (!cards || cards.length < 2) return false;

    this.upgradeOverlayActive = true;
    this.upgradeRoundIndex++;
    this.pauseTutorial();

    // Подписка на выбор. Ставим один раз и снимаем после срабатывания.
    if (!this._upgradeChosenBound) {
      this._upgradeChosenBound = true;
      overlay.onChosen(() => this.hideUpgradeOverlay());
    }

    overlay.show(cards);
    return true;
  }

  hideUpgradeOverlay() {
    if (!this.upgradeOverlayActive) return;
    this.upgradeOverlayActive = false;

    // Если в очереди ещё есть апгрейды — следующий показываем после
    // завершения hide-анимации overlay'я (~180ms). Иначе hide.onComplete
    // поставит view.visible=false поверх уже показанного следующего
    // overlay, и игрок увидит его лишь на мгновение.
    // Спавн пустых слотов тоже откладываем до последнего hide: иначе
    // setTimeout-ы спавна выполнятся при активном следующем overlay,
    // и spawnBuyerInSlot их обрубит по upgradeOverlayActive.
    if (this._pendingUpgrades > 0) {
      setTimeout(() => this._tryShowNextUpgrade(), 250);
      return;
    }

    // Pending-клиенты (зашли на фон во время overlay'я) — теперь, когда
    // апгрейды отыграны, генерируем им заказ и показываем tooltip.
    // Делаем до спавна оставшихся пустых слотов — чтобы у уже пришедших
    // персонажей быстрее появились бабли.
    for (const buyer of this.activeBuyers) {
      if (!buyer || !buyer.pendingOrder) continue;
      this._assignOrder(buyer);
      buyer.pendingOrder = false;
      if (buyer.tooltip && typeof buyer.tooltip.show === "function") {
        buyer.tooltip.show();
      }
    }
    this.updateProductsInteractive();
    this.updateTortillaInteractive();

    // Спавним клиентов в пустых слотах (спавны во время паузы подавлялись).
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (!this.activeBuyers[i] && this.hasMoreBuyers()) {
        // Небольшой stagger чтобы не появились все одновременно.
        setTimeout(() => this.spawnBuyerInSlot(i, false), i * 220);
      }
    }

    // Если на экране 0 решаемых клиентов — мутируем заказ одного слота
    // в strict-solvable, чтобы игрок не висел в deadlock.
    this._repairUnsolvableSlots();

    // Восстановим tutorial (если есть открытые заказы).
    setTimeout(() => this.updateTutorial(), 600);
  }

  _repairUnsolvableSlots() {
    // Считаем решаемых среди активных. Если 0 — форсим первый встретившийся
    // слот стать решаемым, перегенерируя его dish.products + обновив tooltip.
    let solvable = 0;
    let firstUnsolvable = null;
    for (let i = 0; i < this.activeBuyers.length; i++) {
      const b = this.activeBuyers[i];
      if (!b) continue;
      const ok = b.dishes.every((d) =>
        d.products.every((p) => {
          if (p === OBJECTS.cola || p === PRODUCTS_TYPES.meat) return true;
          return this.unlockedToppings.has(p);
        })
      );
      if (ok) solvable++;
      else if (!firstUnsolvable) firstUnsolvable = b;
    }
    if (solvable >= 1) return;
    if (!firstUnsolvable) return;

    // Перегенерируем заказ с strict-solvable и применяем к первому слоту.
    const newDishes = this.generateRandomOrder({ strictSolvable: true });
    firstUnsolvable.dishes = newDishes;
    const tooltip = firstUnsolvable.tooltip;
    if (!tooltip) return;
    const orderGroup =
      tooltip.container &&
      tooltip.container.icons &&
      tooltip.container.icons.children.find((c) => c.visible);
    if (!orderGroup || !orderGroup.children) return;
    const Y_LAYOUT = { 1: [175], 2: [110, 245], 3: [70, 175, 280] };
    const ys = Y_LAYOUT[newDishes.length] || [175];
    newDishes.forEach((dish, i) => {
      const slot = orderGroup.children[i];
      if (slot && slot.baseObject && slot.baseObject.setProducts) {
        slot.baseObject.setProducts(dish.products);
        slot.position.y = ys[i];
        dish.slotRef = slot.baseObject;
      }
    });
    // Гасим лишние слоты (если новый заказ короче).
    for (let i = newDishes.length; i < orderGroup.children.length; i++) {
      const slot = orderGroup.children[i];
      if (slot && slot.baseObject && slot.baseObject.reset) {
        slot.baseObject.reset();
      }
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
          if (!this._storeTriggered) this.triggerStore();
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

  // Сделает ли эта попытка выдачи блюда/колы последней в игре?
  // (Помечен бы был последний non-complete заказ, нет других активных
  // незакрытых заказов и больше клиентов не будет.)
  // Проверяется ДО маркировки complete и без побочных эффектов — если true,
  // выдача отменяется, игрок сразу попадает в стор.
  _isFinalDeliveryDish(dish) {
    if (this._storeTriggered) return false;
    if (this.hasMoreBuyers()) return false;
    const dishKey = dishKeyFromIconView(dish);
    if (!dishKey) return false;
    const match = this.findBuyerForDishKey(dishKey);
    if (!match) return false;
    return this._wouldBeAllDone(match.dish);
  }

  _isFinalDeliveryCola() {
    if (this._storeTriggered) return false;
    if (this.hasMoreBuyers()) return false;
    const match = this.findBuyerForCola();
    if (!match) return false;
    return this._wouldBeAllDone(match.dish);
  }

  // Если гипотетически пометить candidateDish как complete — все ли заказы
  // у всех активных клиентов окажутся обслужены? Pending-клиент (зашёл на
  // фон, но заказ ещё не сгенерирован) считается «не обслуженным» — у него
  // ещё будет заказ, рано в стор уходить.
  _wouldBeAllDone(candidateDish) {
    const active = this.getActiveBuyers();
    if (active.length === 0) return false;
    return active.every((b) => {
      if (b.pendingOrder) return false;
      return b.dishes.every((d) => d.complete || d === candidateDish);
    });
  }

  // Перевод в стор вместо реальной выдачи финального заказа. Маркирует
  // флаг, чтобы повторные тапы и onDeliveryComplete не дублировали show.
  // В обычном flow (web/preview) сам тап на финальное блюдо засчитываем как
  // click-install — без него игрок видит «холостой» тап (overlay прозрачный)
  // и должен тапать ещё раз, чтобы перейти в стор.
  _redirectFinalToStore() {
    if (this._storeTriggered) return;
    this._storeTriggered = true;
    this.triggerStore();
    if (window.is_adwords || window.is_unity) return;
    try {
      window.application.sound &&
        window.application.sound.stop &&
        window.application.sound.stop("music");
    } catch (e) {}
    try {
      window.application.clickInstall && window.application.clickInstall();
    } catch (e) {}
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
          // Финальный заказ в игре: не выдаём, переводим в стор.
          Rewards.if(
            () => this._isFinalDeliveryCola(),
            Rewards.startScenario([
              () => this._redirectFinalToStore(),
            ]),
            Rewards.startScenario([
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
          // Финальный заказ в игре: не выдаём, переводим в стор. Тарелка
          // остаётся как была — игрок видит overlay, но не доставляет.
          Rewards.if(
            (dish) => this._isFinalDeliveryDish(dish),
            Rewards.startScenario([
              Rewards.onTarget(
                (dish) => dish,
                Rewards.call("updateInteractive", "dynamic")
              ),
              () => this._redirectFinalToStore(),
            ]),
            Rewards.startScenario([
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
            ])
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
