import Food from "./Food";

export default class Cucumbers extends Food {
  get activeElements() {
    return [this.cucumber_12, this.cucumber_9, this.cucumber_8,this.cucumber_5,this.cucumber_2,this.cucumber_0];
  }

  getTapTutorialPoint() {
    return this.tutorialTap;
  }

  getDefaultConfig(config) {
    const superConfig = super.getDefaultConfig(config);

    return Object.assign(superConfig, {
      pivot: {x: 45, y: 40},
      children: [
        {
          name: "tutorialTap",
          position: {x: 45, y: 40}
        },
        {
          name: "cucumber_12",
          image: "cucumbers/cucumber-12",
          position: {x: 2, y: 2}
        },
        {
          name: "cucumber_11",
          image: "cucumbers/cucumber-11",
          position: {x: 38, y: 0}
        },
        {
          name: "cucumber_10",
          image: "cucumbers/cucumber-10",
          position: {x: 3, y: 44}
        },
        {
          name: "cucumber_9",
          image: "cucumbers/cucumber-09",
          position: {x: 50, y: 4}
        },
        {
          name: "cucumber_8",
          image: "cucumbers/cucumber-08",
          position: {x: 24, y: 1}
        },
        {
          name: "cucumber_7",
          image: "cucumbers/cucumber-07",
          position: {x: 0, y: 21}
        },
        {
          name: "cucumber_6",
          image: "cucumbers/cucumber-06",
          position: {x: 15, y: 42}
        },
        {
          name: "cucumber_5",
          image: "cucumbers/cucumber-05",
          position: {x: 12, y: 21}
        },
        {
          name: "cucumber_4",
          image: "cucumbers/cucumber-04",
          position: {x: 32, y: 19}
        },
        {
          name: "cucumber_3",
          image: "cucumbers/cucumber-03",
          position: {x: 34, y: 35}
        },
        {
          name: "cucumber_2",
          image: "cucumbers/cucumber-02",
          position: {x: 49, y: 16}
        },
        {
          name: "cucumber_1",
          image: "cucumbers/cucumber-01",
          position: {x: 56, y: 34}
        },
        {
          name: "cucumber_0",
          image: "cucumbers/cucumber",
          position: {x: 31, y: 41}
        }
      ],
    });
  }
}
