import {
  APPLICATION_EVENTS,
  Container,
  Easing,
  Rewards,
  Spine,
  Triggers,
} from "PlayableAdsEngine";
import Dish from "./food/Dish";
import { EVENTS, OBJECTS, PRODUCTS_TYPES } from "../../const";
import Tooltip from "../ui/Tooltip";
import ProductOnTooltip from "../ui/ProductOnTooltip";
import Character from "../characters/Character";
import Cola from "./food/Cola";
import Meat from "./food/Meat";
import CharacterDuels from "../characters/CharacterDuels";
import Fries from "./food/Fries";
import Cucumbers from "./food/Cucumbers";
import Tomatoes from "./food/Tomatoes";
import Tortilla from "./food/Tortilla";
import Knife from "./Knife";
import Grill from "./Grill";

export default class Location extends Container {
  setup() {
    super.setup();
  }

  onResize() {
    const isPortrait = window.application.renderer.isPortrait,
      positionName = isPortrait ? "portrait" : "default";

    this.scale =
      isPortrait &&
      window.application.renderer.getLandscapeRatio <= window.RATIO["MN"]
        ? { x: 0.85, y: 0.85 }
        : { x: 1, y: 1 };

    this.background.buyers.applyPosition(positionName);
    ["tooltip1", "tooltip2", "tooltip3"].forEach((tName) => {
      const t = this.background[tName];
      if (t && t.applyPosition) t.applyPosition(positionName);
    });
  }

  getDefaultConfig(config) {
    const superConfig = super.getDefaultConfig(config);
    return Object.assign(superConfig, {
      on: [
        {
          t: Triggers.onEvent(APPLICATION_EVENTS.playableResize),
          r: Rewards.call("onResize"),
        },
      ],

      children: [
        {
          name: "background",
          class: Container,
          children: [
            {
              name: "back",
              image: "location/back",
              position: { x: -474, y: -613 },
              anchor: { x: 0, y: 0 },
            },

            /*{
              linkID: OBJECTS.buyers,
              name: "buyers",
              class: Container,
              position_portrait: { x: 178, y: -106 },
              position: { x: 178, y: -96 },
              children: [
                {
                  name: "Alexa",
                  class: Character,
                  spineConfig: {
                    fileName: "Alexa",
                  },
                  // position: {x: -375, y: -117},
                  position: { x: 378, y: 72 },
                  scale: { x: .7, y: .7 },
                },
                {
                  name: "David",
                  class: Character,
                  spineConfig: {
                    fileName: "David",
                  },
                  // position: {x: 272, y: -78},
                  position: { x: 256, y: 69 },
                  scale: { x: .7, y: .7 },
                },
                {
                  name: "Miss_Sherry",
                  class: Character,
                  spineConfig: {
                    fileName: "Miss_Sherry",
                  },
                  // position: {x: 50, y: -99},
                  position: { x: 38, y: 29 },
                  scale: { x: .7, y: .7 },
                },
                {
                  name: "Mr_Abrams",
                  class: Character,
                  spineConfig: {
                    fileName: "Mr_Abrams",
                  },
                  // position: {x: -162, y: -93},
                  position: { x: -128, y: 46 },
                  scale: { x: .7, y: .7 },
                },
              ],
            },*/
            {
              linkID: OBJECTS.buyers,
              name: "buyers",
              class: Container,
              position_portrait: { x: 178, y: -156 },
              position: { x: 178, y: -146 },
              children: [
                {
                  name: "old_stylish_woman",
                  class: Character,
                  spineConfig: {
                    fileName: "old_stylish_woman",
                    scale: {x: -.55, y: .55}
                  },
                  pivot: {x: 36, y: 0},
                  // Запасной/неиспользуемый персонаж — оставлен, спайн загружен,
                  // но в активную ротацию (SLOT_CHARACTERS) не добавлен.
                  position: { x: 378, y: 114 },
                },
                {
                  name: "old_grambler",
                  class: Character,
                  spineConfig: {
                    fileName: "old_grambler",
                    scale: {x: -.55, y: .55}
                  },
                  pivot: {x: -8, y: 0},
                  // Slot 2 (rightmost). x≤90 чтобы спайн целиком влез в портретный канвас (375 wide).
                  position: { x: 80, y: 114 },
                },
                {
                  name: "pretty_woman",
                  class: Character,
                  spineConfig: {
                    fileName: "pretty_woman",
                    scale: {x: -.55, y: .55}
                  },
                  pivot: {x: -4, y: 0},
                  // Slot 1 (middle).
                  position: { x: -130, y: 120 },
                },
                {
                  name: "italian_man",
                  class: Character,
                  spineConfig: {
                    fileName: "italian_man",
                    scale: {x: -.55, y: .55}
                  },
                  // Slot 0 (leftmost) — за областью гриля (как на референсе).
                  position: { x: -360, y: 205 },
                },
              ],
            },

            {
              linkID: OBJECTS.p1,
              position: { x: -58, y: -150 },
            },

            {
              linkID: OBJECTS.p2,
              position: { x: -100, y: -235 },
            },

            {
              linkID: OBJECTS.p3,
              position: { x: -180, y: -325 },
            },

            {
              linkID: OBJECTS.coinsFinish1,
              position: { x: -100, y: 222 },
            },
            {
              linkID: OBJECTS.coinsFinish2,
              position: { x: -180, y: 222 },
            },
            {
              linkID: OBJECTS.coinsFinish3,
              position: { x: -260, y: 222 },
            },

            {
              linkID: OBJECTS.table,
              name: "table",
              class: Container,
              children: [
                {
                  image: "location/floor",
                  anchor: { x: 0.5, y: 0 },
                  position: { x: 0, y: 358 },
                },
                {
                  name: "table",
                  image: "location/table",
                  anchor: { x: 0.5, y: 0 },
                  position: { x: 0, y: -750 },
                  // scale: {x: 1.01, y: 1.01}
                },

                /*{
                  linkID: OBJECTS.blueberry,
                  class: Blueberry,
                  position: { x: -206, y: 104 },
                  type: "berries",
                },

                {
                  linkID: OBJECTS.strawberry,
                  class: Strawberry,
                  position: { x: 96, y: 129 },
                  type: "berries",
                },*/

                {
                  linkID: OBJECTS.fakeDish1,
                  class: ProductOnTooltip,
                  visible: false,
                  products: [],
                  pivot: { x: 65, y: 60 },
                  counterConfig: {
                    visible: false,
                  },
                },
                {
                  linkID: OBJECTS.fakeDish2,
                  class: ProductOnTooltip,
                  visible: false,
                  products: [],
                  pivot: { x: 65, y: 60 },
                  counterConfig: {
                    visible: false,
                  },
                },
                {
                  linkID: OBJECTS.fakeDish3,
                  class: ProductOnTooltip,
                  visible: false,
                  products: [],
                  pivot: { x: 65, y: 60 },
                  counterConfig: {
                    visible: false,
                  },
                },

                {
                  linkID: OBJECTS.dish1,
                  class: Dish,
                  clone: OBJECTS.fakeDish1,
                  position: { x: -62, y: -105 },
                },
                {
                  linkID: OBJECTS.dish2,
                  class: Dish,
                  clone: OBJECTS.fakeDish2,
                  position: { x: 68, y: -105 },
                },
                {
                  linkID: OBJECTS.dish3,
                  class: Dish,
                  clone: OBJECTS.fakeDish3,
                  position: { x: 198, y: -105 },
                  scale: { x: 1, y: 1 },
                },

                {
                  linkID: OBJECTS.cola,
                  name: "cola",
                  class: Container,
                  children: [
                    {
                      linkID: OBJECTS.cola3,
                      class: Cola,
                      position: { x: 242, y: -28 },
                      scale: { x: 0.77, y: 0.77 },
                    },
                    {
                      linkID: OBJECTS.cola2,
                      class: Cola,
                      position: { x: 257, y: 14 },
                      scale: { x: 0.88, y: 0.88 },
                    },
                    {
                      linkID: OBJECTS.cola1,
                      class: Cola,
                      position: { x: 272, y: 62 },
                      scale: { x: 1, y: 1 },
                    },
                  ],
                },

                {
                  image: "location/grill",
                  position: { x: -342 + 22, y: -263 + 27 }
                },

                {
                  image: "location/fire_glow",
                  anchor: { x: 0.5, y: 0.5 },
                  position: { x: -342 + 105, y: -263 + 164 },
                  alpha: 0.5,
                },
                {
                  image: "location/fire_glow",
                  anchor: { x: 0.5, y: 0.5 },
                  position: { x: -342 + 105, y: -263 + 164 },
                  animations: {
                    idle: {
                      from: { alpha: 0.5, scale: {x: 1, y: 1} },
                      to: { alpha: 1, scale: {x: 1.25, y: 1} },
                      duration: 1000,
                      easing: Easing.Sinusoidal.InOut,
                      yoyo: true,
                      loop: true,
                      autoStart: true,
                    },
                  },
                },

                {
                  linkID: OBJECTS.grill,
                  class: Grill,
                  scale: { x: 0.29, y: 0.29 },
                  position: { x: -233, y: 56 }
                },
                
                {
                  linkID: OBJECTS.fry,
                  class: Fries,
                  position: { x: 41, y: 6 },
                },
                {
                  linkID: OBJECTS.tomato,
                  name: "tomato",
                  class: Tomatoes,
                  position: { x: -66, y: 8 },
                },
                {
                  linkID: OBJECTS.cucumbers,
                  name: "cucumbers",
                  class: Cucumbers,
                  position: { x: 148, y: 5 },
                },
                {
                  image: "location/stand_front",
                  position: { x: -130, y: 17 },
                },

                {
                  linkID: OBJECTS.meat,
                  name: "meat",
                  class: Meat,
                  position: { x: -113, y: 96 },
                },

                {
                  linkID: OBJECTS.tortilla,
                  class: Tortilla,
                  position: { x: 106, y: 100 },
                },

                {
                  linkID: OBJECTS.knife,
                  name: "knife",
                  class: Knife,
                  position: { x: -286, y: 123 },
                  pivot: { x: 9, y: 69 },
                },
              ],
            },

            {
              linkID: OBJECTS.stars,
            },

            ...[OBJECTS.tooltip1, OBJECTS.tooltip2, OBJECTS.tooltip3].map((linkID, idx) => ({
              linkID,
              name: linkID,
              class: Tooltip,
              // Tooltip левее головы клиента, чтобы не перекрывать лицо.
              // Bubble высокий (~285*0.85=242 px), поэтому tooltip y ставим
              // выше головы; bubble спускается до уровня плеч/груди.
              position_portrait: {
                x: [-310, -85, 130][idx],
                y: [-440, -440, -440][idx],
              },
              position: {
                x: [-310, -85, 130][idx],
                y: [-430, -430, -430][idx],
              },
              scale: { x: 0.85, y: 0.85 },
              visible: false,
              // Один orderGroup с 3 универсальными слотами. Контроллер при
              // спавне клиента вызывает setProducts() на нужном количестве
              // slots (1-3); остальные остаются скрытыми (reset → complete=true).
              // Bubble после scale 0.4x2.4 = ~96x285. Слоты вертикально
              // на y=50/140/230 (равномерно), x=50 (центр bubble).
              icons: {
                position: { x: 0, y: 0 },
                children: [
                  {
                    orderId: 0,
                    visible: true,
                    children: [
                      {
                        class: ProductOnTooltip,
                        products: [OBJECTS.cola],
                        scale: { x: 0.5, y: 0.5 },
                        position: { x: 50, y: 50 },
                        counterPos: { x: 70, y: 74 },
                        count: 1,
                      },
                      {
                        class: ProductOnTooltip,
                        products: [OBJECTS.cola],
                        scale: { x: 0.5, y: 0.5 },
                        position: { x: 50, y: 140 },
                        counterPos: { x: 70, y: 74 },
                        count: 1,
                      },
                      {
                        class: ProductOnTooltip,
                        products: [OBJECTS.cola],
                        scale: { x: 0.5, y: 0.5 },
                        position: { x: 50, y: 230 },
                        counterPos: { x: 70, y: 74 },
                        count: 1,
                      },
                    ],
                  },
                ],
              },
            })),

            {
              linkID: OBJECTS.fakeDishContainer,
            },

            {
              name: "coins",
              linkID: OBJECTS.coins,
              position: { x: 54, y: -173 },
              position_portrait: { x: 54, y: -48 },
            },
          ],
        },

        {
          // image: "preview_vertical_bus",
          // image: "loc",
          anchor: { x: 0.5, y: 0.5 },
          position: { x: 0, y: 0 },
          alpha: 0.25,
        },
      ],
    });
  }
}
