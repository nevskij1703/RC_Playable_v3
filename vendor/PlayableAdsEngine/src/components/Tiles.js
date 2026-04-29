export default class Tiles {
  constructor(config) {
    const { cols = 0, prepend = false, tileConfig = function () {} } = config;
    const objects = [];

    for (let i = 0; i < cols; i++) {
      objects.push(tileConfig.call(this, i));
    }

    prepend && objects.reverse();

    return objects;
  }
}
