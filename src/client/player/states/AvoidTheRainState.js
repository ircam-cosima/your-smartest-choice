import { CanvasView, Renderer, viewport } from 'soundworks/client';
import AvoidTheRainSynth from '../audio/AvoidTheRainSynth';
import Balloon from '../renderers/Balloon';

const template = `
  <canvas class="background"></canvas>
  <div class="foreground">
    <div class="section-top">
      <div class="score">
        <p class="blue"><%= score.blue %></p>
        <p class="pink"><%= score.pink %></p>
        <p class="yellow"><%= score.yellow %></p>
        <p class="red"><%= score.red %></p>
      </div>
    </div>
    <div class="section-center">
      <% if (showInstructions === true) { %>
        <p class="align-center big">Level 2</p>
        <p class="align-center soft-blink">Tilt your phone to avoid the rain drops!</p>
      <% } %>
    </div>
    <div class="section-bottom flex-middle"></div>
  </div>
`;

const _2PI = Math.PI * 2;

class AvoidTheRainView extends CanvasView {
  onRender() {
    super.onRender();
    this.$score = this.$el.querySelector('.score');
  }

  hideScore() {
    this.$score.classList.add('hidden');
  }
}

class FloatingBalloon extends Balloon {
  constructor(fadeInDuration, ...args) {
    super(...args);

    this.opacity = 0;
    this.fadeInDuration = fadeInDuration;
    this.timeFadeIn = 0;
    this.vx = 0;
    this.vy = 0;
  }

  setRadius(radius) {
    // this.radius = width / 2 - 4;
    const size = (radius + 4) * 2;
    this.width = size;
    this.height = size;
    this.radius = radius;
  }

  update(dt, width, height) {
    super.update(dt);

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    // clamp to screen
    this.x = Math.max(0, Math.min(width, this.x));
    this.y = Math.max(0, Math.min(height, this.y));

    if (this.timeFadeIn < this.fadeInDuration) {
      this.timeFadeIn += dt;
      this.opacity = Math.min(1, this.timeFadeIn / this.fadeInDuration);
    } else {
      this.opacity = 1;
    }
  }
}

class RainDrop {
  constructor(x, y, vy) {
    this.x = x;
    this.y = y;
    this.vy = vy;
    this.radius = Math.round(Math.random()) + 1;

    // rgb(153, 204, 255)
    const r = Math.round(Math.random() * (255 - 153) + 153);
    const g = Math.round(Math.random() * (255 - 204) + 204);
    const b = 255;
    this.color = `rgb(${r}, ${g}, ${b})`;
  }

  update(dt) {
    this.y += (this.vy * dt);
  }

  render(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, _2PI, false);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  }
}

class AvoidTheRainRenderer extends Renderer {
  constructor(spriteConfig, onRainHit, onExploded) {
    super();

    this.spriteConfig = spriteConfig;
    this.onRainHit = onRainHit;
    this.onExploded = onExploded;
    this.explodeState = false;

    this.rainDrops = [];
    this.balloon = null;

    this.getBalloonNormalizedPosition = this.getBalloonNormalizedPosition.bind(this);
  }

  createBalloon(radius, fadeInDuration) {
    // if (this.balloon !== null)
    //   return;

    const config = this.spriteConfig;
    const colorIndex = Math.floor(Math.random() * config.colors.length);
    const color = config.colors[colorIndex];

    const image = config.groups[color].image;
    const clipPositions = config.groups[color].clipPositions;
    const clipWidth = config.clipSize.width;
    const clipHeight = config.clipSize.height;
    const refreshRate = config.animationRate;
    const size = radius * 2;
    const x = this.canvasWidth / 2;
    const y = this.canvasHeight * 3 / 5;

    const balloon = new FloatingBalloon(fadeInDuration, color, image, clipPositions, clipWidth, clipHeight, refreshRate, size, size, x, y);

    this.balloon = balloon;
  }

  createRainDrop() {
    const x = Math.random() * this.canvasWidth;
    const y = -10;
    const vy = 0.3 * this.canvasHeight * (Math.random() * 0.2 + 0.8);

    const rainDrop = new RainDrop(x, y, vy);
    this.rainDrops.push(rainDrop);
  }

  updateBalloonRadius(value) {
    if (this.balloon !== null)
      this.balloon.setRadius(value);
  }

  setBalloonAcceleration(vx, vy) {
    if (this.balloon !== null) {
      this.balloon.vx = vx;
      this.balloon.vy = vy;
    }
  }

  getBalloonNormalizedPosition() {
    let pos = null;

    if (this.balloon)
      pos = [this.balloon.x / this.canvasWidth, this.balloon.y / this.canvasHeight];

    return pos;
  }

  init() {}

  testRainHit() {
    if (this.balloon !== null &&
        this.balloon.explode !== true &&
        this.balloon.opacity >= 1
    ) {
      const x = this.balloon.x;
      const y = this.balloon.y;
      const radius = this.balloon.radius;
      const radiusSquared = radius * radius;

      for (let i = this.rainDrops.length - 1; i >= 0; i--) {
        const rainDrop = this.rainDrops[i];
        const dx = rainDrop.x - x;
        const dy = rainDrop.y - y;
        const distSquared = dx * dx + dy * dy;

        if (distSquared < radiusSquared) {
          // trigger
          this.onRainHit(this.balloon.color);
          this.balloon.explode = true;
          this.rainDrops.splice(i, 1);
          break;
        }
      }
    }
  }

  explode() {
    if (this.balloon !== null) {
      this.balloon.explode = true;
      this.explodeState = true;
    } else {
      this.onExploded();
    }
  }

  update(dt) {
    const width = this.canvasWidth;
    const height = this.canvasHeight;

    if (this.balloon !== null)
      this.balloon.update(dt, width, height);

    if (this.balloon !== null && this.balloon.isDead === true) {
      this.balloon = null;

      if (this.explodeState === true)
        this.onExploded();
    }

    for (let i = this.rainDrops.length - 1; i >= 0; i--) {
      const rainDrop = this.rainDrops[i];
      rainDrop.update(dt, width, height);

      if (rainDrop.y > this.canvasHeight + 10)
        this.rainDrops.splice(i, 1);
    }

    this.testRainHit();
  }

  render(ctx) {
    for (let i = this.rainDrops.length - 1; i >= 0; i--)
      this.rainDrops[i].render(ctx);

    if (this.balloon !== null)
      this.balloon.render(ctx);
  }
}

class AvoidTheRainState {
  constructor(experience, globalState) {
    this.experience = experience;
    this.globalState = globalState;

    this.orientation = null;
    this.currentBalloonRadius = 0;
    this.spawnInterval = null;
    this.spawnTimeout = null;
    this.createBalloonTimeout = null;

    this._onResize = this._onResize.bind(this);
    this._spawnBalloon = this._spawnBalloon.bind(this);
    this._updateBalloonRadius = this._updateBalloonRadius.bind(this);
    this._onAccelerationInput = this._onAccelerationInput.bind(this);
    this._toggleRain = this._toggleRain.bind(this);
    this._updateSpawnInterval = this._updateSpawnInterval.bind(this);
    this._onRainHit = this._onRainHit.bind(this);
    this._onExploded = this._onExploded.bind(this);
    this._onHarmonyUpdate = this._onHarmonyUpdate.bind(this);
    this._onSineVolumeUpdate = this._onSineVolumeUpdate.bind(this);

    this.renderer = new AvoidTheRainRenderer(this.experience.spriteConfig, this._onRainHit, this._onExploded);

    this.synth = new AvoidTheRainSynth(
      this.experience.audioBufferManager.get('avoid-the-rain:sines'),
      this.experience.audioBufferManager.get('avoid-the-rain:glitches'),
      this.experience.avoidTheRainConfig,
      this.experience.getAudioDestination()
    );
  }

  enter() {
    viewport.addResizeListener(this._onResize);

    this.view = new AvoidTheRainView(template, {
      showInstructions: true,
      score: Object.assign({}, this.globalState.score),
    }, {}, {
      className: ['avoid-the-rain-state', 'foreground'],
    });

    this.view.render();
    this.view.show();
    this.view.appendTo(this.experience.view.getStateContainer());

    const instructionsDuration = 10;
    let instructionsTime = 0;

    this.view.setPreRender((ctx, dt, width, height) => {
      ctx.clearRect(0, 0, width, height);

      if (this.view.content.showInstructions === true) {
        instructionsTime += dt;

        if (instructionsTime > instructionsDuration) {
          this.view.content.showInstructions = false;
          this.view.render('.section-center');
        }
      }

      // update synth normalized position - lag of one frame...
      const pos = this.renderer.getBalloonNormalizedPosition();
      if (pos !== null) { // don't update synth control values if no balloon
        this.synth.controlPosition[0] = pos[0];
        this.synth.controlPosition[1] = pos[1];
        this.synth.onControlUpdate();
      }
    });

    this.view.addRenderer(this.renderer);

    const sharedParams = this.experience.sharedParams;
    sharedParams.addParamListener('avoidTheRain:balloonRadius', this._updateBalloonRadius);
    sharedParams.addParamListener('avoidTheRain:spawnInterval', this._updateSpawnInterval);
    sharedParams.addParamListener('avoidTheRain:harmony', this._onHarmonyUpdate);
    sharedParams.addParamListener('avoidTheRain:sineVolume', this._onSineVolumeUpdate);
    // call this at the end to be sure all other params are set
    // sharedParams.addParamListener('avoidTheRain:start', this._onStart);
    sharedParams.addParamListener('avoidTheRain:toggleRain', this._toggleRain);

    this.experience.addAccelerationListener(this._onAccelerationInput);

    this._spawnBalloon();
  }

  exit() {
    viewport.removeResizeListener(this._onResize);

    this.view.hideScore();
    this.view.$el.classList.remove('background');
    this.view.$el.classList.add('foreground');

    clearTimeout(this.spawnTimeout);
    clearTimeout(this.createBalloonTimeout);

    this.renderer.explode();
    this.synth.stopSine();
    this.synth.triggerGlitch();

    // stop listening sharedParams
    const sharedParams = this.experience.sharedParams;
    sharedParams.removeParamListener('avoidTheRain:harmony', this._onHarmonyUpdate);
    sharedParams.removeParamListener('avoidTheRain:balloonRadius', this._updateBalloonRadius);
    sharedParams.removeParamListener('avoidTheRain:spawnInterval', this._updateSpawnInterval);
    sharedParams.removeParamListener('avoidTheRain:sineVolume', this._onSineVolumeUpdate);
    // sharedParams.removeParamListener('avoidTheRain:start', this._onStart);
    sharedParams.removeParamListener('avoidTheRain:toggleRain', this._toggleRain);
    // stop listening motion-input
    this.experience.removeAccelerationListener(this._onAccelerationInput);
  }

  _onExploded() {
    this.view.removeRenderer(this.renderer);
    this.view.remove();
  }

  _onSineVolumeUpdate(value) {
    this.synth.setSineMaster(value);
  }

  _updateBalloonRadius(value) {
    this.renderer.updateBalloonRadius(value);
    this.currentBalloonRadius = value;
  }

  _onResize(width, height, orientation) {
    this.orientation = orientation;
  }

  _onAccelerationInput(data) {
    let vx;
    let vy;

    if (this.orientation === 'portrait') {
      vx = - data[0] / 9.81;
      vy = (data[1] - 5) / 9.81;
    } else if (this.orientation === 'landscape') {
      vx = - data[1] / 9.81;
      vy = - (data[0] + 5) / 9.81;
    }

    const k = 500;
    this.renderer.setBalloonAcceleration(vx * k, vy * k);
  }

  _onRainHit(color) {
    this.globalState.score[color] -= 1;
    this.view.content.score[color] -= 1;
    this.view.render('.score');

    this.synth.stopSine();
    this.synth.triggerGlitch();
    // respawn ballon in one second (should be bigger than grain duration)
    this.createBalloonTimeout = setTimeout(this._spawnBalloon, 1000);
  }

  _spawnBalloon() {
    const fadeInDuration = 1;
    this.renderer.createBalloon(this.currentBalloonRadius, fadeInDuration);
    this.synth.startSine(fadeInDuration);
  }

  _toggleRain(value) {
    if (value === 'start' &&
        this.view.content.state !== 'intro' &&
        this.spawnTimeout === null
    ) {
      this._spawnRainDrop();
    } else if (value === 'stop') {
      clearTimeout(this.spawnTimeout);
      this.spawnTimeout = null;
    }
  }

  _updateSpawnInterval(value) {
    this.spawnInterval = value;
  }

  _spawnRainDrop() {
    this.renderer.createRainDrop();
    // min delay to 50ms
    const delay = Math.max(0.05, Math.random() * this.spawnInterval * 0.5 + this.spawnInterval * 0.5);
    this.spawnTimeout = setTimeout(() => this._spawnRainDrop(), delay * 1000);
  }

  _onHarmonyUpdate(value) {
    this.synth.setNextHarmony(value);
  }
}

export default AvoidTheRainState;
