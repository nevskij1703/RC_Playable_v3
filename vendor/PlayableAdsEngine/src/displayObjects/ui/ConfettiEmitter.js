import { Graphics } from "pixi.js";
import Container from "../../components/Container";

const TWO_PI = 2 * Math.PI;

const COLORS = [
  0x1e90ff, 0x6b8e23, 0xffd700, 0xffc0cb, 0xadd8e6, 0xee82ee, 0x98fb98,
  0xf4a460, 0xd2691e, 0xdc143c,
];

/** Имитирует хлопушку, разбрасывает конфетти.
 * Активируется вызовом {@link ConfettiEmitter#emit}.
 *
 * Параметры конфига:
 * - opts.coneW - максимальная горизонтальная скорость разлёта частиц.
 *   Фактическая горизонтальная скорость частицы - случайная величина на отрезке
 *   [-coneW; coneW]
 * - opts.coneH - максимальная изначальная вертикальная скорость частиц. На
 *   фактическую скорость частицы также влияет opts.coneHFuzz
 * - opts.coneHFuzz - максимальное отклонение скорости частицы от coneH
 * - dx - горизонтальная скорость частиц. Может использоваться для имитации
 *   ветра или угла наклона хлопушки
 * - fallSpeed - скорость падения частицы после прохождения пика
 * - simSpeed - скорость симуляции
 * - rotation - скорость вращения частиц
 * - skewX, skewY - скорости изменения угла наклона частиц
 * - gravity - скорость замедления частицы при полёте вверх. Не влияет на
 *   скорость падения частицы после прохождения пика
 * - gravityFuzz - максимальное отклонение гравитации частицы от gravity
 * - scale - размер частиц
 * - opacity - влияет на прозрачность частицы
 * - lifetime - время жизни частицы в мс. По истечении времени жизни, частицы
 *   растворяются и исчезают
 * - fadeOut - время растворения частицы после по истечении времени жизни
 */
export default class ConfettiEmitter extends Container {
  setup() {
    this.items = new Map([]);

    super.setup();
  }

  lerp(a, b, p) {
    return a + (b - a) * p;
  }

  fuzz(v, dv) {
    return this.lerp(v - dv, v + dv, Math.random());
  }

  particle() {
    const key = Symbol("particle");
    const epoch = performance.now();
    const color = COLORS[(COLORS.length * Math.random()) | 0];
    const gfx = new Graphics();

    let {
      coneW,
      coneH,
      coneHFuzz,
      dx,
      simSpeed,
      rotation,
      skewX,
      skewY,
      gravity,
      gravityFuzz,
      fallSpeed,
      scale,
      opacity,
      lifetime,
      fadeOut,
    } = this.opts;

    this.addChild(gfx);

    coneH = this.fuzz(-coneH, coneHFuzz);
    coneW = this.lerp(-coneW, coneW, Math.random());
    gravity = this.fuzz(gravity, gravityFuzz);
    gfx.angle = this.lerp(0, 360, Math.random());
    gfx.skew.set(
      this.lerp(0, TWO_PI, Math.random()),
      this.lerp(0, TWO_PI, Math.random())
    );
    gfx.alpha = opacity;
    gfx.position.set(0);

    gfx.beginFill(color);
    gfx.drawRect(0, 0, 17 * scale, 17 * scale);
    gfx.endFill();

    const remove = () => {
      this.view.removeChild(gfx);
      gfx.destroy();
      this.items.delete(key);
    };

    let past = epoch;
    const render = (now) => {
      const ms = now - epoch;
      const delta = ((now - past) / 1000) * simSpeed;
      past = now;
      //console.log(delta)

      gfx.y += Math.min(coneH, fallSpeed) * delta;
      gfx.x += (coneW + dx) * delta;
      coneH += gravity * delta;
      gfx.rotation += rotation * delta;
      gfx.skew.x += skewX * delta;
      gfx.skew.y += skewY * delta;

      // TODO switch 1390 to parent height
      if (gfx.y - 200 > 1500) {
        remove();
        return;
      }

      if (ms > lifetime) {
        gfx.alpha = this.lerp(opacity, 0, (ms - lifetime) / fadeOut);
      }

      if (ms > lifetime + fadeOut) {
        remove();
      }
    };

    this.items.set(key, render);
  }

  /** Выпускает num частиц.
   * @param {number} num - Количество частиц.
   */
  emit(num = 50) {
    if (!this.animations.update.isActive) {
      this.animations.update.start();
    }
    Array.from({ length: num }, () => this.particle());
  }

  update() {
    for (const render of this.items.values()) {
      render(performance.now());
    }
  }

  getDefaultConfig(config) {
    this.opts = Object.assign(
      {
        coneW: 3,
        coneH: 35,
        coneHFuzz: 3,
        dx: 0,
        fallSpeed: 10,
        simSpeed: 50,
        rotation: 0.1,
        skewX: 0,
        skewY: 0.1,
        gravity: 1,
        gravityFuzz: 0.5,
        scale: 1,
        opacity: 1,
        lifetime: 3000,
        fadeOut: 200,
      },
      config.opts !== undefined ? config.opts : {}
    );

    const defaults = {
      animations: {
        update: {
          time: 1000,
          loop: true,
          onUpdate: () => this.update(),
          /* onComplete: () => {
            if (this.items.size === 0) {
              return;
            }
            this.animations.update.restart().start();

            console.log("!!!!!!!!!!", this.items.size, this.animations.update);
          }, */
        },
      },
    };

    return Object.assign(super.getDefaultConfig(config), defaults);
  }
}

/*
{
          linkID: OBJECTS.confetti,
          visible: false,
          scenarios: {
            startOnce: [
              Rewards.show(),
              Rewards.onChild('confettiLeft', Rewards.call('emit', CONSTS.CONFETTI_COUNT)),
              Rewards.onChild('confettiRight', Rewards.call('emit', CONSTS.CONFETTI_COUNT)),
              Rewards.wait(2500),
              Rewards.hide()
            ],
            startThrice: [
              Rewards.show(),
              Rewards.onChild('confettiLeft', Rewards.call('emit', CONSTS.CONFETTI_COUNT)),
              Rewards.onChild('confettiRight', Rewards.call('emit', CONSTS.CONFETTI_COUNT)),
              Rewards.wait(750),
              Rewards.onChild('confettiLeft', Rewards.call('emit', CONSTS.CONFETTI_COUNT)),
              Rewards.onChild('confettiRight', Rewards.call('emit', CONSTS.CONFETTI_COUNT)),
              Rewards.wait(750),
              Rewards.onChild('confettiLeft', Rewards.call('emit', CONSTS.CONFETTI_COUNT)),
              Rewards.onChild('confettiRight', Rewards.call('emit', CONSTS.CONFETTI_COUNT)),
              Rewards.wait(2500),
              Rewards.hide()
            ]
          },
          animations: {
            show: {
              creator: Animations.alphaShow,
              time: 0
            },
            hide: {
              creator: Animations.alphaHide,
              time: 300
            }
          },
          sprites: [
            {
              name: 'confettiLeft',
              class: ConfettiEmitter,
              adaptivePosition: true,
              position: { absolute: true, align: { x: 1, y: 1 }, x: -50, y: -100 },
              opts: { dx: -4 },
            },
            {
              name: 'confettiRight',
              class: ConfettiEmitter,
              adaptivePosition: true,
              position: { absolute: true, align: { x: 0, y: 1 }, x: 50, y: -100 },
              opts: { dx: 4 },
            },
          ]
        },
*/
