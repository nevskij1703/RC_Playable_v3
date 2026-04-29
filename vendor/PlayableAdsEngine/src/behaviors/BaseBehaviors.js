/**
 * Класс-библиотека бихевиоров.
 *
 * Каждый статический метод может быть вызван в качестве бихевиора
 */
export default class BaseBehaviors {
  static clickInstall() {
    window.application.setClickEvent(this);
  }

  static stopPropagation() {
    this.interactive = true;

    this.on("pointertap", (e) => {
      e.stopPropagation();
    });
  }
}
