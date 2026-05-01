import {
  Animation,
  Container,
  Easing,
  PIXI,
} from "PlayableAdsEngine";

// Палитра в стиле HudPanel.
const COL_BG = 0xf7e7b5; // cream
const COL_STROKE = 0xd79a55; // orange stroke
const COL_TITLE = 0x7561c8; // violet
const COL_SUB = 0xe07a2a; // orange
const COL_PILL = 0xfffaee; // near-white pill background

const CARD_W = 180;
const CARD_H = 240;
const CARD_R = 18;
const CARD_GAP = 24; // расстояние между двумя карточками

const BACKDROP_SIZE = 5000; // заведомо больше любого канваса

// Модальный оверлей с двумя карточками апгрейдов. Полностью рисуется
// через Graphics + Text (никаких внешних ассетов кроме иконок продуктов
// в образе Sprite-from-image). Backdrop ловит все pointer-события, gameplay
// под оверлеем не реагирует на клики.
//
// Public API:
//   show(cards) — cards: массив из 2 объектов { type, label, sub, iconKey, accentColor, apply }
//                 apply вызывается при клике на карточку до hide().
//   onChosen(callback) — подписка на событие "выбор сделан" (карточка нажата).
//
// Lifecycle: setup() строит контейнерные слоты backdrop+cardA+cardB; show
// перерисовывает контент карточек на каждый вызов. Это проще чем держать
// state-ful "карточка-объект" с update().
export default class UpgradeOverlay extends Container {
  setup() {
    super.setup();

    this._chosenListeners = [];
    this._buildBackdrop();
    this._buildCardSlots();
    this.view.visible = false;
    this.view.alpha = 0;
  }

  _buildBackdrop() {
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.55);
    bg.drawRect(-BACKDROP_SIZE / 2, -BACKDROP_SIZE / 2, BACKDROP_SIZE, BACKDROP_SIZE);
    bg.endFill();
    bg.eventMode = "static";
    bg.hitArea = new PIXI.Rectangle(
      -BACKDROP_SIZE / 2,
      -BACKDROP_SIZE / 2,
      BACKDROP_SIZE,
      BACKDROP_SIZE
    );
    // Тапы по фону игнорируются (карточки сверху всё ещё кликабельны).
    bg.on("pointertap", (e) => {
      e.stopPropagation && e.stopPropagation();
    });
    this.view.addChild(bg);
    this._backdrop = bg;
  }

  _buildCardSlots() {
    const offset = (CARD_W + CARD_GAP) / 2;
    const a = new PIXI.Container();
    a.x = -offset;
    a.y = 0;
    const b = new PIXI.Container();
    b.x = offset;
    b.y = 0;
    this.view.addChild(a);
    this.view.addChild(b);
    this._cardA = a;
    this._cardB = b;
  }

  onChosen(cb) {
    this._chosenListeners.push(cb);
  }

  show(cards) {
    if (!cards || cards.length < 2) return;

    this._renderCard(this._cardA, cards[0]);
    this._renderCard(this._cardB, cards[1]);

    this.view.visible = true;
    new Animation(this, {
      from: { alpha: 0, scale: { x: 0.6, y: 0.6 } },
      to: { alpha: 1, scale: { x: 1, y: 1 } },
      duration: 280,
      easing: Easing.Back.Out,
      autoStart: true,
    });
  }

  hide() {
    new Animation(this, {
      from: { alpha: 1, scale: { x: 1, y: 1 } },
      to: { alpha: 0, scale: { x: 0.85, y: 0.85 } },
      duration: 180,
      easing: Easing.Quadratic.In,
      autoStart: true,
      onComplete: () => {
        this.view.visible = false;
        // Сброс scale, чтобы следующий show() стартовал с чистого состояния.
        this.scale = { x: 1, y: 1 };
      },
    });
  }

  // Полная перестройка карточки: убираем старых детей, добавляем новых.
  // Так проще, чем диффать состояния (карточки бывают разных типов).
  _renderCard(slot, card) {
    while (slot.children.length) slot.removeChildAt(0);

    // Тень-подложка
    const shadow = new PIXI.Graphics();
    shadow.beginFill(0x000000, 0.25);
    shadow.drawRoundedRect(
      -CARD_W / 2 + 3,
      -CARD_H / 2 + 5,
      CARD_W,
      CARD_H,
      CARD_R
    );
    shadow.endFill();
    slot.addChild(shadow);

    // Внешняя обводка
    const outer = new PIXI.Graphics();
    outer.beginFill(COL_STROKE);
    outer.drawRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R);
    outer.endFill();
    // Внутренняя заливка
    outer.beginFill(COL_BG);
    outer.drawRoundedRect(
      -CARD_W / 2 + 4,
      -CARD_H / 2 + 4,
      CARD_W - 8,
      CARD_H - 8,
      CARD_R - 4
    );
    outer.endFill();
    slot.addChild(outer);

    // Title (фиолетовый)
    const title = new PIXI.Text(card.label || "", {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: 18,
      fontWeight: "900",
      fill: COL_TITLE,
      align: "center",
      wordWrap: true,
      wordWrapWidth: CARD_W - 20,
    });
    title.anchor.set(0.5, 0);
    title.x = 0;
    title.y = -CARD_H / 2 + 14;
    slot.addChild(title);

    // Иконка по центру карточки. Тип определяет внешний вид.
    const icon = this._buildCardIcon(card);
    icon.x = 0;
    icon.y = -8; // чуть выше центра — оставляем место для sub-текста снизу
    slot.addChild(icon);

    // Sub-текст (оранжевый): "1 → 2", "+4 → +6", "теперь доступно"
    if (card.sub) {
      const subBgW = CARD_W - 36;
      const subBgH = 28;
      const subBg = new PIXI.Graphics();
      subBg.beginFill(COL_PILL);
      subBg.drawRoundedRect(-subBgW / 2, -subBgH / 2, subBgW, subBgH, subBgH / 2);
      subBg.endFill();
      subBg.lineStyle(2, COL_STROKE, 0.6);
      subBg.drawRoundedRect(-subBgW / 2, -subBgH / 2, subBgW, subBgH, subBgH / 2);
      subBg.x = 0;
      subBg.y = CARD_H / 2 - 26;
      slot.addChild(subBg);

      const sub = new PIXI.Text(card.sub, {
        fontFamily: "Arial Black, Arial, sans-serif",
        fontSize: 14,
        fontWeight: "900",
        fill: COL_SUB,
      });
      sub.anchor.set(0.5, 0.5);
      sub.x = 0;
      sub.y = CARD_H / 2 - 26;
      slot.addChild(sub);
    }

    // Hit-area + клик
    slot.eventMode = "static";
    slot.cursor = "pointer";
    slot.hitArea = new PIXI.Rectangle(
      -CARD_W / 2,
      -CARD_H / 2,
      CARD_W,
      CARD_H
    );
    slot.removeAllListeners && slot.removeAllListeners("pointertap");
    slot.on("pointertap", () => this._onCardChosen(slot, card));
  }

  _buildCardIcon(card) {
    const wrap = new PIXI.Container();

    // Подкладка-кружок под иконкой (визуально выделяет product/feature).
    const halo = new PIXI.Graphics();
    halo.beginFill(COL_PILL);
    halo.drawCircle(0, 0, 56);
    halo.endFill();
    halo.lineStyle(3, COL_STROKE, 0.45);
    halo.drawCircle(0, 0, 56);
    wrap.addChild(halo);

    // Сам визуал: PIXI.Sprite если есть iconKey, иначе fallback Graphics.
    if (card.iconKey) {
      try {
        const spr = PIXI.Sprite.from(card.iconKey);
        spr.anchor.set(0.5, 0.5);
        // Подгоняем максимальный размер под 80×80 (с сохранением пропорций).
        const fitToSize = (s, max) => {
          if (!s.texture || !s.texture.valid) {
            // Текстура ещё не загружена — слушаем событие.
            const onUpdate = () => {
              s.texture.off && s.texture.off("update", onUpdate);
              fitToSize(s, max);
            };
            s.texture && s.texture.on && s.texture.on("update", onUpdate);
            // Дефолтный масштаб пока что
            s.scale.set(0.4, 0.4);
            return;
          }
          const tw = s.texture.width || 1;
          const th = s.texture.height || 1;
          const k = Math.min(max / tw, max / th);
          s.scale.set(k, k);
        };
        fitToSize(spr, 90);
        wrap.addChild(spr);
      } catch (e) {
        // Если PIXI.Sprite.from упал — игнорим, оставим только halo.
      }
    }

    // Бейдж "+1" / "+2" / "NEW" — для plate / topping / income соответственно.
    if (card.badge) {
      const bw = 48;
      const bh = 28;
      const badge = new PIXI.Graphics();
      badge.beginFill(card.accentColor || COL_TITLE);
      badge.drawRoundedRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
      badge.endFill();
      badge.x = 32;
      badge.y = -32;
      wrap.addChild(badge);

      const t = new PIXI.Text(card.badge, {
        fontFamily: "Arial Black, Arial, sans-serif",
        fontSize: 14,
        fontWeight: "900",
        fill: 0xffffff,
      });
      t.anchor.set(0.5, 0.5);
      t.x = 32;
      t.y = -32;
      wrap.addChild(t);
    }

    return wrap;
  }

  _onCardChosen(slot, card) {
    // Микро-bounce выбранной карточки перед закрытием — feedback.
    new Animation(slot, {
      from: { scale: { x: 1, y: 1 } },
      to: { scale: { x: 1.08, y: 1.08 } },
      duration: 110,
      yoyo: true,
      autoStart: true,
      easing: Easing.Quadratic.InOut,
    });

    // Чуть запоздало запускаем apply + hide, чтобы пользователь увидел нажатие.
    setTimeout(() => {
      try {
        if (typeof card.apply === "function") card.apply();
      } catch (e) {}
      this.hide();
      for (const cb of this._chosenListeners) {
        try {
          cb(card);
        } catch (e) {}
      }
    }, 200);
  }

  getDefaultConfig(config) {
    return Object.assign(super.getDefaultConfig(config), {});
  }
}
