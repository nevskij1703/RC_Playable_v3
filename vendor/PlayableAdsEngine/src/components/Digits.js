import { Easing } from "tweedle.js";
import Animation from "../core/Animation";
import Text from "./Text";

export default class Digits extends Text {
  setup() {
    super.setup();

    this.setValue(this.config.value, false);
  }

  addValue(value, withAnimation = true) {
    this.setValue(this.value + value, withAnimation);
  }

  setValue(value, withAnimation = false) {
    if (withAnimation) {
      this.playAnimation(this.value, value);
    } else {
      this.setText(this.trim(value));
    }

    this.value = value;
  }

  getCurrentValue() {
    return this.value;
  }

  playAnimation(valueStart, valueEnd) {
    return new Animation(this, {
      from: { visibleValue: this.trim(valueStart) },
      to: { visibleValue: this.trim(valueEnd) },
      time: this.config.animationTime,
      easing: Easing.Quadratic.InOut,
      onUpdate: () => this.setText(Math.round(this.visibleValue)),
    }).start();
  }

  trim(value) {
    if (value < this.config.minValue) {
      return this.config.minValue;
    }

    if (value > this.config.maxValue) {
      return this.config.maxValue;
    }

    return value;
  }

  /*
  Класс позволяет выводить числа, инкрементить/декременить на значение с анимацией "пробегания" по промежуточным значениям
  Наследуется от Text

  Основные методы (помимо унаследованных от Text)
    setValue(value, withAnimation = false) — установить числовое значение value, по умолчанию мгновенно без анимации
    addValue(value, withAnimation = true) — изменить текущее значение на value, по умолчанию с анимацией

  Параметры (помимо унаследованных от Text)
    align — аналог anchor для спрайта:
      для x: 0 — фиксирует положение первого символа, 1 — последнего, 0.5 — центрирует
      для y: 0 — текст будет сдвигаться "вниз" относительно нуля, 1 — "вверх", 0.5 — центрирован по высоте (учитывается самый "высокий" символ)

    value — значение
    minValue — минимальное отображаемое значение, не влияет на реальное значение
    maxValue — максимальное отображаемое значение, не влияет на реальное значение
    animationTime — время анимации для изменения значения от текущего, до установленно методом addValue

  Пример config (можно использовать любые параметры родительского Text):
  {
    class: Digits,
    value: 128,
    minValue: 0,
    maxValue: 255,
    animationTime: 750
  }
  */
  getDefaultConfig(config) {
    return Object.assign(super.getDefaultConfig(config), {
      value: 0,
      minValue: 0,
      maxValue: 999,
      animationTime: 750,
    });
  }
}
