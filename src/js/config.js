import {
  Animations,
  ButtonInstall,
  ButtonMute,
  Container,
  Easing,
  Graphics,
  HitAreaBehavior,
  MainContainer,
  MisclickArea,
  Rewards,
  Sprite,
  Triggers,
  TutorialFinger,
} from "PlayableAdsEngine";
import { OBJECTS } from "./const";
import Location from "./displayObjects/location/Location";
import HudPanel from "./displayObjects/ui/HudPanel";
import PlayableController from "./objects/v1/PlayableController";
export default {
  children: [
    { class: PlayableController },

    {
      class: MainContainer,
      position: { absolute: true, centered: true, x: 0, y: 70 },
      position_portrait: { absolute: true, centered: true, x: 0, y: 60 },
      scale: { x: 0.78, y: 0.78 },
      scale_portrait: { x: 0.95, y: 0.95 },
      children: [
        {
          linkID: OBJECTS.location,
          class: Location,
        },
      ],
    },

    {
      linkID: OBJECTS.ui,
      name: "ui",
      class: Container,
      adaptivePosition: true,
      position: { absolute: true, centered: true },
      children: [
        {
          linkID: OBJECTS.tutorialFinger,
          class: TutorialFinger,
          scale: { x: 0.5, y: 0.5 },
        },

        // Верхняя HUD-панель: монеты слева, обслуженные клиенты справа.
        // Якорим к ЦЕНТРУ канваса (не к верхнему краю): MC центрирована на
        // канвасе, поэтому смещение от center-y до back-wall top постоянно
        // (~ -418 px в портрете). На вытянутых экранах HUD остаётся внутри
        // фона, а не в чёрной зоне сверху — аналогично кнопке Install,
        // которая сидит на полу у нижнего края.
        {
          linkID: OBJECTS.hudPanel,
          class: HudPanel,
          adaptivePosition: true,
          position: { absolute: true, align: { x: 0.5, y: 0.5 }, x: 0, y: -355 },
          position_portrait: {
            absolute: true,
            align: { x: 0.5, y: 0.5 },
            x: 0,
            y: -356,
          },
        },

        // Всплывающий красный крест в точке тапа при невалидном действии
        // (smart cooking gate). Bounce-show + автоскрытие через 500 мс.
        {
          linkID: OBJECTS.crossPopup,
          class: Sprite,
          image: "ui/cross",
          anchor: { x: 0.5, y: 0.5 },
          scale: { x: 0.6, y: 0.6 },
          visible: false,
          alpha: 0,
          animations: {
            show: {
              from: { alpha: 0, scale: { x: 0, y: 0 } },
              to: { alpha: 1, scale: { x: 0.7, y: 0.7 } },
              duration: 200,
              easing: Easing.Back.Out,
            },
            hide: {
              from: { alpha: 1 },
              to: { alpha: 0 },
              duration: 200,
              easing: Easing.Quadratic.In,
            },
          },
          scenarios: {
            popup: [
              Rewards.show(),
              Rewards.startAnimationInstant("show"),
              Rewards.wait(500),
              Rewards.startAnimationInstant("hide"),
              Rewards.wait(200),
              Rewards.hide(),
            ],
          },
        },

        !(window.is_unity || window.is_adwords) && {
          linkID: OBJECTS.misclickArea,
          class: MisclickArea,
          visible: false,
          on: [
            {
              t: Triggers.onTap(),
              r: Rewards.startScenario([
                Rewards.playableFinish(),
                Rewards.stopSound("music"),
              ]),
            },
          ],
        },

        {
          linkID: OBJECTS.nextLevelMisclick,
          class: Container,
          visible: false,
          scenarios: {
            play: [Rewards.show(), Rewards.onChild("button", Rewards.show())],
            hide: [Rewards.hide(), Rewards.onChild("button", Rewards.hide())],
          },
          children: [
            {
              class: MisclickArea,
              behaviors: [HitAreaBehavior.hitAreaBehavior],
            },
            {
              name: "button",
              class: ButtonInstall,
              baseImage: "ui/button_install",
              scale: { x: 0.75, y: 0.75 },
              textImage: {
                image: "next_level",
                position: { x: 0, y: -4 },
                scale: { x: 1.25, y: 1.25 },
              },
              adaptivePosition: true,
              position: {
                absolute: true,
                align: { x: 0.5, y: 0.5 },
                x: 0,
                y: 256,
              },
              position_portrait: {
                absolute: true,
                align: { x: 0.5, y: 0.5 },
                x: 0,
                y: 324,
              },
              on: [
                {
                  t: Triggers.onTap(),
                  r: Rewards.startScenario([
                    Rewards.playableFinish(),
                    Rewards.stopSound("music")
                  ]),
                },
              ],
            },
          ],
        },

        !window.is_adwords && {
          linkID: OBJECTS.buttonInstall,
          class: ButtonInstall,
          baseImage: "ui/button_install",
          textImage: {
            image: "install",
            position: { x: 4, y: -8 },
          },
          adaptivePosition: true,
          scale: { x: 0.7, y: 0.7 },
          position: {
            absolute: true,
            align: { x: .5, y: 1 },
            x: 0,
            y: -48,
          },
          position_portrait: {
            absolute: true,
            align: { x: 0.5, y: 1 },
            x: 0,
            y: -56,
          },
          on: [
            {
              t: Triggers.onTap(),
              r: {
                t: Triggers.onTap(),
                r: Rewards.startScenario([
                  // Rewards.playableFinish(),
                  // Rewards.stopSound("music")
                ]),
              },
            },
          ],
        },

        {
          class: ButtonMute,
          adaptivePosition: true,
          position: { absolute: true, align: { x: 0, y: 1 }, x: 50, y: 30 },
        },
      ],
    },
  ],
};
