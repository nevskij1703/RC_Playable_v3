import { Rewards } from "PlayableAdsEngine";

export default class ObjectMover {
  static setTo(object, destination) {
    object.setSamePositionAs(destination);
  }

  static makeMoveScenario(points, speedFactor = 1) {
    const scenarioRewards = [];

    for (let i = 0; i < points.length - 1; i++) {
      const point = points[i].baseObject,
        nextPoint = points[i + 1].baseObject,
        duration = ObjectMover.getDist(point, nextPoint) * speedFactor,
        direction = ObjectMover.getDirection(point, nextPoint);

      scenarioRewards.push(
        function () {
          const scaleX =
            Math.abs(this.scale.x) * direction * this.config.baseDirection;
          this.scale.x = scaleX;
        },
        Rewards.startAnimation({
          from: { x: point.x, y: point.y },
          to: { x: nextPoint.x, y: nextPoint.y },
          duration,
        }),
      );
    }

    return scenarioRewards;
  }

  static getDist(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  static getDirection(from, to) {
    if (from.x < to.x) {
      return -1;
    }

    return 1;
  }
}
