import { Animations, Assets, Container, Rewards } from "PlayableAdsEngine";

const IDLE_TIME = 1000;

export default class Tooltip extends Container {
  async show() {
    super.show();

    const container = this.container;

    await container.showAsync();

    //container.scenarios.idle.reset().start();
  }
  async hide() {
    const container = this.container;

    //container.scenarios.idle.stop();

    await container.hide();
    super.hide();
  }

  getIncompleteIconByProducts(productsInOrder) {
    const order = this.container.icons.children.find(child => child.visible);

    const productString = productsInOrder.children.filter(product => product.visible && !["dish", "tutorialTap", "ellipse", "starsEmitter"].includes(product.baseObject.name)).map(product => product.baseObject.name).sort().toString();

    let productIcon = order.children.find(products =>
      !products.baseObject.complete && products.baseObject.icon.children.filter(product => product.visible && !["dish", "tutorialTap", "ellipse", "starsEmitter"].includes(product.baseObject.name)).map(product => product.baseObject.name).sort().toString() == productString
    )

    return productIcon;
  }

  getIncompleteIcons() {
    const order = this.container.icons.children.find(child => child.visible);

    return order.children.filter(products => !products.baseObject.complete)
  }

  updateIcons(orderId) {
    const iconsChildren = this.container.icons.children;

    iconsChildren.forEach((icon) => icon.visible = icon.baseObject.config.orderId == orderId);
  }

  // Сброс счётчиков и галочек на всех ProductOnTooltip,
  // чтобы tooltip можно было переиспользовать для нового клиента.
  resetForReuse() {
    const iconsChildren = this.container.icons.children;
    iconsChildren.forEach((orderGroup) => {
      orderGroup.visible = false;
      if (orderGroup.children) {
        orderGroup.children.forEach((productView) => {
          if (productView.baseObject && productView.baseObject.reset) {
            productView.baseObject.reset();
          }
        });
      }
    });
  }

  getTapTutorialPoint() {
    return this.container.icons.children[0];
  }

  getDefaultConfig(config) {
    const { icons = [] } = config;

    return Object.assign(super.getDefaultConfig(config), {
      visible: false,
      children: [
        {
          name: "container",
          class: Container,
          position: {x: 234, y: 72},
          pivot: {x: 234, y: 72},
          visible: false,
          scenarios: {
            idle: {
              loop: true,
              rewards: [
                Rewards.startAnimation("idle_up"),
                Rewards.startAnimation("idle_down"),
              ],
            },
          },
          animations: {
            show: {
              creator: Animations.alphaScaleShow,
              time: 250,
            },
            hide: Animations.alphaScaleHide,
            idle_up: {
              creator: Animations.moveToDxDy,
              dy: 10,
              duration: IDLE_TIME,
              yoyo: true,
            },
            idle_down: {
              creator: Animations.moveToDxDy,
              dy: -10,
              duration: IDLE_TIME,
              yoyo: true,
            },
          },
          children: [
            {
              name: "bubble",
              image: "ui/bubble",
              position: {x: 0, y: 0},
            },
            Object.assign(
              {
                name: "icons",
                class: Container,
                position: {x: 0, y: 0},
                position_portrait: {x: -10, y: 0},
              },
              icons,
            ),
          ],
        },
      ],
    });
  }
}