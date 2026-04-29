export default class ObjectGenerator {
  constructor(templates, objects) {
    return objects.map(([name, position, config]) =>
      Object.assign({}, templates[name], { position }, config)
    );
  }
}
