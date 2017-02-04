import { CanvasView, Renderer } from 'soundworks/client';
import Balloon from '../renderers/Balloon';

const template = `
  <canvas class="background"></canvas>
  <div class="foreground">
    <div class="section-top"></div>
    <div class="section-center flex-middle">
      <p><%= angle %></p>
    </div>
    <div class="section-bottom flex-middle">
      <p class="small">Use the compass to choose<br />your instrument</p>
    </div>
  </div>
`;

const _2PI = 2 * Math.PI;

class MovingAverage {
  constructor(order) {
    this.order = order;
    this.buffer = new Float32Array(order);
    this.pointer = 0;
  }

  process(value) {
    const buffer = this.buffer;
    buffer[this.pointer] = value;

    let sum = 0;
    for (let i = 0, l = buffer.length; i < l; i++)
      sum += buffer[i];

    const avg = sum / this.order;
    this.pointer = (this.pointer + 1) % this.order;

    return avg;
  }
}

class AngleSmoothing {
  constructor(order) {
    this.order = order;
    this.sinFilter = new MovingAverage(order);
    this.cosFilter = new MovingAverage(order);
  }

  process(rad) {
    const sin = Math.sin(rad);
    const cos = Math.cos(rad);
    const smoothedSin = this.sinFilter.process(sin);
    const smoothedCos = this.cosFilter.process(cos);

    return Math.atan2(smoothedSin, smoothedCos);
  }
}

class CompassBalloon extends Balloon {
  constructor(...args) {
    super(...args);

    this.shrinkSize = null;
    this.growSize = null;
    this.targetSize = null;
  }

  grow() {
    this.targetSize = this.growSize;
  }

  shrink() {
    this.targetSize = this.shrinkSize;
  }

  update(dt) {
    const size = this.width;

    if (size !== this.targetSize) {
      const delta = this.targetSize - size;
      const croppedDelta = Math.max(-10, Math.min(delta, 10));

      this.width += croppedDelta;
      this.height += croppedDelta;
    }
  }

  render(ctx) {
    super.render(ctx);
  }
}

class CompassRenderer extends Renderer {
  constructor(spriteConfig, directions) {
    super();

    this._spriteConfig = spriteConfig;
    this._directions = Object.assign({}, directions);
    // to radians
    for (let color in this._directions)
      this._directions[color] = this._directions[color] / 360 * _2PI;

    this._activeColor = null;
    this._angle = 0;

    this.balloons = {};
    this._smoothAngle = new AngleSmoothing(8);
  }

  init() {
    const width = this.canvasWidth;
    const height = this.canvasHeight;
    const size = Math.min(width, height);

    const growSize = size / 1.5;
    const shrinkSize = size / 3;
    const config = this._spriteConfig;

    for (let color in this._directions) {
      const image = config.groups[color].image;
      const clipPositions = config.groups[color].clipPositions;
      const clipWidth = config.clipSize.width;
      const clipHeight = config.clipSize.height;
      const refreshRate = config.animationRate;
      const size = shrinkSize; // default to shrink

      const balloon = new CompassBalloon(color, image, clipPositions, clipWidth, clipHeight, refreshRate, size, size, 0, 0);

      balloon.opacity = 0;
      balloon.growSize = growSize;
      balloon.shrinkSize = shrinkSize;
      balloon.targetSize = shrinkSize;

      this.balloons[color] = balloon;
    }
  }

  setColor(color) {
    this._activeColor = color;
  }

  setAngle(angle) {
    this._angle = this._smoothAngle.process(angle / 360 * _2PI);
  }

  update(dt) {
    for (let color in this.balloons) {
      const balloon = this.balloons[color];

      if (balloon.opacity < 1)
        balloon.opacity = Math.min(balloon.opacity + 0.02);

      balloon.update(dt);
    }
  }

  render(ctx) {
    ctx.save();

    const hw = this.canvasWidth / 2;
    const hh = this.canvasHeight / 2;
    const size = Math.min(hw, hh);

    ctx.translate(hw, hh);

    for (let color in this._directions) {
      const balloon = this.balloons[color];

      if (color === this._activeColor)
        balloon.grow();
      else
        balloon.shrink();

      // `*= -1` because direction and orientation are defined counter clockwise
      // while rotate is clock wise
      const relAngle = -(this._directions[color] - this._angle);

      ctx.save();
      ctx.rotate(relAngle);
      ctx.translate(0, -size / 2);
      balloon.render(ctx);
      ctx.restore();
    }

    ctx.restore();
  }
}

class CompassState {
  constructor(experience, globalState) {
    this.experience = experience;
    this.globalState = globalState;

    this._onCompassUpdate = this._onCompassUpdate.bind(this);
    this._onGroupUpdate = this._onGroupUpdate.bind(this);

    this.renderer = new CompassRenderer(
      this.experience.spriteConfig,
      this.experience.areaConfig.directions
    );
  }

  enter() {
    this.view = new CanvasView(template, {
      angle: '',
    }, {}, {
      className: ['wait-state', 'foreground']
    });

    this.view.render();
    this.view.show();
    this.view.appendTo(this.experience.view.getStateContainer());

    this.view.setPreRender((ctx, dt, width, height) => {
      ctx.clearRect(0, 0, width, height);
    });

    this.view.addRenderer(this.renderer);

    this.experience.addCompassListener('compass', this._onCompassUpdate);
    this.experience.addCompassListener('group', this._onGroupUpdate);
    // set renderer with current group
    this.renderer.setColor(this.experience.groupFilter.getState());
  }

  exit() {
    this.view.$el.classList.remove('foreground');
    this.view.$el.classList.add('background');

    this.view.removeRenderer(this.renderer);
    this.view.remove();

    this.experience.removeCompassListener('compass', this._onCompassUpdate);
    this.experience.removeCompassListener('group', this._onGroupUpdate);
  }

  _onCompassUpdate(angle) {
    this.renderer.setAngle(angle);
  }

  _onGroupUpdate(color) {
    this.renderer.setColor(color);
  }
}

export default CompassState;
