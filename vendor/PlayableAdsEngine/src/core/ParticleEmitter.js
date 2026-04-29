import ObjectPool from "./ObjectPool";

class ParticleEmitter {
  constructor() {
    this.pools = {};
  }

  createPools(particles) {
    Object.keys(particles).forEach((name) => {
      const config = particles[name];
      const { poolStartSize = 20, poolAdditionalSize = 5 } = config;

      this.pools[name] = new ObjectPool({
        config,
        startSize: poolStartSize,
        additionalSize: poolAdditionalSize,
      });
    });
  }

  getParticle(particleName, config = {}) {
    const particle = this.pools[particleName].get();

    particle.name = particleName;

    Object.assign(particle.config, config);

    return particle;
  }

  emitParticle(particleName, config, ...args) {
    const particle = this.getParticle(particleName, config);

    particle.scenarios.main.reset().start(...args);

    return particle;
  }

  free(particle) {
    this.pools[particle.name].free(particle);
  }
}

export default new ParticleEmitter();
