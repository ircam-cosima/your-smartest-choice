import { CanvasView, Renderer } from 'soundworks/client';
import Balloon from '../renderers/Balloon';

const template = `
  <canvas class="background"></canvas>
  <div class="foreground">
    <div class="section-top flex-middle"></div>
    <div class="section-center flex-center">
    </div>
    <div class="section-bottom flex-middle"></div>
  </div>
`;

class BalloonCoverRenderer extends Renderer {
  constructor(spriteConfig) {
    super();

    this.spriteConfig = spriteConfig;
    this.balloons = [];
    this.aliveBalloons = [];
  }

  get length() {
    return this.aliveBalloons.length;
  }

  addBalloon() {
    const config = this.spriteConfig;
    const colorIndex = Math.floor(Math.random() * config.colors.length);
    const color = config.colors[colorIndex];

    const image = config.groups[color].image;
    const clipPositions = config.groups[color].clipPositions;
    const clipWidth = config.clipSize.width;
    const clipHeight = config.clipSize.height;
    const refreshRate = config.animationRate;
    const size = Math.min(this.canvasWidth, this.canvasHeight) * config.smallSizeRatio;

    // render balloons on a square to deal simply with orientation
    const maxSize = Math.max(this.canvasWidth, this.canvasHeight);
    const x = Math.random() * maxSize;
    const y = Math.random() * maxSize;

    const balloon = new Balloon(color, image, clipPositions, clipWidth, clipHeight, refreshRate, size, size, x, y);

    balloon.opacity = 0;

    this.balloons.push(balloon);
    this.aliveBalloons.push(balloon);
  }

  removeBalloon() {
    const lastIndex = this.aliveBalloons.length - 1;
    const balloon = this.aliveBalloons[lastIndex];
    balloon.explode = true;
    // remove from alive balloons
    this.aliveBalloons.length = lastIndex;
  }

  explodeBalloons(color) {
    for (let i = this.aliveBalloons.length - 1; i >= 0; i--) {
      const balloon = this.aliveBalloons[i];

      if (balloon.color === color) {
        balloon.explode = true;
        this.aliveBalloons.splice(i, 1);
      }
    }
  }

  explodeRandomBalloon() {
    // const index = Math.floor(Math.random() * this.balloons.length);
    const index = this.balloons.length - 1;
    const balloon = this.balloons[index];

    if (balloon) {
      balloon.explode = true;
      this.aliveBalloons.splice(index, 1);
    }
  }

  init() {

  }

  update(dt) {
    const balloons = this.balloons;

    for (let i = balloons.length - 1; i >= 0; i--) {
      const balloon = balloons[i];
      balloon.update(dt);

      if (balloon.opacity < 1)
        balloon.opacity = Math.min(balloon.opacity + 0.05, 1);

      if (balloon.isDead)
        balloons.splice(i, 1);
    }
  }

  render(ctx) {
    const balloons = this.balloons;

    for (let i = 0, l = balloons.length; i < l; i++)
      balloons[i].render(ctx);
  }
}

class BalloonCoverState {
  constructor(experience, globalState) {
    this.experience = experience;
    this.globalState = globalState;

    const numBarCover = 1;

    this._state = 'cover';
    this._coverTime = 0;
    this._coverDuration = 2.4 * numBarCover; // seconds
    this._maxBalloons = 500;
    // this._explodeInterval = 1;
    // this._explodeTime = 0;

    this.renderer = new BalloonCoverRenderer(experience.spriteConfig);

    this._explodeBalloons = this._explodeBalloons.bind(this);
  }

  enter() {
    this.view = new CanvasView(template, {}, {}, {
      className: ['balloon-cover-state', 'foreground'],
    });

    this.view.render();
    this.view.show();
    this.view.appendTo(this.experience.view.getStateContainer());

    this.view.setPreRender((ctx, dt, width, height) => {
      ctx.clearRect(0, 0, width, height);

      // cover
      if (this._state === 'cover') {
        this._coverTime += dt;

        if (this._coverTime <= this._coverDuration) {
          const numBalloons = Math.ceil(this._maxBalloons * this._coverTime / this._coverDuration);
          this._updateNumberBalloons(numBalloons);
        } else {
          this._toggleBackground(true);
          this._state = 'explode';
        }
      } else if (this._state === 'explode') {
        if (Math.random() < 0.03)
          this.renderer.explodeRandomBalloon();
      }
    });

    this.view.addRenderer(this.renderer);

    const sharedParams = this.experience.sharedParams;
    sharedParams.addParamListener('balloonCover:explode', this._explodeBalloons);
  }

  exit() {
    this._state = 'exit';
    this.view.$el.classList.remove('foreground');
    this.view.$el.classList.add('background');
    this.view.removeRenderer(this.renderer);
    this.view.remove();

    this._toggleBackground(false); // remove shared gif

    const sharedParams = this.experience.sharedParams;
    sharedParams.removeParamListener('balloonCover:explode', this._explodeBalloons);
  }

  _explodeBalloons(color) {
    if (this._state === 'explode')
      this.renderer.explodeBalloons(color);
  }

  _updateNumberBalloons(value) {
    if (this.renderer.length < value) {
      while (this.renderer.length < value)
        this.renderer.addBalloon();
    } else if (this.renderer.length > value) {
      while (this.renderer.length > value)
        this.renderer.removeBalloon();
    }
  }

  _toggleBackground(value) {
    if (value === true) {
      this.experience.showSharedVisual('gif:explodingBalloon');
    } else {
      this.experience.hideSharedVisual();
    }
  }
}

export default BalloonCoverState;
