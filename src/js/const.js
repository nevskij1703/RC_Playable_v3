export const CONFETTI_COUNT = 50;

export const HERO_SPEED_FACTOR = 2.5;
export const BUYER_SPEED_FACTOR = 4;
export const BUYER_SPEED_FACTOR_MOVE_OUT = 3;

export const BUYER_MOVE_DX = 110;

export const TIMINGS = {
  characterMoveOut: 1000,
  characterMove: 750
}

export const EVENTS = {
  updateTutorial: "updateTutorial",
  falseDish: "falseDish",
  falseCola: "falseCola",
  fryTap: "fryTap",
  colaTap: "colaTap",

  gameTap: "gameTap",
  emitCoins: "emitCoins",
  emitCoinsAdditional: "emitCoinsAdditional",
  addMeat: "addMeat"
}

export const OBJECTS = {
  firstTutorTarget: "firstTutorTarget",

  misclickArea: "misclickArea",
  nextLevelMisclick: "nextLevelMisclick",
  buttonInstall: "buttonInstall",
  coins: "coins",
  coinsFinish1: "coinsFinish1",
  coinsFinish2: "coinsFinish2",
  coinsFinish3: "coinsFinish3",
  p1: "p1",
  p2: "p2",
  p3: "p3",
  p4: "p4",
  coinsDestination: "coinsDestination",
  stars: "stars",
  smokeContainer: "smokeContainer",

  meat: "meat",
  tomato: "tomato",
  fry: "fry",
  cucumbers: "cucumbers",
  table: "table",
  tortilla: "tortilla",

  fakeDishContainer: "fakeDishContainer",
  fakeDish1: "fakeDish1",
  fakeDish2: "fakeDish2",
  fakeDish3: "fakeDish3",
  fakeDish4: "fakeDish4",
  
  buyers: "buyers",

  location: "location",

  knife: "knife",
  grill: "grill",

  cola: "cola",
  cola1: "cola1",
  cola2: "cola2",
  cola3: "cola3",

  dish1: "dish1",
  dish2: "dish2",
  dish3: "dish3",
  dish4: "dish4",

  travelMap: "travelMap",

  tooltip: "tooltip",
  tooltip1: "tooltip1",
  tooltip2: "tooltip2",
  tooltip3: "tooltip3",

  crossPopup: "crossPopup",
  upgradeOverlay: "upgradeOverlay",

  hudPanel: "hudPanel",

  tutorialFinger: "tutorialFinger",
  ui: "ui"
};

export const VERSIONS = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
};

export const ANALYTIC_EVENTS = {
  start: "start",
  clickInstall: "clickInstall",
  clickBuy: "clickBuy",
  misclick: "misclick",
};

export const CHARACTER_ANIMATIONS = {
  idle: "idle",
  happy: "happy",
  walk: "walk",
  angry: "angry"
};

export const CHARACTER_ANIMATIONS_MIXES = [
  [CHARACTER_ANIMATIONS.walk, CHARACTER_ANIMATIONS.idle, 0.2],
  [CHARACTER_ANIMATIONS.idle, CHARACTER_ANIMATIONS.happy, 0.2],
  [CHARACTER_ANIMATIONS.happy, CHARACTER_ANIMATIONS.walk, 0.2],
];

export const PRODUCTS_TYPES = {
  meat: "meat",
  tomato: "tomato",
  cucumbers: "cucumbers",
  fry: "fry"
};
