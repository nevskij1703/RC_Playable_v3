/**
 * @typedef Options - Объект с настройками очереди
 *
 * @property { object } config - конфигом для создаваемого объекта
 * @property { number } [startSize = 5] - начальный размер пула
 * @property { number } [additionalSize = 5] - количество дополнительно создаваемых объектов, если все объекты пула используются
 */

/**
 * @typedef Item - Элемент очереди
 */

const FREE_OBJECT_FIELD_NAME = "_objectPoolFree";

/**
 * Класс создаёт пул из объектов, выдаёт свободные экземпляры, увеличивает размер пула, если при очередном запросе объекта нет ни одного свободного.<br>
 * Позволяет переиспользовать объекты сокращая количество операций выделения памяти, например, при эмите патиклов
 *
 * @param { Application } app - Application
 * @param { Options } config - объект с настройками
 */
export default class ObjectPool {
  constructor({
    config,
    startSize = 5,
    additionalSize = 5,
    createObject = () =>
      window.application.objectFactory.create(this.objectConfig),
  }) {
    this.objectConfig = config;
    this.additionalSize = additionalSize;

    this.pool = [];

    this.createObject = createObject;

    this.addObjects(startSize);
  }

  /**
   * Наполянет массив на заданную длину из предподготовленных объектов
   */
  addObjects(count) {
    for (let i = 0; i < count; i++) {
      this.pool.push(
        Object.assign(this.createObject(), { [FREE_OBJECT_FIELD_NAME]: true })
      );
    }
  }

  /**
   * Создаёт новый объект<br>
   * Стоит переопределять, если нужно кастомизировать создание объекта
   *
   * @returns { Item }
   */
  createObject() {}

  /**
   * Возвращает свободный объект из пула, пополняет пул новыми, если свободного нет
   *
   * @returns { Item }
   */
  get() {
    let obj = this.pool.find((item) => item[FREE_OBJECT_FIELD_NAME]);

    if (!obj) {
      this.addObjects(this.additionalSize);

      obj = this.get();
    } else {
      obj[FREE_OBJECT_FIELD_NAME] = false;
    }

    return obj;
  }

  /**
   * Отмечает объект свободным<br>
   * Нужно вызывать, когда объект больше не нужен
   *
   * @param { Item } object
   */
  free(object) {
    object[FREE_OBJECT_FIELD_NAME] = true;
  }
}
