import {
  Animation,
  Container,
  Easing,
  PIXI,
} from "PlayableAdsEngine";

const PANEL_W = 260;
const PANEL_H = 52;
const PANEL_R = 18;

const COL_BG = 0xf7e7b5;
const COL_STROKE = 0xd79a55;
const COL_TEXT = 0x7561c8;
const COL_CLIENT_BLUE = 0x4fa8e0;
const COL_CLIENT_BLUE_DARK = 0x2f7fbf;

// Hud-панель сверху экрана: слева монеты coins/maxCoins, справа
// обслуженные клиенты served/total. Рисуется в PIXI.Graphics + PIXI.Text
// (без растровых ассетов), чтобы соответствовать дизайну референса.
export default class HudPanel extends Container {
  setup() {
    super.setup();

    this.coins = 0;
    this.maxCoins = this.config.maxCoins || 0;
    this.served = 0;
    this.total = this.config.total || 0;

    this._buildBackground();
    this._buildCoinSection();
    this._buildClientSection();
    this._render();
  }

  // ---------- Drawing ----------

  _buildBackground() {
    const g = new PIXI.Graphics();
    // soft shadow
    g.beginFill(0x000000, 0.2);
    g.drawRoundedRect(-PANEL_W / 2 + 2, -PANEL_H / 2 + 4, PANEL_W, PANEL_H, PANEL_R);
    g.endFill();
    // outer stroke (orange ring)
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
    // coin: yellow with orange ring
    g.beginFill(0xe8a23a);
    g.drawCircle(0, 0, 16);
    g.endFill();
    g.beginFill(0xffd750);
    g.drawCircle(0, 0, 13);
    g.endFill();
    // inner light highlight
    g.beginFill(0xffe98e);
    g.drawCircle(-3, -3, 5);
    g.endFill();
    // coin "C" mark
    g.lineStyle(3, 0xc97a18, 1);
    g.arc(0, 0, 6, Math.PI * 0.25, Math.PI * 1.75);
    return g;
  }

  _clientIcon() {
    const c = new PIXI.Container();
    const bg = new PIXI.Graphics();
    bg.beginFill(COL_CLIENT_BLUE_DARK);
    bg.drawRoundedRect(-19, -19, 38, 38, 12);
    bg.endFill();
    bg.beginFill(COL_CLIENT_BLUE);
    bg.drawRoundedRect(-17, -17, 34, 34, 10);
    bg.endFill();
    // person silhouette (white)
    bg.beginFill(0xffffff);
    bg.drawCircle(0, -5, 6);
    bg.drawRoundedRect(-9, 2, 18, 14, 5);
    bg.endFill();
    c.addChild(bg);
    return c;
  }

  _makeText(initial) {
    return new PIXI.Text(initial, {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: 22,
      fontWeight: "900",
      fill: COL_TEXT,
      stroke: 0xffffff,
      strokeThickness: 0,
    });
  }

  _buildCoinSection() {
    const icon = this._coinIcon();
    icon.x = -PANEL_W / 2 + 26;
    icon.y = 0;
    this.view.addChild(icon);

    const t = this._makeText("0/0");
    t.anchor.set(0, 0.5);
    t.x = -PANEL_W / 2 + 50;
    t.y = -1;
    this.view.addChild(t);
    this._coinText = t;
  }

  _buildClientSection() {
    const icon = this._clientIcon();
    icon.x = PANEL_W / 2 - 28;
    icon.y = 0;
    this.view.addChild(icon);

    const t = this._makeText("0/0");
    t.anchor.set(1, 0.5);
    t.x = PANEL_W / 2 - 52;
    t.y = -1;
    this.view.addChild(t);
    this._clientText = t;
  }

  _render() {
    if (this._coinText)
      this._coinText.text = `${this.coins}/${this.maxCoins}`;
    if (this._clientText)
      this._clientText.text = `${this.served}/${this.total}`;
  }

  // ---------- Public API ----------

  setMaxCoins(v) {
    this.maxCoins = v | 0;
    this._render();
  }

  setTotal(v) {
    this.total = v | 0;
    this._render();
  }

  // Численная анимация: тикает по 1 шагу с малой задержкой,
  // плюс лёгкий bounce-scale на каждое прибавление.
  addCoins(delta) {
    if (delta <= 0) return;
    const target = Math.min(this.coins + delta, this.maxCoins);
    if (target <= this.coins) return;
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
      to: { scale: { x: 1.08, y: 1.08 } },
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
