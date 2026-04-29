import Food from "./Food";

export default class Sause extends Food {
  get activeElements() {
    return [this.sause];
  }

  getTapTutorialPoint() {
    return this.tutorialTap;
  }

  getDefaultConfig(config) {
    const superConfig = super.getDefaultConfig(config);

    return Object.assign(superConfig, {
      children: [
        {
          name: "tutorialTap",
          position: {x: 5, y: 4}
        },
        {
          name: "sause",
          image: "location/sause",
          anchor: {x: .5, y: .5}
        }
      ],
    });
  }
}