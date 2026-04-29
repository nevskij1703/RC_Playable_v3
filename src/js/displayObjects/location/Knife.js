import { Animations, Container, Easing } from "PlayableAdsEngine";

export default class Knife extends Container {
  getDefaultConfig(config) {
    const superConfig = super.getDefaultConfig(config);

    return Object.assign(superConfig, {
      animations: {
        moveUp: {
            creator: Animations.moveBezier,
            to: {x: [-286, -200, -264], y: [123, 50, -90 ]},
            easing: Easing.Quadratic.Out,
            time: 350
        },
        cut: {
            creator: Animations.moveToDxDy,
            dy: 138,
            dx: -20,
            easing: Easing.Sinusoidal.InOut,
            duration: 600
        },
        moveDown: {
            creator: Animations.moveBezier,
            to: {x: [-284, -264, -286 ], y: [48, 80, 123 ]},
            easing: Easing.Quadratic.Out,
            time: 250
        },
      },
      children: [
        {
          name: "knife",
          image: "location/knife",
          animations: {
            work: {
              from: { position: { x: 0, y: 0 } },
              to: { position: { x: 12, y: -10 } },
              duration: 100,
              easing: Easing.Sinusoidal.InOut,
              yoyo: true,
              loop: true,
              // autoStart: true
            },
          },
        },
      ],
    });
  }
}
