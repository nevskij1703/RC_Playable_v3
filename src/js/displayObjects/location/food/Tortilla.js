import Food from "./Food";

export default class Tortilla extends Food {
  get activeElements() {
    return [this.tortilla];
  }

  getTapTutorialPoint() {
    return this.tutorialTap;
  }

  getDefaultConfig(config) {
    const superConfig = super.getDefaultConfig(config);

    return Object.assign(superConfig, {
        pivot: {x: 88, y: 58},
      children: [
        {
          name: "tutorialTap",
          position: {x: 88, y: 58}
        },
        {
          name: "basket",
          image: "tortilla/basket"
        },
        {
          name: "tortilla",
          image: "tortilla/tortilla",
          pivot: {x: 64, y: 36},
          position: {x: 90, y: 39}
        },
        {
          name: "basket_front",
          image: "tortilla/basket_2",
          position: {x: 12, y: 24}
        },
      ],
    });
  }
}