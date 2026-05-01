import { APPLICATION_EVENTS, ObjectLinks, PIXI } from "PlayableAdsEngine";
import { OBJECTS } from "../const";

const STORAGE_KEY = "rcp_editor_layout_v1";

// Движок раскладки имеет 8 ratio-buckets для каждой ориентации
// (см. window.RATIO в Application.js и BaseViewObject.detectPositionName).
// Порядок iteration важен — он совпадает с порядком в Application.js.
const RATIO_KEYS = ["xlg", "lg", "md", "sm", "xsm", "mn", "emn"];
const LANDSCAPE_BUCKETS = ["default", ...RATIO_KEYS];
const PORTRAIT_BUCKETS = ["portrait", ...RATIO_KEYS.map((k) => "portrait_" + k)];
const ALL_BUCKETS = [...LANDSCAPE_BUCKETS, ...PORTRAIT_BUCKETS];

// Дефолтный layout — встраивается в код, применяется на чистой сборке
// (без localStorage). Получен из in-game редактора. localStorage юзера
// имеет приоритет: его правки override-ят эти значения.
// Старые ключи "landscape"/"portrait" мигрируем в "default"/"portrait".
const DEFAULT_LAYOUT = {
  // Portrait, ratio < 2.15 (вертикальные экраны вообще)
  portrait: {
    italian_man: { x: -360, y: 205, scaleX: 1, scaleY: 1 },
    pretty_woman: { x: -130, y: 120, scaleX: 1, scaleY: 1 },
    old_grambler: { x: 80, y: 114, scaleX: 1, scaleY: 1 },
    tooltip1: { x: 73, y: -506, scaleX: 0.935, scaleY: 0.935 },
    tooltip2: { x: -350, y: -504, scaleX: 0.93, scaleY: 0.93 },
    tooltip3: { x: -123, y: -504, scaleX: 0.937, scaleY: 0.937 },
    hudPanel: { x: 2, y: -465, scaleX: 1.34, scaleY: 1.34 },
  },
  // Portrait + 4:3 / iPad-podобные узкие пропорции (1.32 ≤ ratio < 1.49)
  portrait_mn: {
    italian_man: { x: -360, y: 205, scaleX: 1, scaleY: 1 },
    pretty_woman: { x: -130, y: 120, scaleX: 1, scaleY: 1 },
    old_grambler: { x: 80, y: 114, scaleX: 1, scaleY: 1 },
    tooltip1: { x: 73, y: -506, scaleX: 0.935, scaleY: 0.935 },
    tooltip2: { x: -350, y: -504, scaleX: 0.93, scaleY: 0.93 },
    tooltip3: { x: -123, y: -504, scaleX: 0.937, scaleY: 0.937 },
    hudPanel: { x: -4, y: -374, scaleX: 1.34, scaleY: 1.34 },
  },
  // Landscape (default), сверхширокие экраны ratio ≥ 2.15
  default: {
    italian_man: { x: -334, y: 205, scaleX: 1, scaleY: 1 },
    pretty_woman: { x: -130, y: 120, scaleX: 1, scaleY: 1 },
    old_grambler: { x: 126, y: 114, scaleX: 1, scaleY: 1 },
    tooltip1: { x: -310, y: -440, scaleX: 0.85, scaleY: 0.85 },
    tooltip2: { x: -86, y: -438, scaleX: 0.85, scaleY: 0.85 },
    tooltip3: { x: 130, y: -440, scaleX: 0.85, scaleY: 0.85 },
    hudPanel: { x: 0, y: -280, scaleX: 1, scaleY: 1 },
  },
  // Landscape + 4:3 / почти квадратный экран (1.32 ≤ ratio < 1.49)
  mn: {
    italian_man: { x: -334, y: 205, scaleX: 1, scaleY: 1 },
    pretty_woman: { x: -130, y: 120, scaleX: 1, scaleY: 1 },
    old_grambler: { x: 126, y: 114, scaleX: 1, scaleY: 1 },
    tooltip1: { x: -310, y: -440, scaleX: 0.85, scaleY: 0.85 },
    tooltip2: { x: -86, y: -438, scaleX: 0.85, scaleY: 0.85 },
    tooltip3: { x: 130, y: -440, scaleX: 0.85, scaleY: 0.85 },
    hudPanel: { x: -21, y: -282, scaleX: 1, scaleY: 1 },
  },
};

// Имя букета, которое выбрал бы движок для текущего экрана
// (в точности повторяет логику BaseViewObject.detectPositionName).
function detectCurrentBucket() {
  const r = window.application && window.application.renderer;
  if (!r || !window.RATIO) return "default";
  const isPortrait = r.isPortrait;
  const lr = r.getLandscapeRatio;
  let name = isPortrait ? "portrait" : "default";
  for (const key of RATIO_KEYS) {
    const threshold = window.RATIO[key.toUpperCase()];
    if (lr >= threshold) break;
    name = (isPortrait ? "portrait_" : "") + key;
  }
  return name;
}

// Какой из существующих в data букетов engine выбрал бы для текущего экрана
// (cascade: только те, что реально присутствуют). Если ничего не подошло
// — возвращаем base ("default" или "portrait", с фолбэком на default).
function pickBucketFromData(data) {
  const r = window.application && window.application.renderer;
  if (!r || !window.RATIO) return data["default"] ? "default" : null;
  const isPortrait = r.isPortrait;
  const lr = r.getLandscapeRatio;
  let name = isPortrait ? "portrait" : "default";
  for (const key of RATIO_KEYS) {
    const threshold = window.RATIO[key.toUpperCase()];
    if (lr >= threshold) break;
    const candidate = (isPortrait ? "portrait_" : "") + key;
    if (data[candidate]) name = candidate;
  }
  if (!data[name]) {
    if (isPortrait && data["default"]) return "default";
    return null;
  }
  return name;
}

// Миграция старых ключей "landscape"→"default".
function migrate(stored) {
  if (!stored || typeof stored !== "object") return stored || {};
  if (stored.landscape && !stored.default) {
    stored.default = stored.landscape;
    delete stored.landscape;
  }
  return stored;
}

// Список редактируемых объектов: имя + способ найти baseObject.
// path: spawn-character доступ через буферный контейнер; linkID — через ObjectLinks.
const TARGETS = [
  { id: "italian_man", child: "italian_man" },
  { id: "pretty_woman", child: "pretty_woman" },
  { id: "old_grambler", child: "old_grambler" },
  { id: "tooltip1", linkID: OBJECTS.tooltip1 },
  { id: "tooltip2", linkID: OBJECTS.tooltip2 },
  { id: "tooltip3", linkID: OBJECTS.tooltip3 },
  { id: "hudPanel", linkID: OBJECTS.hudPanel },
];

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
    this._buildUI();
    this._listenResize();
  }

  _orientation() {
    const r = window.application && window.application.renderer;
    return r && r.isPortrait ? "portrait" : "landscape";
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
    wrap.innerHTML =
      '<button id="ed-toggle" style="padding:6px 10px;background:#7561C8;color:#fff;border:none;border-radius:6px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.3);">⚙ Читы</button>' +
      '<div id="ed-panel" style="display:none;margin-top:6px;background:#fff;padding:10px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.25);min-width:220px;">' +
      '<button id="ed-mode" style="display:block;width:100%;padding:7px 10px;margin-bottom:6px;background:#E07A2A;color:#fff;border:none;border-radius:5px;cursor:pointer;">Перемещение объектов</button>' +
      '<button id="ed-save" style="display:block;width:100%;padding:7px 10px;margin-bottom:6px;background:#4FA8E0;color:#fff;border:none;border-radius:5px;cursor:pointer;">Сохранить положения</button>' +
      '<button id="ed-reset" style="display:block;width:100%;padding:7px 10px;background:#999;color:#fff;border:none;border-radius:5px;cursor:pointer;">Сбросить → Reload</button>' +
      '<div id="ed-status" style="margin-top:8px;font-size:11px;color:#444;line-height:1.35;"></div>' +
      '<div id="ed-buckets" style="display:none;margin-top:10px;border-top:1px solid #ddd;padding-top:8px;font-size:10px;"></div>' +
      '<div id="ed-params" style="display:none;margin-top:10px;border-top:1px solid #ddd;padding-top:8px;max-height:50vh;overflow:auto;"></div>' +
      '<textarea id="ed-dump" readonly style="display:none;width:100%;height:140px;margin-top:8px;font:11px monospace;padding:6px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;resize:vertical;"></textarea>' +
      '<button id="ed-copy" style="display:none;width:100%;padding:6px 10px;margin-top:6px;background:#7561C8;color:#fff;border:none;border-radius:5px;cursor:pointer;">Скопировать в буфер</button>' +
      "</div>";
    document.body.appendChild(wrap);

    document.getElementById("ed-toggle").onclick = () => {
      const p = document.getElementById("ed-panel");
      p.style.display = p.style.display === "none" ? "block" : "none";
    };
    document.getElementById("ed-mode").onclick = () => this.toggle();
    document.getElementById("ed-save").onclick = () => this.save();
    document.getElementById("ed-reset").onclick = () => this.resetAndReload();
    document.getElementById("ed-copy").onclick = () => this._copyDump();

    this.statusEl = document.getElementById("ed-status");
    this.dumpEl = document.getElementById("ed-dump");
    this.copyBtn = document.getElementById("ed-copy");
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
      this.statusEl.innerHTML =
        "Режим: <b>ВКЛ</b>. Тяни мышью; колесо — масштаб.<br>" +
        `Ориентация: <b>${this._orientation()}</b>`;
    } else {
      this._disableDrag();
      this.statusEl.textContent = "Режим выключен.";
    }
    const btn = document.getElementById("ed-mode");
    btn.style.background = this.active ? "#888" : "#E07A2A";
    btn.textContent = this.active ? "Стоп" : "Перемещение объектов";
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

    // Подсветка для каждого таргета — видно, что доступно для перемещения.
    this._outlines = [];
    for (const t of this.targets) {
      const v = t.obj.view;
      const isCharacter = !!t.desc.child;
      const outline = new PIXI.Graphics();
      outline.lineStyle(2, isCharacter ? 0xff8a4d : 0x4fa8e0, 0.9);
      // Рамка по getLocalBounds или generous fallback.
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
      v.addChild(outline);
      this._outlines.push({ t, outline });
    }

    this._wheelFn = (e) => this._onWheel(e);
    document.addEventListener("wheel", this._wheelFn, { passive: false });

    // Селектор ratio-букетов и блок параметров.
    this._buildBucketSelector();
    this._buildParamsBlock();
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
    if (this._outlines) {
      for (const { outline } of this._outlines) {
        if (outline.parent) outline.parent.removeChild(outline);
        outline.destroy && outline.destroy();
      }
      this._outlines = null;
    }
    if (this._wheelFn) {
      document.removeEventListener("wheel", this._wheelFn);
      this._wheelFn = null;
    }
    const params = document.getElementById("ed-params");
    if (params) params.style.display = "none";
    const buckets = document.getElementById("ed-buckets");
    if (buckets) buckets.style.display = "none";
    this.dragging = null;
  }

  // ---------- Селектор ratio-букетов ----------

  _buildBucketSelector() {
    const wrap = document.getElementById("ed-buckets");
    if (!wrap) return;
    const live = detectCurrentBucket();
    const writeTo = this._saveBucket();
    const btnCss = (b) => {
      const isLive = b === live;
      const isEdit = b === writeTo;
      const bg = isEdit ? "#7561C8" : isLive ? "#E07A2A" : "#eee";
      const fg = isEdit || isLive ? "#fff" : "#333";
      return `padding:3px 6px;margin:1px;background:${bg};color:${fg};border:1px solid #bbb;border-radius:3px;cursor:pointer;font:bold 9px monospace;`;
    };
    const ratioLabel = (b) => {
      if (b === "default") return "default · ≥2.15";
      if (b === "portrait") return "portrait · ≥2.15";
      const k = (b.replace("portrait_", "")).toUpperCase();
      const cur = window.RATIO ? window.RATIO[k] : null;
      return `${b} · <${cur || k}`;
    };
    let html = "";
    html += `<div style="margin-bottom:4px;">Активный экран: <b style="color:#E07A2A;">${live}</b></div>`;
    html += '<div style="margin-bottom:4px;color:#666;">Сохранять в (клик меняет цель save):</div>';
    html += '<div><button data-bucket="" style="' +
      btnCss(this.editingBucket ? "" : "__auto__") +
      '">авто (по экрану)</button></div>';
    html += '<div style="margin-top:4px;"><b>Landscape:</b></div>';
    html += '<div style="display:flex;flex-wrap:wrap;">';
    for (const b of LANDSCAPE_BUCKETS) {
      html += `<button data-bucket="${b}" title="${ratioLabel(b)}" style="${btnCss(b)}">${b}</button>`;
    }
    html += "</div>";
    html += '<div style="margin-top:4px;"><b>Portrait:</b></div>';
    html += '<div style="display:flex;flex-wrap:wrap;">';
    for (const b of PORTRAIT_BUCKETS) {
      const short = b === "portrait" ? "portrait" : b.replace("portrait_", "p_");
      html += `<button data-bucket="${b}" title="${ratioLabel(b)}" style="${btnCss(b)}">${short}</button>`;
    }
    html += "</div>";
    wrap.innerHTML = html;
    wrap.querySelectorAll("button[data-bucket]").forEach((btn) => {
      btn.onclick = () => {
        const v = btn.dataset.bucket;
        this.editingBucket = v ? v : null; // "" → авто
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
      if (inp.dataset.prop === "x") inp.value = Math.round(v.position.x);
      else if (inp.dataset.prop === "y") inp.value = Math.round(v.position.y);
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
    if (inp.dataset.prop === "x") v.position.x = val;
    else if (inp.dataset.prop === "y") v.position.y = val;
    else if (inp.dataset.prop === "s") {
      v.scale.x = val;
      v.scale.y = val;
    }
    this.selected = t;
    this._showSelected();
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
    this.dragging = null;
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

  save() {
    if (!this.targets.length) this.collectTargets();
    const bucket = this._saveBucket();
    const data = migrate(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
    data[bucket] = data[bucket] || {};
    for (const t of this.targets) {
      const v = t.obj.view;
      data[bucket][t.desc.id] = {
        x: Math.round(v.position.x),
        y: Math.round(v.position.y),
        scaleX: +v.scale.x.toFixed(3),
        scaleY: +v.scale.y.toFixed(3),
      };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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

    // Сливаем DEFAULT_LAYOUT и stored по букетам (per-target override).
    const merged = {};
    for (const b of ALL_BUCKETS) {
      merged[b] = Object.assign(
        {},
        (DEFAULT_LAYOUT && DEFAULT_LAYOUT[b]) || {},
        (stored && stored[b]) || {}
      );
      if (!Object.keys(merged[b]).length) delete merged[b];
    }
    if (!Object.keys(merged).length) return;

    // Engine-style cascade: какой именно букет применять для текущего экрана.
    const bucket = pickBucketFromData(merged);
    if (!bucket) return;
    const layout = merged[bucket];

    if (!this.targets.length) this.collectTargets();
    const isPortrait = bucket === "portrait" || bucket.startsWith("portrait_");
    for (const t of this.targets) {
      const e = layout[t.desc.id];
      if (!e) continue;
      const v = t.obj.view;
      if (!v) continue;
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
