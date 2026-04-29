import { Assets } from "pixi.js";
import Container from "./Container";

export default class Text extends Container {
  setup() {
    super.setup();

    this.symbols = [];

    this.setText(this.config.text);
  }

  setText(text) {
    if (this.text === text) {
      return;
    }

    this.text = text.toString();

    this.updateSymbols();
  }

  updateSymbols() {
    this.createSymbolsIfNeeded();

    this.hideAllSymbols();

    let width = 0;
    let height = 0;

    for (let i = 0; i < this.text.length; i++) {
      let symbol = this.symbols[i];

      if (!symbol) {
        continue;
      }

      symbol.setTexture(this.getTextureBySymbol(this.text[i]));

      symbol.visible = true;

      width += i !== 0 ? this.config.symbolSpacing : 0;

      symbol.x = width;

      width += symbol.origWidth;
      height = symbol.origHeight > height ? symbol.origHeight : height;
    }

    this.pivot.x = this.config.align.x * width;
    this.pivot.y = this.config.align.y * height;

    //this.setOrigSize(width, height);
  }

  createSymbolsIfNeeded() {
    for (let i = this.text.length - this.symbols.length; i > 0; i--) {
      this.addSymbol("symbol_" + this.symbols.length);
    }
  }

  addSymbol(name) {
    const symbol = this.createSymbol(name);
    this.symbols.push(symbol);
    this.addChild(symbol.view);
  }

  createSymbol(name) {
    return window.application.objectFactory.create(this.getSymbolConfig(name));
  }

  getSymbolConfig() {
    return Object.assign({}, this.config.symbolConfig);
  }

  getSymbolImageName(symbol) {
    return (
      this.config.fontPrefix +
      (this.config.fontMap[symbol] ? this.config.fontMap[symbol] : symbol)
    );
  }

  getTextureBySymbol(symbol) {
    return Assets.get(this.getSymbolImageName(symbol));
  }

  hideAllSymbols() {
    this.symbols.forEach((symbol) => symbol.hide());
  }

  currentText() {
    return this.text;
  }

  setTint(tint = 0xffffff) {
    this.symbols.forEach((symbol) => (symbol.tint = tint));
  }

  /*
  Класс позволяет выводить текст из отдельных символов-картинок

  Основные методы
    setText(text) — отобразить текст text
    setTint(tint) — применить к каждому символу tint


  Параметры
    align — аналог anchor для спрайта:
      для x: 0 — фиксирует положение первого символа, 1 — последнего, 0.5 — центрирует
      для y: 0 — текст будет сдвигаться "вниз" относительно нуля, 1 — "вверх", 0.5 — центрирован по высоте (учитывается самый "высокий" символ)

    text — текст, который нужно вывести
    fontPrefix — путь до картинок, если используется папка — обязателен закрывающий слэш
    fontMap — название картинки для конкретных символов, по-умолчанию ищется картинка с названием символа
              (удобно использовать, когда нельзя назвать картинку этим символом)
    symbolSpacing — расстояние между картинками-символами в пикселях, можно использовать дробные и отрицательные
    symbolConfig — дефолтный конфиг для каждого символа

  Пример config:
  {
    class: Text,
    align: {x: 0, y: 0},
    text: 'text',
    fontPrefix: 'font/',
    fontMap: {' ': 'space', ':': 'colon'},
    symbolSpacing: 1,
    symbolConfig: {tint: 0xff0000}
  }
  */
  getDefaultConfig(config) {
    return Object.assign(super.getDefaultConfig(config), {
      align: { x: 0, y: 0 },
      text: "",
      fontPrefix: "font/",
      fontMap: {},
      symbolSpacing: 1,
      symbolConfig: {},
    });
  }
}
