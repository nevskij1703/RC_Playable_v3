import {
  ButtonInstall,
  ButtonMute,
  Container,
  Easing,
  Graphics,
  HitAreaBehavior,
  MainContainer,
  MisclickArea,
  Rewards,
  Triggers,
  TutorialFinger,
} from "PlayableAdsEngine";
import { OBJECTS } from "./const";
import Location from "./displayObjects/location/Location";
import PlayableController from "./objects/v1/PlayableController";
export default {
  children: [
    { class: PlayableController },

    {
      class: MainContainer,
      position: { absolute: true, centered: true, x: 0, y: 28 },
      position_portrait: { absolute: true, centered: true, x: 0, y: 0 },
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
