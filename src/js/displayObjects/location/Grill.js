import { Container, Easing, Rewards, Scenario, Triggers } from "PlayableAdsEngine";
import SpineCustom from "../../objects/SpineCustom";
import { EVENTS } from "../../const";
import MeatCut from "./MeatCut";

export default class Grill extends Container {
  cutMeat() {
    // this.current_cut.show();
    // this.current_cut.setAnimation(0, "1st", true);

    window.application.createVisualObjects(
      this.kebab.meat_cut,
      [
        {
          class: MeatCut
        }
      ],
      this.kebab.meat_cut
    );

    // this.kebab.meat_cut.addChild(cutMeat.view);

    const meatCut = this.kebab.meat_cut.children[this.kebab.meat_cut.children.length - 1].baseObject;

    new Scenario(() => meatCut, {
      rewards: [
        () => meatCut.scenarios.idle.reset().start(),
        () => meatCut.cut_4.view.state.timeScale = 150,
        () => meatCut.cut_3.view.state.timeScale = 150,
        () => meatCut.cut_2.view.state.timeScale = 150,
        () => meatCut.cut_1.view.state.timeScale = 150,
        Rewards.wait(35),
        Rewards.onTarget(() => meatCut, Rewards.show()),
        () => meatCut.cut_4.view.state.timeScale = 1,
        () => meatCut.cut_3.view.state.timeScale = 1,
        () => meatCut.cut_2.view.state.timeScale = 1,
        () => meatCut.cut_1.view.state.timeScale = 1,
        Rewards.wait(100),
        () => meatCut.cut_2.alpha = 1,
        Rewards.wait(100),
        () => meatCut.cut_3.alpha = 1,
        Rewards.wait(100),
        () => meatCut.cut_4.alpha = 1,
      ]
    }).start();
  }

  updateInteractive(value) {
    this.view.eventMode = value;
  }

  getTapTutorialPoint() {
    return this.tutorialTap;
  }

  getDefaultConfig(config) {
    const superConfig = super.getDefaultConfig(config);

    return Object.assign(superConfig, {
      on: [
        {
          t: Triggers.onStart(),
          r: () => this.current_cut = this.kebab.meat_cut.cut_2
          // r: Rewards.startScenario("idle"),
        },
        {
          t: Triggers.onTap(),
          r: Rewards.emitEvent(EVENTS.addMeat),
        },
      ],
      children: [
        {
          name: "tutorialTap",
          position: { x: 0, y: -384 },
        },
        {
          class: SpineCustom,
          fileName: "skewer_back",
        },
        {
          name: "kebab",
          class: Container,
          position: { x: -16, y: -487 },
          pivot: { x: -16, y: -487 },
          animations: {
            pulse: {
              from: { scale: { x: 1, y: 1 } },
              to: { scale: { x: 0.95, y: 0.95 } },
              duration: 50,
              easing: Easing.Quadratic.InOut,
              yoyo: true,
              loop: true,
            },
            toDefault: {
              to: { scale: { x: 1, y: 1 } },
              duration: 50,
              easing: Easing.Quadratic.InOut,
            },
          },
          children: [
            {
              class: SpineCustom,
              currentAnimation: "1st",
              fileName: "kebab_back",
            },
            {
              name: "meat_cut",
              class: Container,
              // visible: false,
              children: []
            },
            {
              class: SpineCustom,
              currentAnimation: "1st",
              fileName: "kebab_front",
            },
          ],
        },
        {
          class: SpineCustom,
          currentAnimation: "1st",
          fileName: "skewer_front",
        },
      ],
      scenarios: {
        tutorialTap: []
      }
    });
  }
}
