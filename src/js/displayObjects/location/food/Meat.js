import {
  Container,
  Animation,
  Animations,
  Easing,
  Rewards,
  ParticleEmitter,
  Scenario,
  HitAreaBehavior,
} from "PlayableAdsEngine";
import Food from "./Food";
import { OBJECTS } from "../../../const";

export default class Meat extends Food {
  get activeElements() {
    return [
      this.meat3.meat5,
      this.meat3.meat4,
      this.meat3.meat3,
      this.meat3.meat2,
      this.meat3.meat1,
      this.meat3.meat0,
    ];
  }

  getTapTutorialPoint() {
    return this.tutorialTap;
  }

  addMeat() {
    if (!this.scenarios.emitSmoke)
      this.scenarios.emitSmoke = new Scenario(this, {
        rewards: [
          Rewards.onTarget(
            () => ParticleEmitter.getParticle(`smoke`),
            Rewards.startScenarioInstant("main")
          ),
          Rewards.wait(50),
        ],
        repeat: 20,
      });

    if (!this.meat1.visible) {
      this.meat1.show();
      this.meat1.alpha = 1;
    }

    if (!this.meat2.visible) {
      this.meat2.show();
      this.meat2.alpha = 1;
    }

    if (!this.meat3.visible) {
      const meat = this.meat3;
      meat.visible = true;
      meat.alpha = 1;
      meat.meat0.visible = false;
      meat.meat1.visible = false;
      meat.meat2.visible = false;
      meat.meat3.visible = false;
      meat.meat4.visible = false;
      meat.meat5.visible = false;

      Rewards.startScenario(
        Rewards.forEach(
          () => meat.children,
          Rewards.onTarget(
            (obj) => obj.baseObject,
            Rewards.startScenario([
              Rewards.startAnimationInstant({
                creator: Animations.moveFromDxDy,
                dy: -160,
                dx: -64,
                duration: 250,
                easing: Easing.Quadratic.Out,
                autoStart: true,
              }),
              Rewards.show(),
              Rewards.wait(25),
            ])
          )
        )
      )();
    }

    this.scenarios.emitSmoke.reset().start();
  }

  getDefaultConfig(config) {
    const superConfig = super.getDefaultConfig(config);

    return Object.assign(superConfig, {
      pivot: { x: 81, y: 56 },
      behaviors: [HitAreaBehavior.hitAreaBehavior],
      hitAreaData: {vertices: [151, 6, 121, 3, 64, 2, 19, 20, 6, 36, 8, 59, -3, 74, 48, 108, 117, 107, 161, 79, 157, 32]},
      children: [
        {
          name: "tutorialTap",
          position: { x: 81, y: 56 },
        },
        {
          name: "bowl",
          image: "meat/bowl",
          position: { x: 0, y: 0 },
        },
        {
          name: "meat1",
          image: "meat/meat1",
          position: { x: 22, y: 9 },
          visible: false,
          animations: {
            show: {
              creator: Animations.moveFromDxDy,
              dy: -150,
              dx: -50,
              duration: 250,
              easing: Easing.Quadratic.Out,
              autoStart: true,
            },
            hide: {
              creator: Animations.alphaHide,
              time: 150,
            },
          },
        },
        {
          name: "meat2",
          image: "meat/meat2",
          position: { x: 14, y: 18 },
          visible: false,
          animations: {
            show: {
              creator: Animations.moveFromDxDy,
              dy: -150,
              dx: -50,
              duration: 250,
              easing: Easing.Quadratic.Out,
              autoStart: true,
            },
            hide: {
              creator: Animations.alphaHide,
              time: 150,
            },
          },
        },
        {
          name: "meat3",
          class: Container,
          animations: {
            hide: {
              creator: Animations.alphaHide,
              time: 150,
            },
          },
          visible: false,
          children: [
            {
              name: "meat5",
              image: "meat/meat-5",
              position: { x: 68, y: 15 },
            },
            {
              name: "meat4",
              image: "meat/meat-4",
              position: { x: 40, y: 24 },
            },
            {
              name: "meat3",
              image: "meat/meat-3",
              position: { x: 95, y: 43 },
            },
            {
              name: "meat2",
              image: "meat/meat-2",
              position: { x: 26, y: 43 },
            },
            {
              name: "meat1",
              image: "meat/meat-1",
              position: { x: 20, y: 63 },
            },
            {
              name: "meat0",
              image: "meat/meat",
              position: { x: 76, y: 32 },
            },
          ],
        },
        {
          name: "meat4",
          class: Container,
          visible: false,
          children: [
            {
              name: "meat5",
              image: "meat/meat-5",
              position: { x: 68, y: 15 },
            },
            {
              name: "meat4",
              image: "meat/meat-4",
              position: { x: 40, y: 24 },
            },
            {
              name: "meat3",
              image: "meat/meat-3",
              position: { x: 95, y: 43 },
            },
            {
              name: "meat2",
              image: "meat/meat-2",
              position: { x: 26, y: 43 },
            },
            {
              name: "meat1",
              image: "meat/meat-1",
              position: { x: 20, y: 63 },
            },
            {
              name: "meat0",
              image: "meat/meat",
              position: { x: 76, y: 32 },
            },
          ],
        },
        {
          name: "bowl_front",
          image: "meat/bowl2",
          position: { x: 0, y: 37 },
        },
        {
          linkID: OBJECTS.smokeContainer,
          name: "smoke",
          class: Container,
        },
      ],
    });
  }
}
