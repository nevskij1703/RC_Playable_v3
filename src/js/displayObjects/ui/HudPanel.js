import {
  Animation,
  APPLICATION_EVENTS,
  Container,
  Easing,
  ObjectLinks,
  PIXI,
} from "PlayableAdsEngine";
import { OBJECTS } from "../../const";

const PANEL_W = 340;
const PANEL_H = 56;
const PANEL_R = 20;
const PILL_W = 110;
const PILL_H = 32;

const COL_BG = 0xf7e7b5;
const COL_STROKE = 0xd79a55;
const COL_TEXT = 0x7561c8;          // фиолетово-синий — основной счётчик
const COL_TEXT_ORANGE = 0xe07a2a;   // оранжевый — для «/total»
const COL_PILL = 0xfffaee;
const COL_CLIENT_BLUE = 0x4fa8e0;
const COL_CLIENT_BLUE_DARK = 0x2f7fbf;

// Hud-панель: слева — монеты (накопленные, без max), справа — клиенты
// (servedClients/totalClients, где /total оранжевый). Каждый счётчик
// сидит на своей белой капсуле; иконка торчит влево из капсулы.
export default class HudPanel extends Container {
  setup() {
    super.setup();

    this.coins = 0;
    this.served = 0;
    this.total = this.config.total || 0;

    this._buildBackground();
    this._buildCoinSection();
    this._buildClientSection();
    this._render();

    // Гарантия: HUD никогда не оказывается выше верха background-картинки.
    // Engine'овский adaptivePosition прибивает HUD к верху канваса, но на
    // ультра-вертикальных аспектах (ratio > 2.05 → aspect-clamp + чёрные
    // полосы) фон не доходит до верха, и HUD оседает в чёрной зоне.
    // Снапаем под верх стены с отступом 30px. На landscape/squarish
    // bounds.y ≤ 8 (фон закрывает верх) — раннеритёрн, не вмешиваемся.
    if (window.application && window.application.eventEmitter) {
      window.application.eventEmitter.on(
        APPLICATION_EVENTS.playableResize,
        () => this._scheduleAlign()
      );
    }
    this._scheduleAlign();
  }

  // Несколько отложенных попыток — back-спрайт может быть ещё не загружен
  // на ранних тиках. 160/400/900/1800 покрывают и быструю, и медленную
  // загрузку. _alignBelowBackground раннеритёрнит если HUD уже на месте.
  _scheduleAlign() {
    if (this._alignTimers) this._alignTimers.forEach(clearTimeout);
    this._alignTimers = [160, 400, 900, 1800].map((ms) =>
      setTimeout(() => this._alignBelowBackground(), ms)
    );
  }

  _alignBelowBackground() {
    const v = this.view;
    if (!v || !v.parent) return;
    const back = this._findBackSprite();
    if (!back) return;
    const bounds = back.getBounds();
    if (!bounds || bounds.height < 50) return;
    if (bounds.y <= 8) return;
    const halfPanel = (PANEL_H / 2 + 4) * v.scale.y;
    const hudTopWorldY = v.worldTransform.ty - halfPanel;
    if (hudTopWorldY >= bounds.y - 4) return;
    const desiredWorldY = bounds.y + 5 + halfPanel;
    const local = v.parent.toLocal({ x: 0, y: desiredWorldY });
    v.position.y = local.y;
  }

  _findBackSprite() {
    const loc = ObjectLinks.get(OBJECTS.location);
    const root = loc && loc.view;
    if (!root || !root.children) return null;
    const bg = root.children[0];
    if (!bg || !bg.children) return null;
    const back = bg.children[0];
    if (!back || !back._texture) return null;
    return back;
  }

  // ---------- Drawing ----------

  _buildBackground() {
    const g = new PIXI.Graphics();
    // soft drop shadow
    g.beginFill(0x000000, 0.22);
    g.drawRoundedRect(-PANEL_W / 2 + 2, -PANEL_H / 2 + 4, PANEL_W, PANEL_H, PANEL_R);
    g.endFill();
    // outer stroke (orange)
    g.beginFill(COL_STROKE);
    g.drawRoundedRect(-PANEL_W / 2, -PANEL_H / 2, PANEL_W, PANEL_H, PANEL_R);
    g.endFill();
    // inner fill (cream)
    g.beginFill(COL_BG);
    g.drawRoundedRect(
      -PANEL_W / 2 + 4,
      -PANEL_H / 2 + 4,
      PANEL_W - 8,
      PANEL_H - 8,
      PANEL_R - 4
    );
    g.endFill();
    this.view.addChild(g);
  }

  _coinIcon() {
    const g = new PIXI.Graphics();
    g.beginFill(0xc97a18);
    g.drawCircle(0, 0, 17);
    g.endFill();
    g.beginFill(0xffd750);
    g.drawCircle(0, 0, 14);
    g.endFill();
    g.beginFill(0xffe98e);
    g.drawCircle(-3, -3, 5);
    g.endFill();
    g.lineStyle(3, 0xc97a18, 1);
    g.arc(0, 0, 6.5, Math.PI * 0.25, Math.PI * 1.75);
    return g;
  }

  _clientIcon() {
    const g = new PIXI.Graphics();
    g.beginFill(COL_CLIENT_BLUE_DARK);
    g.drawRoundedRect(-18, -18, 36, 36, 11);
    g.endFill();
    g.beginFill(COL_CLIENT_BLUE);
    g.drawRoundedRect(-16, -16, 32, 32, 9);
    g.endFill();
    // person silhouette
    g.beginFill(0xffffff);
    g.drawCircle(0, -5, 5.5);
    g.drawRoundedRect(-9, 1, 18, 13, 5);
    g.endFill();
    return g;
  }

  _makePill(w, h) {
    const p = new PIXI.Graphics();
    // тонкая внутренняя тень
    p.beginFill(COL_STROKE, 0.18);
    p.drawRoundedRect(-w / 2, -h / 2 + 1, w, h, h / 2);
    p.endFill();
    p.beginFill(COL_PILL);
    p.drawRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    p.endFill();
    return p;
  }

  _makeText(initial, color) {
    return new PIXI.Text(initial, {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: 22,
      fontWeight: "900",
      fill: color,
    });
  }

  _buildCoinSection() {
    // Капсула справа от иконки
    const pillCx = -PANEL_W / 2 + 24 + PILL_W / 2 - 4;
    const pill = this._makePill(PILL_W, PILL_H);
    pill.x = pillCx;
    pill.y = 0;
    this.view.addChild(pill);

    // Иконка торчит слева, перекрывая край капсулы
    const icon = this._coinIcon();
    icon.x = pillCx - PILL_W / 2 + 2;
    icon.y = 0;
    this.view.addChild(icon);

    const t = this._makeText("0", COL_TEXT);
    t.anchor.set(0.5, 0.5);
    // Текст в центре правой части капсулы (где нет иконки): сдвиг
    // от центра капсулы вправо на ~icon-overhang/2.
    t.x = pillCx + 14;
    t.y = -1;
    this.view.addChild(t);
    this._coinText = t;
    this._coinPillCx = pillCx;
  }

  _buildClientSection() {
    const pillCx = PANEL_W / 2 - 24 - PILL_W / 2 + 4;
    const pill = this._makePill(PILL_W, PILL_H);
    pill.x = pillCx;
    pill.y = 0;
    this.view.addChild(pill);

    // Иконка слева от капсулы (как и для монет — иконка слева)
    const icon = this._clientIcon();
    icon.x = pillCx - PILL_W / 2 + 2;
    icon.y = 0;
    this.view.addChild(icon);

    // Два текста: served (фиолет) и /total (оранжевый), позиционируются
    // относительно центра капсулы (со сдвигом вправо под иконку).
    const tServed = this._makeText("0", COL_TEXT);
    tServed.anchor.set(1, 0.5);
    this.view.addChild(tServed);

    const tTotal = this._makeText("/0", COL_TEXT_ORANGE);
    tTotal.anchor.set(0, 0.5);
    this.view.addChild(tTotal);

    this._clientServedText = tServed;
    this._clientTotalText = tTotal;
    this._clientPillCx = pillCx;

    this._layoutClientTexts();
  }

  _layoutClientTexts() {
    if (!this._clientServedText) return;
    // Центрируем композитный текст в правой части капсулы (где нет иконки).
    const baseX = this._clientPillCx + 14;
    const y = -1;
    this._clientServedText.x = baseX;
    this._clientServedText.y = y;
    this._clientTotalText.x = baseX;
    this._clientTotalText.y = y;
    // anchor = 1 у tServed; anchor = 0 у tTotal — оба «прижимаются» к baseX,
    // получая визуально слитный текст вида "served/total".
  }

  _render() {
    if (this._coinText) this._coinText.text = `${this.coins}`;
    if (this._clientServedText) {
      this._clientServedText.text = `${this.served}`;
      this._clientTotalText.text = `/${this.total}`;
      this._layoutClientTexts();
    }
  }

  // ---------- Public API ----------

  setTotal(v) {
    this.total = v | 0;
    this._render();
  }

  // Численная анимация: тикает по 1 шагу с малой задержкой.
  addCoins(delta) {
    if (delta <= 0) return;
    const target = this.coins + delta;
    if (this._coinTickTimer) clearInterval(this._coinTickTimer);
    const stepMs = Math.max(18, Math.min(50, 700 / (target - this.coins)));
    this._coinTickTimer = setInterval(() => {
      this.coins = Math.min(this.coins + 1, target);
      this._render();
      this._bounce();
      if (this.coins >= target) {
        clearInterval(this._coinTickTimer);
        this._coinTickTimer = null;
      }
    }, stepMs);
  }

  addClient() {
    if (this.served >= this.total) return;
    this.served++;
    this._render();
    this._bounce();
  }

  _bounce() {
    if (this._bounceActive) return;
    this._bounceActive = true;
    new Animation(this, {
      from: { scale: { x: 1, y: 1 } },
      to: { scale: { x: 1.07, y: 1.07 } },
      duration: 90,
      yoyo: true,
      autoStart: true,
      easing: Easing.Quadratic.InOut,
      onComplete: () => {
        this._bounceActive = false;
        this.scale = { x: 1, y: 1 };
      },
    });
  }

  getDefaultConfig(config) {
    return Object.assign(super.getDefaultConfig(config), {});
  }
}
