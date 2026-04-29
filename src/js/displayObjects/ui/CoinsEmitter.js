import { ConfettiEmitter, PIXI } from "PlayableAdsEngine";

export default class CoinsEmitter extends ConfettiEmitter {
    particle() {
        const key = Symbol("particle");
        const epoch = performance.now();
        const gfx = PIXI.Sprite.from("ui/star");//new Graphics();
    
        let {
          coneW,
          coneH,
          coneHFuzz,
          dx,
          simSpeed,
          rotation,
          skewX,
          skewY,
          gravity,
          gravityFuzz,
          fallSpeed,
          scale,
          opacity,
          lifetime,
          fadeOut,
        } = this.opts;
    
        this.addChild(gfx);

        coneH = this.fuzz(-coneH, coneHFuzz);
        coneW = this.lerp(-coneW, coneW, Math.random());
        gravity = this.fuzz(gravity, gravityFuzz);
        gfx.angle = this.lerp(0, 360, Math.random());
        /*gfx.skew.set(
          this.lerp(0, 2*Math.PI, Math.random()),
          this.lerp(0, 2*Math.PI, Math.random())
        );*/
        gfx.alpha = opacity;
        gfx.scale = {x: scale, y: scale};
        gfx.position.set(0);
    
        const remove = () => {
          this.view.removeChild(gfx);
          gfx.destroy();
          this.items.delete(key);
        };
    
        let past = epoch;
        const render = (now) => {
          const ms = now - epoch;
          const delta = ((now - past) / 1000) * simSpeed;
          past = now;
          //console.log(delta)
    
          gfx.y += Math.min(coneH, fallSpeed) * delta;
          gfx.x += (coneW + dx) * delta;
          coneH += gravity * delta;
          gfx.rotation += rotation * delta;
          /*gfx.skew.x += skewX * delta;
          gfx.skew.y += skewY * delta;*/
    
          // TODO switch 1390 to parent height
          if (gfx.y - 200 > 1500) {
            remove();
            return;
          }
    
          if (ms > lifetime) {
            gfx.alpha = this.lerp(opacity, 0, (ms - lifetime) / fadeOut);
          }
    
          if (ms > lifetime + fadeOut) {
            remove();
          }
        };
    
        this.items.set(key, render);
      }
}