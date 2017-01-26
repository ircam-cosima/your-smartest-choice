import { CanvasView, Renderer } from 'soundworks/client';
import Balloon from '../renderers/Balloon';

const template = `
  <canvas class="background"></canvas>
  <div class="foreground">
    <div class="section-top flex-middle"></div>
    <div class="section-center flex-center">
      <p class="big">Thanks!</p>
    </div>
    <div class="section-bottom flex-middle"></div>
  </div>
`;


class EndRenderer extends Renderer {
  constructor(spriteConfig) {
    super();

    this.spriteConfig = spriteConfig;
    this.balloons = new Set();
  }

  spawnBalloon() {
    const config = this.spriteConfig;
    const colorIndex = Math.floor(Math.random() * config.colors.length);
    const color = config.colors[colorIndex];

    const image = config.groups[color].image;
    const clipPositions = config.groups[color].clipPositions;
    const clipWidth = config.clipSize.width;
    const clipHeight = config.clipSize.height;
    const refreshRate = config.animationRate;
    const size = Math.min(this.canvasWidth, this.canvasHeight) * config.smallSizeRatio;
    const x = Math.random() * this.canvasWidth;
    const y = Math.random() * this.canvasHeight;

    const balloon = new Balloon(color, image, clipPositions, clipWidth, clipHeight, refreshRate, size, size, x, y);

    balloon.ttl = Math.random();
    balloon.opacity = 0;

    this.balloons.add(balloon);
  }

  update(dt) {
    this.balloons.forEach(balloon => {
      balloon.update(dt);
      balloon.ttl -= dt;

      if (balloon.opacity < 1)
        balloon.opacity = Math.min(1, balloon.opacity + 0.03);

      if (balloon.ttl < 0)
        balloon.explode = true;

      if (balloon.isDead)
        this.balloons.delete(balloon);
    });
  }

  render(ctx) {
    this.balloons.forEach(balloon => balloon.render(ctx));
  }
}

class EndState {
  constructor(experience, globalState) {
    this.experience = experience;
    this.globalState = globalState;

    this.renderer = new EndRenderer(this.experience.spriteConfig);

    this._spawnBalloon = this._spawnBalloon.bind(this);
    this._spawnTimeout = null;
  }

  enter() {
    this.view = new CanvasView(template, {}, {}, {
      className: ['end-state', 'foreground'],
    });

    this.view.render();
    this.view.show();
    this.view.appendTo(this.experience.view.getStateContainer());

    this.view.setPreRender((ctx, dt, width, height) => {
      ctx.clearRect(0, 0, width, height);
    });

    this.view.addRenderer(this.renderer);

    this._spawnTimeout = setTimeout(this._spawnBalloon, Math.random() * 1000);
  }

  exit() {
    this.view.$el.classList.remove('foreground');
    this.view.$el.classList.add('background');

    clearTimeout(this._spawnTimeout);

    this.view.removeRenderer(this.renderer);
    this.view.remove();
  }

  _spawnBalloon() {
    this.renderer.spawnBalloon();
    this._spawnTimeout = setTimeout(this._spawnBalloon, Math.random() * 500);
  }
}

export default EndState;
