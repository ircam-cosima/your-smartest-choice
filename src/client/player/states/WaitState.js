import { CanvasView, Renderer } from 'soundworks/client';
import Balloon from '../renderers/Balloon';

const template = `
  <canvas class="background"></canvas>
  <div class="foreground">
    <div class="section-top flex-middle"></div>
    <div class="section-center flex-center">
    </div>
    <div class="section-bottom flex-middle">
      <% if (showText) { %>
        <p class="small soft-blink">Please wait for the beginning</p>
      <% } %>
    </div>
  </div>
`;

class BalloonRenderer extends Renderer {
  constructor(spriteConfig, onExplode) {
    super();

    this.spriteConfig = spriteConfig;
    this.onExplode = onExplode;
  }

  init() {
    // should create a factory (getBallon())
    const config = this.spriteConfig;
    // pick a random color
    const colorIndex = Math.floor(Math.random() * config.colors.length);
    const color = config.colors[colorIndex];

    const image = config.groups[color].image;
    const clipPositions = config.groups[color].clipPositions;
    const clipWidth = config.clipSize.width;
    const clipHeight = config.clipSize.height;
    const refreshRate = config.animationRate;
    const size = Math.min(this.canvasWidth, this.canvasHeight) * config.largeSizeRatio;
    const x = this.canvasWidth / 2;
    const y = this.canvasHeight / 2;

    this.balloon = new Balloon(color, image, clipPositions, clipWidth, clipHeight, refreshRate, size, size, x, y);

    this.balloon.opacity = 0;
  }

  onResize(canvasWidth, canvasHeight, orientation) {
    super.onResize(canvasWidth, canvasHeight, orientation);

    if (this.balloon) {
      this.balloon.x = canvasWidth / 2;
      this.balloon.y = canvasHeight / 2;
    }
  }

  explode() {
    this.balloon.explode = true;
  }

  update(dt) {
    // this.balloon.x += Math.random() * 0.2 - 0.1;
    // this.balloon.y += Math.random() * 0.2 - 0.1;
    this.balloon.update(dt);

    if (this.balloon.opacity < 1)
      this.balloon.opacity = Math.min(this.balloon.opacity + 0.02, 1);

    if (this.balloon.isDead)
      this.onExplode();
  }

  render(ctx) {
    this.balloon.render(ctx);
  }
}

class WaitState {
  constructor(experience, globalState) {
    this.experience = experience;
    this.globalState = globalState;

    this._onExploded = this._onExploded.bind(this);
    this.renderer = new BalloonRenderer(this.experience.spriteConfig, this._onExploded);
  }

  enter() {
    this.view = new CanvasView(template, {
      showText: true
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
  }

  exit() {
    this.view.$el.classList.remove('foreground');
    this.view.$el.classList.add('background');

    this.view.content.showText = false;
    this.view.render('.section-center');
    // make the balloon explode, wait for
    this.renderer.explode();
  }

  _onExploded() {
    this.view.removeRenderer(this.renderer);
    this.view.remove();
  }
}

export default WaitState;
