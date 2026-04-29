import Food from "./Food";

export default class Tomatoes extends Food {
  get activeElements() {
    return [this.tomato_3, this.tomato_9, this.tomato_2, this.tomato_12, this.tomato_10, this.tomato_11];
  }

  getTapTutorialPoint() {
    return this.tutorialTap;
  }

  getDefaultConfig(config) {
    const superConfig = super.getDefaultConfig(config);

    return Object.assign(superConfig, {
      pivot: {x: 51, y: 46},
      children: [
        {
          name: "tutorialTap",
          position: {x: 52, y: 46},
        },
        {
          name: "tomato_1",
          image: "tomato/tomato",
          position: {x: 10 + 30, y: 1 + 25},
          pivot: {x: 30, y: 25},
          rotation: .24
        },
        {
          name: "tomato_2",
          image: "tomato/tomato",
          position: {x: 3 + 30, y: 18 + 25},
          pivot: {x: 30, y: 25},
          rotation: .25
        },
        {
          name: "tomato_3",
          image: "tomato/tomato",
          position: {x: 24 + 30, y: 0 + 28},
          pivot: {x: 30, y: 25},
          rotation: .756
        },
        {
          name: "tomato_4",
          image: "tomato/tomato",
          position: {x: 20 + 30, y: 24 + 25},
          pivot: {x: 30, y: 25},
          rotation: .24
        },
        {
          name: "tomato_5",
          image: "tomato/tomato",
          position: {x: 0 + 30, y: 46 + 25},
          pivot: {x: 30, y: 25},
          rotation: .24
        },
        {
          name: "tomato_6",
          image: "tomato/tomato",
          position: {x: 6 + 30, y: 44 + 25},
          pivot: {x: 30, y: 25},
          rotation: -.5
        },
        {
          name: "tomato_7",
          image: "tomato/tomato",
          position: {x: 46 + 30, y: 3 + 25},
          pivot: {x: 30, y: 25},
          rotation: .24
        },
        {
          name: "tomato_8",
          image: "tomato/tomato",
          position: {x: 59 + 30, y: 6 + 25},
          pivot: {x: 30, y: 25},
          rotation: .24
        },
        {
          name: "tomato_9",
          image: "tomato/tomato",
          position: {x: 52 + 30, y: 20 + 25},
          pivot: {x: 30, y: 25},
          rotation: .6416
        },
        {
          name: "tomato_10",
          image: "tomato/tomato",
          position: {x: 49 + 36, y: 40 + 16},
          pivot: {x: 30, y: 25},
          rotation: .01
        },
        {
          name: "tomato_11",
          image: "tomato/tomato",
          position: {x: 22 + 30, y: 32 + 25},
          pivot: {x: 30, y: 25},
          rotation: .6426
        },
        {
          name: "tomato_12",
          image: "tomato/tomato",
          position: {x: 24 + 30, y: 49 + 22},
          pivot: {x: 30, y: 25},
          rotation: -0.2051
        },
        {
          name: "tomato_13",
          image: "tomato/tomato",
          position: {x: 51 + 30, y: 53 + 25},
          pivot: {x: 30, y: 25},
          rotation: .6426
        },
      ],
    });
  }
}
