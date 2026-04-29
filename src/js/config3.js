import {
  ButtonInstall,
  ButtonMute,
  Container,
  Graphics,
  HitAreaBehavior,
  MainContainer,
  MisclickArea,
  Rewards,
  Triggers,
  TutorialFinger,
} from "PlayableAdsEngine";
import { ANALYTIC_EVENTS, OBJECTS } from "./const";
import Location from "./displayObjects/location/Location";
import PlayableController from "./objects/v1/PlayableController";
export default {
  children: [
    { class: PlayableController },

    {
      class: MainContainer,
      position: { absolute: true, centered: true, x: 0, y: 0 },
      position_portrait: { absolute: true, centered: true, x: 0, y: 0 },
      children: [
        {
          class: Graphics,
          rect: [-320, -750, 640, 1500],
        },
        {
          class: Graphics,
          rect: [-750, -320, 1500, 640],
        },
        {
          linkID: OBJECTS.location,
          class: Location,
        },
      ],
    },

    {
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
          children: [
            {
              class: MisclickArea,
              behaviors: [HitAreaBehavior.hitAreaBehavior],
            },
            {
              name: "button",
              class: ButtonInstall,
              baseImage: "ui/button_install",
              textImage: {
                image: "next_level",
                position: { x: 0, y: -2 },
                scale: { x: 0.9, y: 0.9 },
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
                    Rewards.stopSound("music"),
                  ]),
                },
              ],
            },
          ],
        },

        !window.is_adwords && {
          class: ButtonInstall,
          baseImage: "ui/button_pink",
          textImage: {
            image: "install",
            position: { x: 2, y: 0 },
          },
          adaptivePosition: true,
          position: { absolute: true, align: { x: 1, y: 0 }, x: -160, y: 60 },
          position_mn: {
            absolute: true,
            align: { x: 1, y: 1 },
            x: -100,
            y: -45,
          },
          position_portrait: {
            absolute: true,
            align: { x: 1, y: 1 },
            x: -100,
            y: -45,
          },
          /*position_portrait_mn: {
            absolute: true,
            align: { x: 1, y: 1 },
            x: -100,
            y: -45,
          },*/
          on: [
            {
              t: Triggers.onTap(),
              r: () =>
                window.application.analytics.send({
                  eventName: ANALYTIC_EVENTS.clickInstall,
                }),
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
