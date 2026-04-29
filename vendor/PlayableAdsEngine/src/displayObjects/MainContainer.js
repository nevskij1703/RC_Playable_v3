import Container from "../components/Container";

export default class MainContainer extends Container {
  getDefaultConfig(config) {
    return Object.assign(super.getDefaultConfig(config), {
      adaptivePosition: true,
      position: { absolute: true, centered: true },
    });
  }
}
