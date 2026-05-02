import { APPLICATION_EVENTS, ObjectLinks, PIXI } from "PlayableAdsEngine";
import { OBJECTS } from "../const";
import { RCP_SETTINGS_KEY, RCP_SETTINGS_DEFAULTS } from "./v1/PlayableController";

const STORAGE_KEY = "rcp_editor_layout_v1";
const PANEL_POS_KEY = "rcp_editor_panel_pos_v1";

// Описание полей в разделе «Численные параметры» — порядок и подписи.
const PARAM_FIELDS = [
  { key: "totalBuyers", label: "Всего клиентов", min: 1, max: 999, step: 1 },
  { key: "slotCount", label: "Клиентов за прилавком", min: 1, max: 3, step: 1 },
  { key: "maxDishesPerOrder", label: "Макс. блюд в заказе", min: 1, max: 3, step: 1 },
  { key: "upgradeInterval", label: "Клиентов между апгрейдами", min: 1, max: 99, step: 1 },
];
const PRICE_FIELDS = [
  { key: "tortilla", label: "Лепёшка" },
  { key: "meat", label: "Мясо" },
  { key: "tomato", label: "Помидор" },
  { key: "cucumbers", label: "Огурец" },
  { key: "fry", label: "Картошка" },
  { key: "cola", label: "Кола" },
];

// Упрощённая bucket-схема: 6 экран-вариантов вместо 16 движковых.
// Определяются по getLandscapeRatio (= max/min, всегда ≥ 1) + isPortrait.
//   ultraWide  — горизонтальный 21:9 и шире (lr ≥ 2.0, !portrait)
//   desktop    — горизонтальный классический (1.18 ≤ lr < 2.0, !portrait)
//   square     — почти квадратный (lr < 1.18, любая ориентация)
//   tablet     — вертикальный 3:4 (1.18 ≤ lr < 1.55, portrait)
//   phone      — вертикальный 9:16 (1.55 ≤ lr < 1.95, portrait)
//   ultraTall  — вертикальный 9:21 и уже (lr ≥ 1.95, portrait)
const BUCKETS = ["ultraWide", "desktop", "square", "tablet", "phone", "ultraTall"];
const HORIZONTAL_BUCKETS = ["ultraWide", "desktop"];
const PORTRAIT_BUCKETS = ["tablet", "phone", "ultraTall"];
function isPortraitBucket(b) {
  return PORTRAIT_BUCKETS.indexOf(b) !== -1;
}

// Дефолтный layout — встраивается в код, применяется на чистой сборке
// (без localStorage). localStorage юзера имеет приоритет: его правки
// override-ят эти значения. Старые 16-bucket ключи мигрируются в 6 при
// чтении (см. migrate ниже).
const DEFAULT_LAYOUT = {
  // 21:9 и шире — сверхширокий горизонтальный
  ultraWide: {
    italian_man: { x: -353, y: 205, scaleX: 1, scaleY: 1 },
    pretty_woman: { x: -130, y: 120, scaleX: 1, scaleY: 1 },
    old_grambler: { x: 126, y: 114, scaleX: 1, scaleY: 1 },
    tooltip1: { x: -310, y: -433, scaleX: 0.691, scaleY: 0.691 },
    tooltip2: { x: -85, y: -430, scaleX: 0.692, scaleY: 0.692 },
    tooltip3: { x: 159, y: -432, scaleX: 0.691, scaleY: 0.691 },
  },
  // Классический горизонтальный десктоп (16:9, 16:10, 5:3, 3:2)
  desktop: {
    italian_man: { x: -353, y: 201, scaleX: 1, scaleY: 1 },
    pretty_woman: { x: -130, y: 120, scaleX: 1, scaleY: 1 },
    old_grambler: { x: 126, y: 114, scaleX: 1, scaleY: 1 },
    tooltip1: { x: -305, y: -409, scaleX: 0.658, scaleY: 0.658 },
    tooltip2: { x: -90, y: -410, scaleX: 0.656, scaleY: 0.656 },
    tooltip3: { x: 158, y: -409, scaleX: 0.625, scaleY: 0.625 },
  },
  // Почти квадратный экран (4:3 лэндскейп)
  square: {
    italian_man: { x: -363, y: 207, scaleX: 1, scaleY: 1 },
    pretty_woman: { x: -155, y: 119, scaleX: 1, scaleY: 1 },
    old_grambler: { x: 126, y: 114, scaleX: 1, scaleY: 1 },
    tooltip1: { x: -321, y: -412, scaleX: 0.682, scaleY: 0.682 },
    tooltip2: { x: -104, y: -411, scaleX: 0.691, scaleY: 0.691 },
    tooltip3: { x: 151, y: -412, scaleX: 0.692, scaleY: 0.692 },
  },
  // 3:4 — вертикальный планшет
  tablet: {
    italian_man: { x: -360, y: 205, scaleX: 1, scaleY: 1 },
    pretty_woman: { x: -125, y: 118, scaleX: 1, scaleY: 1 },
    old_grambler: { x: 127, y: 112, scaleX: 1, scaleY: 1 },
    tooltip1: { x: -353, y: -544, scaleX: 0.93, scaleY: 0.93 },
    tooltip2: { x: -119, y: -540, scaleX: 0.93, scaleY: 0.93 },
    tooltip3: { x: 131, y: -538, scaleX: 0.932, scaleY: 0.932 },
  },
  // 9:16 — вертикальный телефон
  phone: {
    italian_man: { x: -360, y: 205, scaleX: 1, scaleY: 1 },
    pretty_woman: { x: -140, y: 120, scaleX: 1, scaleY: 1 },
    old_grambler: { x: 125, y: 111, scaleX: 1, scaleY: 1 },
    tooltip1: { x: -345, y: -517, scaleX: 0.842, scaleY: 0.842 },
    tooltip2: { x: -121, y: -516, scaleX: 0.837, scaleY: 0.837 },
    tooltip3: { x: 121, y: -517, scaleX: 0.844, scaleY: 0.844 },
  },
  // 9:21 — сверх-вытянутый вертикальный
  ultraTall: {
    italian_man: { x: -360, y: 205, scaleX: 1, scaleY: 1 },
    pretty_woman: { x: -130, y: 120, scaleX: 1, scaleY: 1 },
    old_grambler: { x: 134, y: 114, scaleX: 1, scaleY: 1 },
    tooltip1: { x: -119, y: -542, scaleX: 0.935, scaleY: 0.935 },
    tooltip2: { x: -356, y: -542, scaleX: 0.93, scaleY: 0.93 },
    tooltip3: { x: 129, y: -542, scaleX: 0.937, scaleY: 0.937 },
  },
};

// Какой из 6 букетов соответствует текущему экрану.
function detectCurrentBucket() {
  const r = window.application && window.application.renderer;
  if (!r) return "desktop";
  const isPortrait = r.isPortrait;
  const lr = r.getLandscapeRatio;
  if (lr < 1.18) return "square";
  if (!isPortrait) return lr >= 2.0 ? "ultraWide" : "desktop";
  if (lr < 1.55) return "tablet";
  if (lr < 1.95) return "phone";
  return "ultraTall";
}

// Cascade fallback внутри 6 букетов: ищем ближайший по типу.
const FALLBACK = {
  ultraWide: ["desktop", "square"],
  desktop: ["ultraWide", "square"],
  square: ["desktop", "tablet"],
  tablet: ["phone", "square", "ultraTall"],
  phone: ["tablet", "ultraTall", "square"],
  ultraTall: ["phone", "tablet"],
};
function pickBucketFromData(data) {
  const cur = detectCurrentBucket();
  if (data[cur]) return cur;
  for (const b of FALLBACK[cur] || []) if (data[b]) return b;
  for (const b of BUCKETS) if (data[b]) return b;
  return null;
}

// Миграция старых 16-bucket / "landscape" ключей в 6-bucket.
const OLD_TO_NEW = {
  landscape: "desktop",
  default: "ultraWide",
  xlg: "ultraWide",
  lg: "desktop",
  md: "desktop",
  sm: "desktop",
  xsm: "desktop",
  mn: "square",
  emn: "square",
  portrait: "ultraTall",
  portrait_xlg: "ultraTall",
  portrait_lg: "phone",
  portrait_md: "phone",
  portrait_sm: "phone",
  portrait_xsm: "tablet",
  portrait_mn: "tablet",
  portrait_emn: "tablet",
};
function migrate(stored) {
  if (!stored || typeof stored !== "object") return stored || {};
  const out = {};
  for (const k of Object.keys(stored)) {
    if (BUCKETS.indexOf(k) !== -1) {
      out[k] = stored[k];
      continue;
    }
    const newKey = OLD_TO_NEW[k];
    if (newKey && !out[newKey]) out[newKey] = stored[k];
  }
  // HUD якорится к ВЕРХУ канваса (align(0.5, 0)) — y из топ-якоря должен
  // быть positive (offset вниз от верха). Старые сохранения от raw
  // view.position могли затечь сюда с большими отрицательными значениями
  // (-300..-600). Чистим, чтобы fallback на DEFAULT_LAYOUT отрабатывал.
  for (const bk of Object.keys(out)) {
    const e = out[bk] && out[bk].hudPanel;
    if (e && typeof e.y === "number" && (e.y < -50 || e.y > 300)) {
      delete out[bk].hudPanel;
    }
  }
  return out;
}

// Список редактируемых объектов: имя + способ найти baseObject.
// path: spawn-character доступ через буферный контейнер; linkID — через ObjectLinks.
//
// Маппинг tooltipN → character соответствует SLOT_TOOLTIPS / SLOT_CHARACTERS
// в PlayableController.js (zip по индексу). Tooltip "принадлежит" клиенту,
// над которым он должен висеть. labelOwner используется для подписи в editor.
//
// HudPanel НЕ редактируется через editor — она прибита к верху канваса
// через engine'овский adaptivePosition + position/position_portrait,
// так же как кнопки Install и Mute прибиты к нижнему краю.
const TARGETS = [
  { id: "italian_man", child: "italian_man" },
  { id: "pretty_woman", child: "pretty_woman" },
  { id: "old_grambler", child: "old_grambler" },
  { id: "tooltip1", linkID: OBJECTS.tooltip1, labelOwner: "italian_man" },
  { id: "tooltip2", linkID: OBJECTS.tooltip2, labelOwner: "pretty_woman" },
  { id: "tooltip3", linkID: OBJECTS.tooltip3, labelOwner: "old_grambler" },
];

// Точка в parent-local координатах, соответствующая align-якорю на канвасе
// (например, верхняя центральная точка для align={0.5, 0}). Используется для
// конверсии topAnchor coords ↔ view.position. Делегирует PIXI parent.toLocal,
// который корректно учитывает поворот стейджа в landscape.
function getAlignLocal(view, alignX, alignY) {
  const r = window.application && window.application.renderer;
  const screen = r && r.screen;
  if (!view || !view.parent || !screen) return null;
  const pt = new PIXI.Point(screen.width * alignX, screen.height * alignY);
  return view.parent.toLocal(pt);
}

// In-game редактор: чит-кнопка → перемещение объектов мышью + колесо для
// масштаба + сохранение в localStorage и буфер обмена. На старте применяет
// сохранённый layout для текущей ориентации.
export default class EditorTool {
  constructor() {
    this.active = false;
    this.dragging = null;
    this.selected = null;
    this.dragOffset = { x: 0, y: 0 };
    this.targets = [];
    this._setupAspectClamp();
    this._buildUI();
    this._listenResize();
  }

  _orientation() {
    const r = window.application && window.application.renderer;
    return r && r.isPortrait ? "portrait" : "landscape";
  }

  // Зажимаем пропорции экрана так, чтобы UI на align-краях (HUD сверху,
  // Install снизу) не оказывался в неотрисованных областях канваса.
  // Игра спроектирована для ratio ~9:18 в портрете и ~21:9 в ландшафте;
  // экстремальные пропорции отдаём в чёрные поля по краям body.
  _setupAspectClamp() {
    const app = window.application;
    if (!app || app._aspectClampApplied) return;
    app._aspectClampApplied = true;
    // Максимально допустимый аспект (длинная сторона / короткая).
    // 2.05 ≈ 9:18.5, покрывает все типовые телефоны (9:16 — 9:20),
    // отсекая ультра-вытянутые (9:21+) и фейковые dev-mode размеры.
    const MAX_RATIO = 2.05;

    Object.defineProperty(app, "screenSize", {
      configurable: true,
      get() {
        const w = document.body.clientWidth;
        const h = document.body.clientHeight;
        let cw = w;
        let ch = h;
        if (h > w) {
          ch = Math.min(h, w * MAX_RATIO);
        } else {
          cw = Math.min(w, h * MAX_RATIO);
        }
        return { width: cw, height: ch };
      },
    });

    document.body.style.background = "#000";
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";

    // Engine ставит canvas.style.left/top по своим расчётам с clamped
    // screenSize, но фактический body может быть больше — рецентрируем.
    const recenter = () => {
      const view = app.renderer && app.renderer.view;
      if (!view) return;
      const bw = document.body.clientWidth;
      const bh = document.body.clientHeight;
      const cw = parseFloat(view.style.width) || view.width;
      const ch = parseFloat(view.style.height) || view.height;
      view.style.position = "absolute";
      view.style.left = Math.max(0, (bw - cw) / 2) + "px";
      view.style.top = Math.max(0, (bh - ch) / 2) + "px";
    };
    if (app.eventEmitter) {
      app.eventEmitter.on(APPLICATION_EVENTS.playableResize, () =>
        setTimeout(recenter, 80)
      );
    }
    setTimeout(recenter, 120);
    // Запускаем resize, чтобы engine пересчитал layout с clamped размерами.
    setTimeout(() => {
      try {
        app.onResize(app.screenSize);
      } catch (e) {}
    }, 60);
  }

  // В какой букет писать save() — либо явно выбранный в селекторе, либо
  // тот, что движок выбрал бы для текущего экрана.
  _saveBucket() {
    return this.editingBucket || detectCurrentBucket();
  }

  _buildUI() {
    if (document.getElementById("rcp-editor-ui")) return;
    const wrap = document.createElement("div");
    wrap.id = "rcp-editor-ui";
    wrap.style.cssText =
      "position:fixed;top:8px;left:8px;z-index:99999;font:bold 12px Arial,sans-serif;user-select:none;";

    const btn = (id, bg, label) =>
      `<button id="${id}" style="display:block;width:100%;padding:7px 10px;margin-bottom:6px;background:${bg};color:#fff;border:none;border-radius:5px;cursor:pointer;">${label}</button>`;

    // Header панели: drag-handle + кнопка закрытия.
    const header =
      '<div id="ed-header" style="display:flex;align-items:center;justify-content:space-between;margin:-4px -4px 6px;padding:4px 6px;background:#f0f0f0;border-radius:5px;cursor:move;">' +
      '<span style="color:#555;font-size:11px;">⚙ Читы — перетащить</span>' +
      '<button id="ed-close" style="border:none;background:transparent;color:#666;font:bold 18px Arial,sans-serif;cursor:pointer;padding:0 4px;line-height:1;">×</button>' +
      "</div>";

    // Раздел «Перемещение» — встраивается между кнопкой и следующими кнопками.
    const sectionObjects =
      '<div id="ed-section-objects" style="display:none;margin:0 0 6px;padding:8px;background:#fafafa;border-radius:5px;">' +
      '<div id="ed-buckets" style="margin-bottom:6px;font-size:10px;"></div>' +
      '<div id="ed-params" style="margin-bottom:6px;max-height:35vh;overflow:auto;"></div>' +
      btn("ed-save", "#4FA8E0", "Сохранить JSON") +
      btn("ed-reset", "#999", "Сбросить") +
      '<div id="ed-status" style="margin-top:6px;font-size:11px;color:#444;line-height:1.35;"></div>' +
      '<textarea id="ed-dump" readonly style="display:none;width:100%;height:120px;margin-top:6px;font:11px monospace;padding:6px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;resize:vertical;"></textarea>' +
      "</div>";

    // Раздел «Параметры» — баланс игры.
    const sectionNum =
      '<div id="ed-section-num" style="display:none;margin:0 0 6px;padding:8px;background:#fafafa;border-radius:5px;">' +
      '<div id="ed-num-fields" style="margin-bottom:6px;"></div>' +
      btn("ed-num-save", "#4FA8E0", "Сохранить JSON") +
      btn("ed-num-reset", "#999", "Сбросить параметры") +
      '<div id="ed-num-status" style="margin-top:6px;font-size:11px;color:#444;line-height:1.35;"></div>' +
      '<textarea id="ed-num-dump" readonly style="display:none;width:100%;height:120px;margin-top:6px;font:11px monospace;padding:6px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;resize:vertical;"></textarea>' +
      "</div>";

    wrap.innerHTML =
      '<button id="ed-toggle" style="padding:6px 10px;background:#7561C8;color:#fff;border:none;border-radius:6px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.3);">⚙ Читы</button>' +
      '<div id="ed-panel" style="display:none;margin-top:6px;background:#fff;padding:10px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.25);min-width:240px;">' +
      header +
      btn("ed-open-objects", "#E07A2A", "Перемещение") +
      sectionObjects +
      btn("ed-open-num", "#3DAA68", "Параметры") +
      sectionNum +
      btn("ed-restart", "#D45D43", "Перезагрузка") +
      "</div>";

    document.body.appendChild(wrap);

    document.getElementById("ed-toggle").onclick = () => {
      const p = document.getElementById("ed-panel");
      p.style.display = p.style.display === "none" ? "block" : "none";
    };
    document.getElementById("ed-close").onclick = () => {
      document.getElementById("ed-panel").style.display = "none";
      // Закрытие панели сворачивает раздел Перемещение → drag mode off.
      const obj = document.getElementById("ed-section-objects");
      if (obj && obj.style.display === "block") this._toggleSection("objects");
    };
    document.getElementById("ed-open-objects").onclick = () =>
      this._toggleSection("objects");
    document.getElementById("ed-open-num").onclick = () =>
      this._toggleSection("num");
    document.getElementById("ed-restart").onclick = () => location.reload();

    document.getElementById("ed-save").onclick = () => {
      this.save();
      this._copyDump();
    };
    document.getElementById("ed-reset").onclick = () => this.resetAndReload();

    document.getElementById("ed-num-save").onclick = () => {
      this._saveNumParams();
      this._copyNumDump();
    };
    document.getElementById("ed-num-reset").onclick = () =>
      this._resetNumParamsAndReload();

    this.statusEl = document.getElementById("ed-status");
    this.dumpEl = document.getElementById("ed-dump");

    this.numStatusEl = document.getElementById("ed-num-status");
    this.numDumpEl = document.getElementById("ed-num-dump");

    this._setupPanelDrag();
    this._restorePanelPos();
  }

  // Показать одну секцию, скрыть другую. Повторный клик — закрыть.
  // Раздел «Перемещение» автоматически включает/выключает drag-режим.
  _toggleSection(name) {
    const ids = { objects: "ed-section-objects", num: "ed-section-num" };
    for (const k of Object.keys(ids)) {
      const el = document.getElementById(ids[k]);
      if (!el) continue;
      if (k === name) {
        const wasOpen = el.style.display !== "none";
        el.style.display = wasOpen ? "none" : "block";
        if (k === "num" && !wasOpen) this._buildNumFields();
        if (k === "objects") {
          if (!wasOpen && !this.active) this.toggle();
          else if (wasOpen && this.active) this.toggle();
        }
      } else {
        if (el.style.display === "block") {
          el.style.display = "none";
        }
      }
    }
  }

  // ---------- Drag панели ----------

  _setupPanelDrag() {
    const handle = document.getElementById("ed-header");
    const panel = document.getElementById("ed-panel");
    if (!handle || !panel) return;
    let dragging = false;
    let startX = 0,
      startY = 0,
      origX = 0,
      origY = 0;
    handle.addEventListener("mousedown", (e) => {
      // Игнорируем клики по кнопке закрытия.
      if (e.target && e.target.id === "ed-close") return;
      dragging = true;
      const wrap = document.getElementById("rcp-editor-ui");
      const rect = wrap.getBoundingClientRect();
      origX = rect.left;
      origY = rect.top;
      startX = e.clientX;
      startY = e.clientY;
      e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const wrap = document.getElementById("rcp-editor-ui");
      if (!wrap) return;
      const x = origX + (e.clientX - startX);
      const y = origY + (e.clientY - startY);
      wrap.style.left = Math.max(0, x) + "px";
      wrap.style.top = Math.max(0, y) + "px";
    });
    document.addEventListener("mouseup", () => {
      if (!dragging) return;
      dragging = false;
      const wrap = document.getElementById("rcp-editor-ui");
      if (!wrap) return;
      try {
        localStorage.setItem(
          PANEL_POS_KEY,
          JSON.stringify({
            left: wrap.style.left,
            top: wrap.style.top,
          })
        );
      } catch (e) {}
    });
  }

  _restorePanelPos() {
    try {
      const raw = localStorage.getItem(PANEL_POS_KEY);
      if (!raw) return;
      const pos = JSON.parse(raw);
      const wrap = document.getElementById("rcp-editor-ui");
      if (!wrap || !pos) return;
      if (pos.left) wrap.style.left = pos.left;
      if (pos.top) wrap.style.top = pos.top;
    } catch (e) {}
  }

  // ---------- Численные параметры ----------

  _readStoredNumParams() {
    let stored = {};
    try {
      const raw = localStorage.getItem(RCP_SETTINGS_KEY);
      if (raw) stored = JSON.parse(raw) || {};
    } catch (e) {}
    return stored;
  }

  _currentNumValues() {
    const live = (typeof window !== "undefined" && window.__rcpSettings) || {};
    const d = RCP_SETTINGS_DEFAULTS;
    const prices = Object.assign({}, d.prices, live.prices || {});
    return {
      totalBuyers: live.totalBuyers != null ? live.totalBuyers : d.totalBuyers,
      slotCount: live.slotCount != null ? live.slotCount : d.slotCount,
      maxDishesPerOrder:
        live.maxDishesPerOrder != null
          ? live.maxDishesPerOrder
          : d.maxDishesPerOrder,
      upgradeInterval:
        live.upgradeInterval != null
          ? live.upgradeInterval
          : d.upgradeInterval,
      prices,
    };
  }

  _buildNumFields() {
    const wrap = document.getElementById("ed-num-fields");
    if (!wrap) return;
    const cur = this._currentNumValues();
    const inputCss =
      "width:70px;padding:3px 5px;font:11px monospace;border:1px solid #ccc;border-radius:3px;";
    const rowCss =
      "display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;font-size:11px;";

    let html = '<div style="font-size:10px;color:#666;margin-bottom:4px;">Балансовые параметры (применятся после перезапуска):</div>';
    for (const f of PARAM_FIELDS) {
      html +=
        `<div style="${rowCss}"><span>${f.label}</span>` +
        `<input data-num-key="${f.key}" type="number" min="${f.min}" max="${f.max}" step="${f.step}" value="${cur[f.key]}" style="${inputCss}"></div>`;
    }
    html += '<div style="font-size:10px;color:#666;margin:8px 0 4px;">Цены товаров (монет):</div>';
    for (const f of PRICE_FIELDS) {
      html +=
        `<div style="${rowCss}"><span>${f.label}</span>` +
        `<input data-price-key="${f.key}" type="number" min="0" max="999" step="1" value="${cur.prices[f.key]}" style="${inputCss}"></div>`;
    }
    wrap.innerHTML = html;
  }

  _collectNumValuesFromInputs() {
    const wrap = document.getElementById("ed-num-fields");
    if (!wrap) return null;
    const stored = this._readStoredNumParams();
    const out = {
      totalBuyers: stored.totalBuyers,
      slotCount: stored.slotCount,
      maxDishesPerOrder: stored.maxDishesPerOrder,
      prices: Object.assign({}, stored.prices || {}),
    };
    wrap.querySelectorAll("input[data-num-key]").forEach((inp) => {
      const k = inp.dataset.numKey;
      const v = parseInt(inp.value, 10);
      if (Number.isFinite(v)) out[k] = v;
    });
    wrap.querySelectorAll("input[data-price-key]").forEach((inp) => {
      const k = inp.dataset.priceKey;
      const v = parseInt(inp.value, 10);
      if (Number.isFinite(v)) out.prices[k] = v;
    });
    return out;
  }

  _saveNumParams() {
    const data = this._collectNumValuesFromInputs();
    if (!data) return;
    localStorage.setItem(RCP_SETTINGS_KEY, JSON.stringify(data));
    const pretty = JSON.stringify(data, null, 2);
    if (this.numDumpEl) {
      this.numDumpEl.value = pretty;
      this.numDumpEl.style.display = "block";
    }
    if (this.numStatusEl) {
      this.numStatusEl.innerHTML =
        "Сохранено в localStorage. Применится после <b>Перезапуска игры</b>.";
    }
  }

  _resetNumParamsAndReload() {
    localStorage.removeItem(RCP_SETTINGS_KEY);
    location.reload();
  }

  _copyNumDump() {
    const text = this.numDumpEl ? this.numDumpEl.value : "";
    if (!text) return;
    let ok = false;
    try {
      this.numDumpEl.focus();
      this.numDumpEl.select();
      ok = document.execCommand && document.execCommand("copy");
    } catch (e) {}
    if (ok) {
      this.numStatusEl.innerHTML = "Скопировано в буфер обмена ✓";
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => (this.numStatusEl.innerHTML = "Скопировано в буфер обмена ✓"),
        () => {
          try {
            this.numDumpEl.focus();
            this.numDumpEl.select();
          } catch (e) {}
          this.numStatusEl.innerHTML =
            "Авто-копирование заблокировано. Выдели текст и нажми <b>Ctrl+C</b>.";
        }
      );
      return;
    }
    try {
      this.numDumpEl.focus();
      this.numDumpEl.select();
    } catch (e) {}
    this.numStatusEl.innerHTML =
      "Авто-копирование не сработало. Выдели текст и нажми <b>Ctrl+C</b>.";
  }

  // Многошаговый fallback копирования: execCommand (надёжный в iframe/file)
  // → navigator.clipboard (требует https + user gesture, может не сработать)
  // → выделение текста и подсказка нажать Ctrl+C вручную.
  _copyDump() {
    const text = this.dumpEl ? this.dumpEl.value : "";
    if (!text) return;

    // 1) execCommand через выделение textarea — работает почти везде.
    let ok = false;
    try {
      this.dumpEl.focus();
      this.dumpEl.select();
      ok = document.execCommand && document.execCommand("copy");
    } catch (e) {}
    if (ok) {
      this.statusEl.innerHTML = "Скопировано в буфер обмена ✓";
      return;
    }

    // 2) navigator.clipboard — асинхронно, ловим rejection.
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => {
          this.statusEl.innerHTML = "Скопировано в буфер обмена ✓";
        },
        () => {
          // 3) Не вышло вовсе — оставим текст выделенным.
          try {
            this.dumpEl.focus();
            this.dumpEl.select();
          } catch (e) {}
          this.statusEl.innerHTML =
            "Авто-копирование заблокировано. Выдели текст и нажми <b>Ctrl+C</b>.";
        }
      );
      return;
    }

    // 3) Без API: выделить и попросить юзера.
    try {
      this.dumpEl.focus();
      this.dumpEl.select();
    } catch (e) {}
    this.statusEl.innerHTML =
      "Авто-копирование не сработало. Выдели текст и нажми <b>Ctrl+C</b>.";
  }

  _listenResize() {
    if (!window.application || !window.application.eventEmitter) {
      setTimeout(() => this._listenResize(), 200);
      return;
    }
    window.application.eventEmitter.on(
      APPLICATION_EVENTS.playableResize,
      () => {
        // Engine может пересбросить view.position по resize — re-apply.
        setTimeout(() => {
          this.applyStoredLayout();
          if (this.active) this._buildBucketSelector();
        }, 80);
      }
    );
  }

  collectTargets() {
    this.targets = [];
    const buyers = ObjectLinks.get(OBJECTS.buyers);
    for (const desc of TARGETS) {
      let obj;
      if (desc.child) obj = buyers && buyers[desc.child];
      else if (desc.linkID) obj = ObjectLinks.get(desc.linkID);
      if (obj && obj.view) this.targets.push({ desc, obj });
    }
  }

  toggle() {
    this.active = !this.active;
    if (this.active) {
      this.collectTargets();
      this._enableDrag();
      if (this.statusEl) {
        this.statusEl.innerHTML =
          "Режим: <b>ВКЛ</b>. Тяни мышью; колесо — масштаб.<br>" +
          `Ориентация: <b>${this._orientation()}</b>`;
      }
    } else {
      this._disableDrag();
      if (this.statusEl) this.statusEl.textContent = "Режим выключен.";
    }
  }

  _enableDrag() {
    const stage = window.application.renderer.stage;
    this._stageDown = (e) => this._onStageDown(e);
    this._stageMove = (e) => this._onMove(e);
    this._stageUp = () => this._onUp();
    stage.eventMode = "static";
    // Hit-area на весь экран — ловим pointerdown откуда угодно.
    stage.hitArea = new PIXI.Rectangle(-10000, -10000, 20000, 20000);
    stage.on("pointerdown", this._stageDown);
    stage.on("globalpointermove", this._stageMove);
    stage.on("pointerup", this._stageUp);
    stage.on("pointerupoutside", this._stageUp);

    // Overlay-контейнер поверх всех спрайтов сцены. Каждый кадр копирует
    // worldTransform таргетов в свои дочерние группы — рамка/лейбл всегда
    // видны независимо от наложений UI и окружения.
    this._overlay = new PIXI.Container();
    this._overlay.eventMode = "none";
    stage.addChild(this._overlay);

    this._outlines = [];
    for (const t of this.targets) {
      const v = t.obj.view;
      const isCharacter = !!t.desc.child;

      const outline = new PIXI.Graphics();
      outline.lineStyle(3, isCharacter ? 0xff8a4d : 0x4fa8e0, 1);
      const b = v.getLocalBounds && v.getLocalBounds();
      let rx, ry, rw, rh;
      if (b && b.width > 8 && b.height > 8) {
        const padX = b.width * 0.15;
        const padY = b.height * 0.15;
        rx = b.x - padX;
        ry = b.y - padY;
        rw = b.width + 2 * padX;
        rh = b.height + 2 * padY;
      } else if (isCharacter) {
        rx = -150;
        ry = -350;
        rw = 300;
        rh = 400;
      } else {
        rx = -90;
        ry = -120;
        rw = 180;
        rh = 240;
      }
      outline.drawRoundedRect(rx, ry, rw, rh, 8);
      outline.eventMode = "none";

      const labelText = t.desc.labelOwner
        ? `${t.desc.id} → ${t.desc.labelOwner}`
        : t.desc.id;
      const label = new PIXI.Text(labelText, {
        fontFamily: "Arial Black, Arial, sans-serif",
        fontSize: 16,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: isCharacter ? 0xc05010 : 0x205fa0,
        strokeThickness: 4,
      });
      label.anchor.set(0.5, 1);
      label.x = rx + rw / 2;
      label.y = ry - 4;
      label.eventMode = "none";

      // Группа в overlay — её локальный transform каждый кадр становится
      // равным worldTransform таргета (минус stage-WT), так что визуально
      // позиция/масштаб совпадают с таргетом, но рендер идёт поверх.
      const group = new PIXI.Container();
      group.eventMode = "none";
      group.addChild(outline);
      group.addChild(label);
      this._overlay.addChild(group);

      this._outlines.push({ t, group, outline, label });
    }

    // Ticker для синхронизации трансформов overlay-групп с таргетами.
    const ticker = window.application.renderer.ticker;
    this._overlayTickerFn = () => this._syncOverlay();
    if (ticker) ticker.add(this._overlayTickerFn);
    this._syncOverlay();

    this._wheelFn = (e) => this._onWheel(e);
    document.addEventListener("wheel", this._wheelFn, { passive: false });

    // Селектор ratio-букетов и блок параметров.
    this._buildBucketSelector();
    this._buildParamsBlock();
  }

  // Каждый кадр: копируем worldTransform таргетов в overlay-группы, чтобы
  // рамки/лейблы рендерились в той же позиции, что и таргеты, но поверх.
  // Формула: group.localTransform = inv(overlay.parent.WT) * target.WT
  // (так effective worldTransform group равен target.worldTransform).
  _syncOverlay() {
    if (!this._outlines || !this._overlay) return;
    const ovParent = this._overlay.parent;
    if (!ovParent) return;
    // Поддерживаем overlay в самом конце детей родителя — гарантия topmost.
    if (ovParent.children[ovParent.children.length - 1] !== this._overlay) {
      ovParent.addChild(this._overlay);
    }
    const invParent = new PIXI.Matrix()
      .copyFrom(ovParent.worldTransform)
      .invert();
    const tmp = new PIXI.Matrix();
    for (const o of this._outlines) {
      const v = o.t.obj.view;
      if (!v || !v.parent) {
        o.group.visible = false;
        continue;
      }
      o.group.visible = v.visible !== false;
      tmp.copyFrom(invParent).append(v.worldTransform);
      o.group.transform.setFromMatrix(tmp);
    }
  }

  // Stage-level pointerdown: ищет ближайший таргет к точке клика
  // (в global stage coords). Не зависит от eventMode/hitArea отдельных
  // объектов — ловит persons и spine надёжно.
  _onStageDown(e) {
    const gx = e.global.x;
    const gy = e.global.y;
    let best = null;
    let bestDist = Infinity;
    for (const t of this.targets) {
      const v = t.obj.view;
      if (!v || !v.parent) continue;
      const gp = v.getGlobalPosition();
      const dx = gp.x - gx;
      const dy = gp.y - gy;
      const d = Math.hypot(dx, dy);
      if (d < bestDist) {
        bestDist = d;
        best = t;
      }
    }
    if (!best || bestDist > 350) return;
    this._onDown(best, e);
  }

  _disableDrag() {
    const stage = window.application.renderer.stage;
    if (this._stageMove) {
      stage.off("pointerdown", this._stageDown);
      stage.off("globalpointermove", this._stageMove);
      stage.off("pointerup", this._stageUp);
      stage.off("pointerupoutside", this._stageUp);
      this._stageDown = this._stageMove = this._stageUp = null;
    }
    if (this._overlayTickerFn) {
      const ticker = window.application.renderer.ticker;
      if (ticker) ticker.remove(this._overlayTickerFn);
      this._overlayTickerFn = null;
    }
    if (this._overlay) {
      if (this._overlay.parent) this._overlay.parent.removeChild(this._overlay);
      this._overlay.destroy({ children: true });
      this._overlay = null;
    }
    this._outlines = null;
    if (this._wheelFn) {
      document.removeEventListener("wheel", this._wheelFn);
      this._wheelFn = null;
    }
    // ed-params и ed-buckets живут внутри section-objects — секцию
    // схлопывает _toggleSection. Тут только чистим содержимое.
    const params = document.getElementById("ed-params");
    if (params) params.innerHTML = "";
    const buckets = document.getElementById("ed-buckets");
    if (buckets) buckets.innerHTML = "";
    this.dragging = null;
  }

  // ---------- Селектор ratio-букетов ----------

  _buildBucketSelector() {
    const wrap = document.getElementById("ed-buckets");
    if (!wrap) return;
    const live = detectCurrentBucket();
    const writeTo = this._saveBucket();
    const labels = {
      ultraWide: "Ultra-wide (21:9+)",
      desktop: "Desktop (16:9)",
      square: "Square (~1:1)",
      tablet: "Tablet (3:4)",
      phone: "Phone (9:16)",
      ultraTall: "Ultra-tall (9:21)",
    };
    const btnCss = (b) => {
      const isLive = b === live;
      const isEdit = b === writeTo;
      const bg = isEdit ? "#7561C8" : isLive ? "#E07A2A" : "#eee";
      const fg = isEdit || isLive ? "#fff" : "#333";
      return `padding:5px 8px;margin:2px;background:${bg};color:${fg};border:1px solid #bbb;border-radius:4px;cursor:pointer;font:bold 10px Arial,sans-serif;flex:1;min-width:0;`;
    };
    let html = "";
    html += `<div style="margin-bottom:6px;">Активный экран: <b style="color:#E07A2A;">${live}</b> · save → <b style="color:#7561C8;">${writeTo}</b></div>`;
    html += '<div style="margin-bottom:3px;color:#666;font-size:9px;">Горизонтальные:</div>';
    html += '<div style="display:flex;flex-wrap:wrap;margin-bottom:4px;">';
    for (const b of HORIZONTAL_BUCKETS.concat(["square"])) {
      html += `<button data-bucket="${b}" style="${btnCss(b)}">${labels[b]}</button>`;
    }
    html += "</div>";
    html += '<div style="margin-bottom:3px;color:#666;font-size:9px;">Вертикальные:</div>';
    html += '<div style="display:flex;flex-wrap:wrap;">';
    for (const b of PORTRAIT_BUCKETS) {
      html += `<button data-bucket="${b}" style="${btnCss(b)}">${labels[b]}</button>`;
    }
    html += "</div>";
    wrap.innerHTML = html;
    wrap.querySelectorAll("button[data-bucket]").forEach((btn) => {
      btn.onclick = () => {
        const v = btn.dataset.bucket;
        // Клик по уже-выбранному → сброс в auto. Клик по другому → override.
        this.editingBucket = this.editingBucket === v ? null : v;
        this._buildBucketSelector();
        this._showSelected();
      };
    });
    wrap.style.display = "block";
  }

  // ---------- Блок параметров (числовые поля для каждого таргета) ----------

  _buildParamsBlock() {
    if (!this.targets.length) this.collectTargets();
    const wrap = document.getElementById("ed-params");
    if (!wrap) return;
    wrap.innerHTML = "";
    const inputStyle =
      "width:54px;padding:2px 4px;font:11px monospace;border:1px solid #ccc;border-radius:3px;";
    for (const t of this.targets) {
      const row = document.createElement("div");
      row.style.cssText =
        "display:flex;align-items:center;gap:3px;margin-bottom:4px;font-size:10px;";
      row.innerHTML =
        `<span style="width:90px;font-weight:700;color:#333;">${t.desc.id}</span>` +
        `<span>X</span><input data-id="${t.desc.id}" data-prop="x" type="number" step="1" style="${inputStyle}">` +
        `<span>Y</span><input data-id="${t.desc.id}" data-prop="y" type="number" step="1" style="${inputStyle}">` +
        `<span>S</span><input data-id="${t.desc.id}" data-prop="s" type="number" step="0.01" style="${inputStyle}">`;
      wrap.appendChild(row);
    }
    wrap.querySelectorAll("input").forEach((inp) => {
      inp.oninput = () => this._onInputChange(inp);
    });
    this._refreshParamsBlock();
    wrap.style.display = "block";
  }

  _refreshParamsBlock() {
    const wrap = document.getElementById("ed-params");
    if (!wrap || wrap.style.display === "none") return;
    wrap.querySelectorAll("input").forEach((inp) => {
      if (document.activeElement === inp) return; // не перезаписывать набираемое
      const t = this.targets.find((x) => x.desc.id === inp.dataset.id);
      if (!t) return;
      const v = t.obj.view;
      if (!v) return;
      let xVal = v.position.x;
      let yVal = v.position.y;
      if (t.desc.topAnchor) {
        const off = getAlignLocal(v, 0.5, 0);
        if (off) {
          xVal = v.position.x - off.x;
          yVal = v.position.y - off.y;
        }
      }
      if (inp.dataset.prop === "x") inp.value = Math.round(xVal);
      else if (inp.dataset.prop === "y") inp.value = Math.round(yVal);
      else if (inp.dataset.prop === "s") inp.value = +v.scale.x.toFixed(3);
    });
  }

  _onInputChange(inp) {
    const t = this.targets.find((x) => x.desc.id === inp.dataset.id);
    if (!t) return;
    const v = t.obj.view;
    if (!v) return;
    const val = parseFloat(inp.value);
    if (isNaN(val)) return;
    if (t.desc.topAnchor) {
      // Для topAnchor конвертим из engine's config-coords в parent-local.
      const off = getAlignLocal(v, 0.5, 0) || { x: 0, y: 0 };
      if (inp.dataset.prop === "x") v.position.x = val + off.x;
      else if (inp.dataset.prop === "y") v.position.y = val + off.y;
      else if (inp.dataset.prop === "s") {
        v.scale.x = val;
        v.scale.y = val;
      }
    } else {
      if (inp.dataset.prop === "x") v.position.x = val;
      else if (inp.dataset.prop === "y") v.position.y = val;
      else if (inp.dataset.prop === "s") {
        v.scale.x = val;
        v.scale.y = val;
      }
    }
    this.selected = t;
    this._showSelected();
    this._autoSaveDebounced();
  }

  _onDown(t, e) {
    if (e.stopPropagation) e.stopPropagation();
    this.dragging = t;
    this.selected = t;
    const v = t.obj.view;
    // Стопаем активные анимации move-* на target — иначе они борются за
    // view.position и драг отскакивает.
    const anims = t.obj.animations || {};
    Object.keys(anims).forEach((k) => {
      const a = anims[k];
      if (a && a.stop && a.isActive) {
        try {
          a.stop();
        } catch (e) {}
      }
    });
    const local = v.parent.toLocal(e.global);
    this.dragOffset.x = local.x - v.position.x;
    this.dragOffset.y = local.y - v.position.y;
    this._showSelected();
  }

  _onMove(e) {
    if (!this.dragging) return;
    const v = this.dragging.obj.view;
    const local = v.parent.toLocal(e.global);
    v.position.x = local.x - this.dragOffset.x;
    v.position.y = local.y - this.dragOffset.y;
    this._showSelected();
    this._refreshParamsBlock();
  }

  _onUp() {
    if (this.dragging) {
      this.dragging = null;
      this._autoSave();
    }
  }

  _onWheel(e) {
    if (!this.selected) return;
    if (e.target && e.target.tagName !== "CANVAS") return;
    e.preventDefault();
    const v = this.selected.obj.view;
    const k = e.deltaY > 0 ? 0.95 : 1.05;
    v.scale.x = Math.max(0.1, Math.min(5, v.scale.x * k));
    v.scale.y = Math.max(0.1, Math.min(5, v.scale.y * k));
    this._showSelected();
    this._refreshParamsBlock();
    this._autoSaveDebounced();
  }

  _showSelected() {
    if (!this.selected || !this.statusEl) return;
    const v = this.selected.obj.view;
    const live = detectCurrentBucket();
    const writeTo = this._saveBucket();
    this.statusEl.innerHTML =
      `<b>${this.selected.desc.id}</b><br>` +
      `pos: ${v.position.x.toFixed(0)}, ${v.position.y.toFixed(0)}<br>` +
      `scale: ${v.scale.x.toFixed(2)}<br>` +
      `<i>экран: <b>${live}</b> · save → <b>${writeTo}</b></i>`;
  }

  // Записать текущее состояние всех таргетов в localStorage. Вызывается
  // автоматически при каждом изменении (drag/wheel/input).
  _autoSave() {
    if (!this.active) return;
    if (!this.targets.length) this.collectTargets();
    const bucket = this._saveBucket();
    const data = migrate(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
    data[bucket] = data[bucket] || {};
    for (const t of this.targets) {
      const v = t.obj.view;
      if (!v) continue;
      let xOut = v.position.x;
      let yOut = v.position.y;
      if (t.desc.topAnchor) {
        // saved.x/y = engine's config.position.x/y для absolute+align(0.5, 0):
        // offsets от верхне-центральной точки канваса в parent-local coords.
        const off = getAlignLocal(v, 0.5, 0);
        if (off) {
          xOut = v.position.x - off.x;
          yOut = v.position.y - off.y;
        }
      }
      data[bucket][t.desc.id] = {
        x: Math.round(xOut),
        y: Math.round(yOut),
        scaleX: +v.scale.x.toFixed(3),
        scaleY: +v.scale.y.toFixed(3),
      };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  _autoSaveDebounced() {
    if (this._asTimer) clearTimeout(this._asTimer);
    this._asTimer = setTimeout(() => this._autoSave(), 150);
  }

  save() {
    // Текущее состояние уже в localStorage (autosave). Просто читаем
    // его, показываем в textarea и пытаемся скопировать в буфер.
    this._autoSave();
    const data = migrate(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
    const pretty = JSON.stringify(data, null, 2);
    console.log("[EditorTool] saved layout:\n" + pretty);

    // Показываем JSON в текстовом поле — оттуда можно скопировать кнопкой
    // или вручную (Ctrl+A → Ctrl+C). Авто-копирование пробуем сразу,
    // но не падаем если не вышло.
    if (this.dumpEl) {
      this.dumpEl.value = pretty;
      this.dumpEl.style.display = "block";
    }
    if (this.copyBtn) this.copyBtn.style.display = "block";
    this.statusEl.innerHTML =
      "Сохранено в localStorage. JSON ниже — жми <b>«Скопировать в буфер»</b> или выдели вручную.";
  }

  resetAndReload() {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }

  applyStoredLayout() {
    const raw = localStorage.getItem(STORAGE_KEY);
    let stored = {};
    if (raw) {
      try {
        stored = JSON.parse(raw) || {};
      } catch (e) {}
    }
    stored = migrate(stored);

    // Per-target merge: дефолты + сохранённые правки.
    const merged = {};
    for (const b of BUCKETS) {
      merged[b] = Object.assign(
        {},
        (DEFAULT_LAYOUT && DEFAULT_LAYOUT[b]) || {},
        (stored && stored[b]) || {}
      );
      if (!Object.keys(merged[b]).length) delete merged[b];
    }
    if (!Object.keys(merged).length) return;

    const bucket = pickBucketFromData(merged);
    if (!bucket) return;
    const layout = merged[bucket];

    if (!this.targets.length) this.collectTargets();
    const isPortrait = isPortraitBucket(bucket);
    for (const t of this.targets) {
      const e = layout[t.desc.id];
      if (!e) continue;
      const v = t.obj.view;
      if (!v) continue;
      if (t.desc.topAnchor) {
        // saved.x/y — offsets от align(0.5, 0) (top-center) канваса.
        // Пишем в config (для анимаций / engine resize handlers) и зовём
        // applyPosition() — если engine'овская обёртка её поддерживает,
        // она пересчитает позицию с учётом текущей ориентации. Иначе
        // (для legacy/wrapped объектов) fallback вычисляет напрямую через
        // alignLocal. Y-фильтр в migrate() режет отрицательные/слишком
        // большие значения — это ловит контаминированные сохранения
        // из старого pre-topAnchor кода (raw view.position).
        const tcfg = t.obj.config || {};
        if (tcfg.position) {
          tcfg.position.x = e.x;
          tcfg.position.y = e.y;
        }
        if (tcfg.position_portrait) {
          tcfg.position_portrait.x = e.x;
          tcfg.position_portrait.y = e.y;
        }
        if (typeof t.obj.applyPosition === "function") {
          t.obj.applyPosition();
        } else {
          const off = getAlignLocal(v, 0.5, 0);
          if (off) {
            v.position.x = e.x + off.x;
            v.position.y = e.y + off.y;
          } else {
            v.position.x = e.x;
            v.position.y = e.y;
          }
        }
        if (e.scaleX != null) {
          v.scale.x = e.scaleX;
          v.scale.y = e.scaleY;
        }
        continue;
      }
      v.position.x = e.x;
      v.position.y = e.y;
      if (e.scaleX != null) {
        v.scale.x = e.scaleX;
        v.scale.y = e.scaleY;
      }
      // Зеркалим в config — чтобы animations (animateCharacterIn,
      // moveOut и т.д.) использовали актуальную точку.
      const cfg = t.obj.config || {};
      const pkey =
        isPortrait && cfg.position_portrait ? "position_portrait" : "position";
      if (cfg[pkey]) {
        cfg[pkey].x = e.x;
        cfg[pkey].y = e.y;
      }
      const skey =
        isPortrait && cfg.scale_portrait ? "scale_portrait" : "scale";
      if (cfg[skey] && e.scaleX != null) {
        cfg[skey].x = e.scaleX;
        cfg[skey].y = e.scaleY;
      }
    }
  }
}
