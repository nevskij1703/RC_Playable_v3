import Behavior from "./Behavior";
import Trigger from "./../core/Trigger";

export const TRC_BEHAVIOR_DEFAULT_FIELD = "on";

/**
 * Класс бихевиора, реализующий систему TRC. Подробнее в статье: https://knowledge.playrix.com/pages/viewpage.action?pageId=142775503
 */
export class TRCBehavior extends Behavior {
  /**
   * Настраивает TRC, пытаясь найти массивы с объектами-описаниями в полях config'а переданного объекта
   *
   * @param obj объект, для которого настраивается TRC
   * @param behaviorConfig не используется
   */
  static create(obj /* , behaviorConfig */) {
    (
      obj.config._TRCFields ||
      obj.config._universalBehaviorFields || [TRC_BEHAVIOR_DEFAULT_FIELD]
    ).forEach(
      (field) =>
        obj.config &&
        obj.config[field] &&
        obj.config[field].forEach((trc) =>
          Trigger.setupForAll(obj, trc.t, trc.r, trc.c)
        )
    );
  }

  /**
   * Проверяет возможность применения бихевиора к объекту
   *
   * @param obj объект, для которого производится проверка
   * @returns boolean
   */
  static canBeAppliedFor(obj) {
    return (
      obj.config &&
      (obj.config._universalBehaviorFields ||
        obj.config._TRCFields ||
        obj.config[TRC_BEHAVIOR_DEFAULT_FIELD])
    );
  }
}
