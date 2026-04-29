import {
  Animations,
  Container,
  Digits,
  ObjectLinks,
  Rewards,
} from "PlayableAdsEngine";
import { OBJECTS } from "../../const";

const MARK_CONFIG = {
  anchor: { x: 0.5, y: 0.5 },
  visible: false,
  position: { x: 64, y: 68 },
  animations: {
    show: Animations.alphaScaleShow,
    hide: Animations.alphaScaleHide,
  },
};

export default class ProductOnTooltip extends Container {
  setup() {
    super.setup();
    this.complete = false;

    this.updateIcon(this.config.products);

    this.count = this.config.count || 1;

    if (this.count > 8) {
      this.counter.scale.x *= .9;
      this.counter.scale.y *= .9;
    }
  }

  // Сброс slot'а в "пустое" состояние перед назначением нового заказа.
  // Делает slot невидимым и помечает completed=true, чтобы он не попал в
  // findIncomplete пока не активируется через setProducts.
  reset() {
    this.complete = true;
    this.count = 0;

    if (this.checkMark) this.checkMark.visible = false;
    if (this.cross) {
      this.cross.visible = false;
      this.cross.alpha = 1;
      this.cross.scale = { x: 1, y: 1 };
    }
    if (this.icon) {
      this.icon.visible = false;
      this.resetChildrenVisibility();
    }
    if (this.counter) {
      this.counter.visible = false;
      this.counter.alpha = 1;
    }
    // Сам slot скрываем; setProducts покажет.
    this.visible = false;
  }

  updateIcon(products) {
    products.forEach((product) => (this.icon[product].visible = true));

    if (products.includes(OBJECTS.cola)) {
      this.icon.plate.visible = false;
      this.icon.meat.visible = false;
    }
    if (products.includes(OBJECTS.meat)) {
      this.icon.plate.visible = true;
      this.icon.pita.visible = true;
      this.icon.pita_closed.visible = true;
    }
  }

  resetChildrenVisibility() {
    this.icon.children.forEach((child) => (child.visible = false));
  }

  // Полная переустановка отображаемого блюда. Используется при назначении
  // нового заказа клиенту (контроллер вызывает на каждом активном slot).
  setProducts(products, count = 1) {
    this.config.products = products;
    this.config.count = count;
    this.count = count;
    this.complete = false;
    this.visible = true;
    this.resetChildrenVisibility();
    this.updateIcon(products);
    if (this.checkMark) this.checkMark.visible = false;
    if (this.cross) {
      this.cross.visible = false;
      this.cross.alpha = 1;
      this.cross.scale = { x: 1, y: 1 };
    }
    if (this.icon) this.icon.visible = true;
    if (this.counter) {
      // Стаков нет (count == 1) — счётчик скрываем; на случай >1 показываем.
      this.counter.alpha = 1;
      if (count > 1) {
        this.counter.visible = true;
        this.counter.setValue(`x${count}`);
      } else {
        this.counter.visible = false;
      }
    }
  }

  changeParent(linkID) {
    let newParent = ObjectLinks.get(linkID, this);
    let prevParent = this.parent;
    let position = newParent.getLocalPositionFor(this);

    if (this.view) {
      newParent.addChild(this.view);
    }

    if (this.name) {
      newParent && (newParent[this.name] = this);
      prevParent && delete prevParent.baseObject[this.name];
    }

    this.position = position;
  }

  updateCounter(value) {
    if (!value) {
      this.counter.hide();
      return;
    }
    this.counter.setValue(`x${value}`);
  }

  getDefaultConfig(config) {
    const { scale = { x: 1, y: 1 }, count = 1, counterConfig = {} } = config;
    return Object.assign(super.getDefaultConfig(config), {
      scenarios: {
        showCheck: [
          Rewards.set({ complete: true }),
          Rewards.stopScenario("showCross"),
          Rewards.onChild("icon", Rewards.hide()),
          Rewards.onChild("counter", Rewards.hide()),
          Rewards.playSound("ok"),
          Rewards.onChild("cross", function () {
            this.visible && this.hide();
          }),
          Rewards.onChild("checkMark", Rewards.show()),
          // Галочка светится мгновение и исчезает, оставляя пустое место —
          // как просил пользователь. Сам item остаётся complete=true, поэтому
          // повторно ничего не вернётся.
          Rewards.wait(600),
          Rewards.onChild("checkMark", Rewards.hide()),
        ],
        hideCheck: [
          Rewards.set({ complete: false }),
          Rewards.onChild("checkMark", Rewards.hide()),
          Rewards.onChild("icon", Rewards.show()),
        ],
        showCross: [
          Rewards.if(() => this.complete, Rewards.stopScenario("showCross")),
          Rewards.onChild("cross", Rewards.stopAnimation("show")),
          Rewards.onChild("cross", function () {this.alpha = 0; this.scale = {x: 0, y: 0}}),
          Rewards.onChild("icon", Rewards.hide()),
          Rewards.onChild("counter", Rewards.hide()),
          Rewards.onChild("cross", Rewards.show()),
          Rewards.playSound("wrong"),
          Rewards.wait(500),
          Rewards.onChild("cross", Rewards.hide()),
          Rewards.onChild("counter", Rewards.show()),
          Rewards.onChild("icon", Rewards.show()),
        ],
      },
      pivot: { x: 66, y: 60 },
      children: [
        {
          name: "icon",
          class: Container,
          children: [
            {
              name: "plate",
              image: "dish/plate",
              position: { x: 0, y: 30 },
            },
    
            {
              name: "pita",
              image: "dish/pita1",
              position: { x: 14, y: 34 },
              visible: false,
            },

            {
              name: "meat",
              class: Container,
              visible: false,
              children: [
                {
                  name: "meat_1",
                  image: "dish/meat_1",
                  position: { x: 3, y: 49 },
                },
                {
                  name: "meat_2",
                  image: "dish/meat_2",
                  position: { x: 46, y: 57 },
                },
                {
                  name: "meat_3",
                  image: "dish/meat_3",
                  position: { x: 14, y: 61 },
                },
                {
                  name: "meat_4",
                  image: "dish/meat_4",
                  position: { x: 12, y: 34 },
                },
                {
                  name: "meat_5",
                  image: "dish/meat_5",
                  position: { x: 21, y: 47 },
                },
                {
                  name: "meat_6",
                  image: "dish/meat_6",
                  position: { x: 71, y: 53 },
                },
                {
                  name: "meat_7",
                  image: "dish/meat_7",
                  position: { x: 66, y: 49 },
                },
                {
                  name: "meat_8",
                  image: "dish/meat_8",
                  position: { x: 32, y: 55 },
                },
                {
                  name: "meat_9",
                  image: "dish/meat_9",
                  position: { x: 66, y: 64 },
                },
                {
                  name: "meat_10",
                  image: "dish/meat_10",
                  position: { x: 35, y: 44 },
                },
                {
                  name: "meat_11",
                  image: "dish/meat_11",
                  position: { x: 63, y: 48 },
                },
              ],
            },
    
            {
              name: "cucumbers",
              class: Container,
              visible: false,
              children: [
                {
                  name: "cucumber_1",
                  image: "dish/cucumber_1",
                  position: { x: 19, y: 30 },
                },
                {
                  name: "cucumber_2",
                  image: "dish/cucumber_2",
                  position: { x: 15, y: 38 },
                },
                {
                  name: "cucumber_3",
                  image: "dish/cucumber_3",
                  position: { x: 18, y: 53 },
                },
                {
                  name: "cucumber_4",
                  image: "dish/cucumber_4",
                  position: { x: 74, y: 53 },
                },
                {
                  name: "cucumber_5",
                  image: "dish/cucumber_5",
                  position: { x: 31, y: 60 },
                },
                {
                  name: "cucumber_6",
                  image: "dish/cucumber_6",
                  position: { x: 62, y: 55 },
                },
                {
                  name: "cucumber_7",
                  image: "dish/cucumber_7",
                  position: { x: 56, y: 56 },
                },
                {
                  name: "cucumber_8",
                  image: "dish/cucumber_8",
                  position: { x: 47, y: 59 },
                },
                {
                  name: "cucumber_9",
                  image: "dish/cucumber_9",
                  position: { x: 32, y: 42 },
                },
                {
                  name: "cucumber_10",
                  image: "dish/cucumber_10",
                  position: { x: 53, y: 46 },
                },
              ],
            },
    
            {
              name: "tomato",
              class: Container,
              visible: false,
              children: [
                {
                  name: "tomato_1",
                  image: "dish/tomato_1",
                  position: { x: 12, y: 30 },
                },
                {
                  name: "tomato_2",
                  image: "dish/tomato_2",
                  position: { x: 22, y: 37 },
                },
                {
                  name: "tomato_3",
                  image: "dish/tomato_3",
                  position: { x: 34, y: 42 },
                },
                {
                  name: "tomato_4",
                  image: "dish/tomato_4",
                  position: { x: 47, y: 44 },
                },
              ],
            },
    
            {
              name: "fry",
              class: Container,
              visible: false,
              children: [
                {
                  name: "fry_1",
                  image: "dish/fry_1",
                  position: { x: 63, y: 68 },
                },
                {
                  name: "fry_2",
                  image: "dish/fry_2",
                  position: { x: 79, y: 66 },
                },
                {
                  name: "fry_3",
                  image: "dish/fry_3",
                  position: { x: 75, y: 50 },
                },
                {
                  name: "fry_4",
                  image: "dish/fry_4",
                  position: { x: 67, y: 59 },
                },
                {
                  name: "fry_5",
                  image: "dish/fry_5",
                  position: { x: 55, y: 46 },
                },
                {
                  name: "fry_6",
                  image: "dish/fry_6",
                  position: { x: 60, y: 48 },
                },
                {
                  name: "fry_7",
                  image: "dish/fry_7",
                  position: { x: 6, y: 23 },
                },
                {
                  name: "fry_8",
                  image: "dish/fry_8",
                  position: { x: 40, y: 30 },
                },
                {
                  name: "fry_9",
                  image: "dish/fry_9",
                  position: { x: 38, y: 32 },
                },
                {
                  name: "fry_10",
                  image: "dish/fry_10",
                  position: { x: 19, y: 14 },
                },
              ],
            },
            {
              name: "pita_closed",
              image: "dish/pita3",
              position: { x: 25, y: 23 },
              visible: false,
            },

            {
              name: "cola",
              image: "location/drink",
              position: { x: 60, y: 64 },
              pivot: { x: 27, y: 44 },
              visible: false,
            },
          ],
        },
        Object.assign({
          name: "counter",
          class: Digits,
          value: `x${count}`,
          position: config.counterPos || { x: 92, y: 76 },
          scale: {x: .8 / scale.x, y: .8 / scale.y},
          fontPrefix: "counter/",
          symbolSpacing: 0
        }, counterConfig),
        Object.assign(
          {
            name: "checkMark",
            image: "ui/check_mark",
            scale: { x: 0.5 / scale.x, y: 0.5 / scale.y },
          },
          MARK_CONFIG
        ),
        Object.assign(
          {
            name: "cross",
            image: "ui/cross",
            scale: { x: (1.8 * 0.5) / scale.x, y: (1.8 * 0.5) / scale.y },
          },
          MARK_CONFIG
        ),
      ],
    });
  }
}
