import { ObjectLinks } from "PlayableAdsEngine";
import { OBJECTS } from "../const";
import { HUD_PANEL_TOP_OFFSET } from "../displayObjects/ui/HudPanel";

const STORAGE_KEY = "rcp_hud_offset_v1";

// Отдельный инструмент для тонкой настройки расстояния между верхом
// HUD-панели и верхом видимой области (фон / канвас). Дизайнер крутит
// число +/- кнопками или вводит вручную, видит результат в реальном
// времени и экспортирует JSON. Получив JSON, разработчик прописывает
// его как новое значение по умолчанию в HudPanel._alignBelowBackground.
//
// Реализация максимально изолирована: инструмент пишет offset только в
// window.__rcpHudOffset, который HudPanel читает в snap-функции. Это
// значит, что любые правки HUD layout-а через EditorTool/cheats не
// перетираются и наоборот.
export default class HudOffsetTool {
  constructor() {
    this.offset = this._loadStored();
    window.__rcpHudOffset = this.offset;
    this._buildUI();
    this._scheduleApply();
  }

  _loadStored() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const v = parseFloat(raw);
      return Number.isFinite(v) ? v : HUD_PANEL_TOP_OFFSET;
    } catch (e) {
      return HUD_PANEL_TOP_OFFSET;
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, String(this.offset));
    } catch (e) {}
  }

  _buildUI() {
    if (document.getElementById("rcp-hud-offset-ui")) return;
    const wrap = document.createElement("div");
    wrap.id = "rcp-hud-offset-ui";
    wrap.style.cssText =
      "position:fixed;top:8px;right:8px;z-index:99999;font:bold 12px Arial,sans-serif;user-select:none;";
    wrap.innerHTML =
      '<button id="hot-toggle" style="padding:6px 10px;background:#4FA8E0;color:#fff;border:none;border-radius:6px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.3);">↕ HUD offset</button>' +
      '<div id="hot-panel" style="display:none;margin-top:6px;background:#fff;padding:10px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.25);min-width:240px;">' +
      '<div style="margin-bottom:6px;font-size:11px;color:#444;line-height:1.4;">Расстояние от верхней границы фона до верха HUD-панели (px). Отрицательные — поднимают панель выше бг (в чёрные поля).</div>' +
      '<div style="display:flex;align-items:center;gap:4px;margin-bottom:8px;">' +
      '<button class="hot-step" data-d="-10">−10</button>' +
      '<button class="hot-step" data-d="-1">−1</button>' +
      '<input id="hot-input" type="number" step="1" value="0" style="flex:1;min-width:0;width:60px;padding:6px;border:1px solid #ccc;border-radius:4px;text-align:center;font:bold 13px Arial;">' +
      '<button class="hot-step" data-d="1">+1</button>' +
      '<button class="hot-step" data-d="10">+10</button>' +
      "</div>" +
      '<div id="hot-info" style="margin-bottom:8px;font-size:11px;color:#666;line-height:1.4;"></div>' +
      '<button id="hot-reset" style="display:block;width:100%;padding:6px 10px;margin-bottom:6px;background:#999;color:#fff;border:none;border-radius:5px;cursor:pointer;">Сбросить к дефолту</button>' +
      '<button id="hot-export" style="display:block;width:100%;padding:7px 10px;background:#7561C8;color:#fff;border:none;border-radius:5px;cursor:pointer;">Экспорт JSON</button>' +
      '<textarea id="hot-dump" readonly style="display:none;width:100%;height:90px;margin-top:8px;font:11px monospace;padding:6px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;resize:vertical;"></textarea>' +
      '<button id="hot-copy" style="display:none;width:100%;padding:6px 10px;margin-top:6px;background:#4FA8E0;color:#fff;border:none;border-radius:5px;cursor:pointer;">Скопировать в буфер</button>' +
      '<div id="hot-status" style="margin-top:8px;font-size:11px;color:#444;"></div>' +
      "</div>";
    document.body.appendChild(wrap);

    if (!document.getElementById("rcp-hud-offset-style")) {
      const style = document.createElement("style");
      style.id = "rcp-hud-offset-style";
      style.textContent =
        ".hot-step{padding:6px 6px;background:#E07A2A;color:#fff;border:none;border-radius:4px;cursor:pointer;font:bold 11px Arial;min-width:34px;}" +
        ".hot-step:hover{background:#c46820;}";
      document.head.appendChild(style);
    }

    document.getElementById("hot-toggle").onclick = () => {
      const p = document.getElementById("hot-panel");
      p.style.display = p.style.display === "none" ? "block" : "none";
      if (p.style.display === "block") this._refreshInfo();
    };

    this.input = document.getElementById("hot-input");
    this.input.value = this.offset;
    this.statusEl = document.getElementById("hot-status");
    this.dumpEl = document.getElementById("hot-dump");
    this.copyBtn = document.getElementById("hot-copy");
    this.infoEl = document.getElementById("hot-info");

    wrap.querySelectorAll(".hot-step").forEach((btn) => {
      btn.onclick = () => {
        const d = parseFloat(btn.dataset.d);
        const cur = parseFloat(this.input.value) || 0;
        this._setOffset(cur + d);
      };
    });

    this.input.oninput = () => {
      const v = parseFloat(this.input.value);
      if (Number.isFinite(v)) this._setOffset(v, /*skipInputUpdate=*/ true);
    };

    document.getElementById("hot-reset").onclick = () =>
      this._setOffset(HUD_PANEL_TOP_OFFSET);
    document.getElementById("hot-export").onclick = () => this._export();
    this.copyBtn.onclick = () => this._copyDump();
  }

  _setOffset(v, skipInputUpdate) {
    this.offset = v;
    if (!skipInputUpdate && this.input) this.input.value = v;
    window.__rcpHudOffset = v;
    this._save();
    this._apply();
    this._refreshInfo();
    if (this.statusEl) {
      this.statusEl.innerHTML = `offset = <b>${v}</b> px`;
    }
  }

  // Триггер пересчёта позиции HUD. Если HudPanel ещё не создан (early
  // boot), повторим в _scheduleApply через таймауты.
  _apply() {
    const hud = ObjectLinks.get(OBJECTS.hudPanel);
    if (hud && typeof hud._alignBelowBackground === "function") {
      hud._alignBelowBackground();
    }
  }

  _scheduleApply() {
    [120, 350, 800, 1600].forEach((ms) => setTimeout(() => this._apply(), ms));
  }

  // Показывает текущие живые координаты — помогает понять, что offset
  // делает в реальном времени (bg.y, фактический верх панели в канвасе).
  _refreshInfo() {
    if (!this.infoEl) return;
    const hud = ObjectLinks.get(OBJECTS.hudPanel);
    const v = hud && hud.view;
    let bgY = "—";
    let hudTop = "—";
    if (v) {
      const b = v.getBounds && v.getBounds();
      if (b) hudTop = Math.round(b.y);
      // Найти back-sprite
      const loc = ObjectLinks.get(OBJECTS.location);
      const back =
        loc &&
        loc.view &&
        loc.view.children &&
        loc.view.children[0] &&
        loc.view.children[0].children &&
        loc.view.children[0].children[0];
      if (back && back.getBounds) {
        const bb = back.getBounds();
        bgY = Math.round(bb.y);
      }
    }
    this.infoEl.innerHTML =
      `bg.top = <b>${bgY}</b>, panel.top = <b>${hudTop}</b>`;
  }

  _export() {
    const json = JSON.stringify(
      {
        hudPanelTopOffset: this.offset,
        meta: {
          comment:
            "Расстояние от bg.top до panel.top (px, в координатах канваса). Применить как default в HudPanel._alignBelowBackground.",
        },
      },
      null,
      2
    );
    if (this.dumpEl) {
      this.dumpEl.value = json;
      this.dumpEl.style.display = "block";
    }
    if (this.copyBtn) this.copyBtn.style.display = "block";
  }

  _copyDump() {
    if (!this.dumpEl) return;
    const text = this.dumpEl.value;
    if (!text) return;

    let ok = false;
    try {
      this.dumpEl.focus();
      this.dumpEl.select();
      ok = document.execCommand && document.execCommand("copy");
    } catch (e) {}
    if (ok) {
      this.statusEl.innerHTML = "Скопировано в буфер ✓";
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => {
          this.statusEl.innerHTML = "Скопировано в буфер ✓";
        },
        () => {
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
    try {
      this.dumpEl.focus();
      this.dumpEl.select();
    } catch (e) {}
    this.statusEl.innerHTML =
      "Авто-копирование не сработало. Выдели текст и нажми <b>Ctrl+C</b>.";
  }
}
