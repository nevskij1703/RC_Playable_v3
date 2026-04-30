import { APPLICATION_EVENTS, ObjectLinks, PIXI } from "PlayableAdsEngine";
import { OBJECTS } from "../const";

const STORAGE_KEY = "rcp_editor_layout_v1";

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
        setTimeout(() => this.applyStoredLayout(), 80);
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
    this._stageMove = (e) => this._onMove(e);
    this._stageUp = () => this._onUp();
    stage.eventMode = "static";
    stage.on("globalpointermove", this._stageMove);
    stage.on("pointerup", this._stageUp);
    stage.on("pointerupoutside", this._stageUp);

    this._handlers = [];
    for (const t of this.targets) {
      const v = t.obj.view;
      v.eventMode = "static";
      v.cursor = "move";
      // Расширенный hitArea — для пустых контейнеров и spine.
      const b = v.getLocalBounds && v.getLocalBounds();
      if (b && b.width > 4 && b.height > 4) {
        v.hitArea = new PIXI.Rectangle(b.x, b.y, b.width, b.height);
      } else {
        v.hitArea = new PIXI.Rectangle(-90, -120, 180, 240);
      }
      const fn = (e) => this._onDown(t, e);
      v.on("pointerdown", fn);
      this._handlers.push({ v, fn });
    }

    this._wheelFn = (e) => this._onWheel(e);
    document.addEventListener("wheel", this._wheelFn, { passive: false });
  }

  _disableDrag() {
    const stage = window.application.renderer.stage;
    if (this._stageMove) {
      stage.off("globalpointermove", this._stageMove);
      stage.off("pointerup", this._stageUp);
      stage.off("pointerupoutside", this._stageUp);
      this._stageMove = this._stageUp = null;
    }
    if (this._handlers) {
      for (const { v, fn } of this._handlers) {
        v.off("pointerdown", fn);
      }
      this._handlers = null;
    }
    if (this._wheelFn) {
      document.removeEventListener("wheel", this._wheelFn);
      this._wheelFn = null;
    }
    this.dragging = null;
  }

  _onDown(t, e) {
    if (e.stopPropagation) e.stopPropagation();
    this.dragging = t;
    this.selected = t;
    const v = t.obj.view;
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
  }

  _showSelected() {
    if (!this.selected || !this.statusEl) return;
    const v = this.selected.obj.view;
    this.statusEl.innerHTML =
      `<b>${this.selected.desc.id}</b><br>` +
      `pos: ${v.position.x.toFixed(0)}, ${v.position.y.toFixed(0)}<br>` +
      `scale: ${v.scale.x.toFixed(2)}<br>` +
      `<i>${this._orientation()}</i>`;
  }

  save() {
    if (!this.targets.length) this.collectTargets();
    const orient = this._orientation();
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    data[orient] = data[orient] || {};
    for (const t of this.targets) {
      const v = t.obj.view;
      data[orient][t.desc.id] = {
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
    if (!raw) return;
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return;
    }
    const orient = this._orientation();
    const layout = data && data[orient];
    if (!layout) return;
    if (!this.targets.length) this.collectTargets();
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
      // Зеркалим в config — чтобы animations и AdaptivePositionBehavior
      // пересчитывались с новых значений на следующем resize.
      const cfg = t.obj.config || {};
      const pkey =
        orient === "portrait" && cfg.position_portrait
          ? "position_portrait"
          : "position";
      if (cfg[pkey]) {
        cfg[pkey].x = e.x;
        cfg[pkey].y = e.y;
      }
      const skey =
        orient === "portrait" && cfg.scale_portrait ? "scale_portrait" : "scale";
      if (cfg[skey]) {
        cfg[skey].x = e.scaleX;
        cfg[skey].y = e.scaleY;
      }
    }
  }
}
