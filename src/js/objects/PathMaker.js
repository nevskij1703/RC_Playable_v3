import { BaseObject } from "PlayableAdsEngine";

export default class PathMaker extends BaseObject {
  setupLogic() {
    super.setupLogic();

    const { points = [] } = this.config;

    this.points = points;
    this.pointsForIterations = {};
    this.paths = [];
  }

  getPointByName(name) {
    return this.pointsForIterations[name];
  }

  getPathFromToPoints(from, to) {
    //console.log(from.name, to.name);

    this.pointsForIterations = {};
    this.points.forEach((pointView) => {
      const point = pointView.baseObject;
      this.pointsForIterations[point.name] = {
        name: point.name,
        touchPoints: point.config.touchPoints.slice(),
      };
    });

    this.paths = [];
    this.makePaths(this.getPointByName(from.name));

    /* this.paths.forEach((path) => {
      let url = "";
      path.forEach((point) => (url += ` ${point.name}`));
      console.log(url);
    }); */

    let rightPaths = [];
    const rightWay = [];

    this.paths
      .filter(
        (path) =>
          path[0].name === from.name && path[path.length - 1].name === to.name
      )
      .forEach((foundPath) => {
        if (rightPaths.length > foundPath.length || rightPaths.length === 0) {
          rightPaths = foundPath;
        }
      });

    rightPaths.forEach((foundPoint) => {
      rightWay.push(
        this.points.find((point) => point.baseObject.name === foundPoint.name)
      );
    });

    return rightWay;
  }

  makePaths(from, points = [], counterIteration = 0) {
    let iteration = counterIteration + 1;
    const touchPointsCopy = from.touchPoints.slice();
    const iterationPoints = points.slice();
    iterationPoints.push(from);
    this.paths.push(iterationPoints);

    //console.log(counterIteration, touchPointsCopy, "|", from, points);

    touchPointsCopy.forEach((connectedPointName) => {
      const connectedPoint = this.getPointByName(connectedPointName);

      points.findIndex((value) => value.name === connectedPointName) === -1 &&
        this.makePaths(connectedPoint, iterationPoints, iteration);
    });
  }

  getDefaultConfig(config) {
    return Object.assign(super.getDefaultConfig(config), {});
  }
}
