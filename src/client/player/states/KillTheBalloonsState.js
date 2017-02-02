import { CanvasView, Renderer } from 'soundworks/client';
import Balloon from '../renderers/Balloon';
import KillTheBalloonsSynth from '../audio/KillTheBalloonsSynth';

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
      <% if (showInstructions) { %>
        <p class="align-center big">Level 1</p>
        <p class="align-center soft-blink">Click the balloons to explode them!</p>
      <% } %>
    </div>
    <div class="section-bottom flex-middle"></div>
  </div>
`;

class KillTheBalloonsView extends CanvasView {
  onRender() {
    super.onRender();
    this.$canvas = this.$el.querySelector('canvas');
    this.$score = this.$el.querySelector('.score');
  }

  onResize(...args) {
    super.onResize(...args);
    this.canvasBoundingClientRect = this.$canvas.getBoundingClientRect();
  }

  hideScore() {
    this.$score.classList.add('hidden');
  }
}

class RisingBalloon extends Balloon {
  constructor(...args) {
    super(...args);
    this.vy = - (Math.random() * 0.4 + 0.6) * 200;
  }

  update(dt) {
    this.vy *= 1.002;
    this.x += Math.random() * 0.2 - 0.1;
    this.y += (this.vy * dt);

    super.update(dt);
  }
}

class KillTheBalloonsRenderer extends Renderer {
  constructor(spriteConfig, onExploded) {
    super();

    this.spriteConfig = spriteConfig;
    this.onExploded = onExploded;
    this.isEnded = false;
    this.sizeDiversity = 0;

    this.numZIndex = 3;
    this.balloons = new Array(3);
    // prepare stack for each z-indexes
    for (let i = 0; i < this.numZIndex; i++)
      this.balloons[i] = [];
  }

  spawnBalloon() {
    const config = this.spriteConfig;
    const colorIndex = Math.floor(Math.random() * config.colors.length);
    const color = config.colors[colorIndex];

    const image = config.groups[color].halfSizeImage;
    const clipPositions = config.groups[color].clipPositions;
    const clipWidth = Math.floor(config.clipSize.width / 2);
    const clipHeight = Math.floor(config.clipSize.height / 2);
    const refreshRate = config.animationRate;

    const sizeRatio = config.smallSizeRatio + (Math.random() * 2 - 1) * 0.15 * this.sizeDiversity;
    const size = Math.min(this.canvasWidth, this.canvasHeight) * sizeRatio;
    const x = Math.random() * this.canvasWidth;
    const y = this.canvasHeight + size;

    const balloon = new RisingBalloon(color, image, clipPositions, clipWidth, clipHeight, refreshRate, size, size, x, y);

    const zIndex = Math.floor(Math.random() * this.numZIndex);
    this.balloons[zIndex].push(balloon);
  }

  explodeAll() {
    for (let z = 0; z < this.balloons.length; z++) {
      const layer = this.balloons[z];

      for (let i = 0, l = layer.length; i < l; i++) {
        const balloon = layer[i];
        balloon.explode = true;
      }
    }

    this.isEnded = true;
  }

  update(dt) {
    let isEmpty = true;

    for (let z = 0; z < this.numZIndex; z++) {
      const layer = this.balloons[z];

      for (let i = layer.length - 1; i >= 0; i--) {
        const balloon = layer[i];
        balloon.update(dt);

        // if outside the screen
        if (balloon.y < - (balloon.radius + 10))
          balloon.isDead = true;

        if (balloon.isDead)
          layer.splice(i, 1);
      }

      if (layer.length !== 0)
        isEmpty = false;
    }

    if (this.isEnded && isEmpty)
      this.onExploded();
  }

  render(ctx) {
    for (let z = 0; z < this.numZIndex; z++) {
      const layer = this.balloons[z];

      for (let i = 0, l = layer.length; i < l; i++)
        layer[i].render(ctx);
    }
  }
}

class KillTheBalloonsState {
  constructor(experience, globalState) {
    this.experience = experience;
    this.globalState = globalState;

    this._spawnTimeout = null;
    this._maxSpawnInterval = null;

    this._spawnBalloon = this._spawnBalloon.bind(this);
    this._updateMaxSpawn = this._updateMaxSpawn.bind(this);
    this._updateBalloonSizeDiversity = this._updateBalloonSizeDiversity.bind(this);
    this._onExploded = this._onExploded.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onSamplesSet = this._onSamplesSet.bind(this);

    this.renderer = new KillTheBalloonsRenderer(this.experience.spriteConfig, this._onExploded);

    this.synth = new KillTheBalloonsSynth(
      this.experience.killTheBalloonsConfig.sets,
      this.experience.audioBufferManager.get('kill-the-balloons'),
      this.experience.getAudioDestination()
    );
  }

  enter() {
    this.view = new KillTheBalloonsView(template, {
      showInstructions: true,
      score: Object.assign({}, this.globalState.score),
    }, {
      touchstart: this._onTouchStart,
    }, {
      className: ['kill-the-balloons-state', 'foreground'],
    });

    this.view.render();
    this.view.show();
    this.view.appendTo(this.experience.view.getStateContainer());

    this.view.setPreRender((ctx, dt, width, height) => {
      ctx.clearRect(0, 0, width, height);
    });

    this.view.addRenderer(this.renderer);

    const sharedParams = this.experience.sharedParams;
    sharedParams.addParamListener('killTheBalloons:samplesSet', this._onSamplesSet);
    sharedParams.addParamListener('killTheBalloons:spawnInterval', this._updateMaxSpawn);
    sharedParams.addParamListener('killTheBalloons:sizeDiversity', this._updateBalloonSizeDiversity);

    // init spawn
    this._spawnBalloon();
  }

  exit() {
    clearTimeout(this._spawnTimeout);

    this.view.$el.classList.remove('foreground');
    this.view.$el.classList.add('background');
    this.view.hideScore();

    this.renderer.explodeAll();

    const sharedParams = this.experience.sharedParams;
    sharedParams.removeParamListener('killTheBalloons:samplesSet', this._onSamplesSet);
    sharedParams.removeParamListener('killTheBalloons:spawnInterval', this._updateMaxSpawn);
    sharedParams.removeParamListener('killTheBalloons:sizeDiversity', this._updateBalloonSizeDiversity);
  }

  _onExploded() {
    this.view.removeRenderer(this.renderer);
    this.view.remove();
  }

  _updateBalloonSizeDiversity(value) {
    this.renderer.sizeDiversity = value;
  }

  _updateMaxSpawn(value) {
    this._maxSpawnInterval = value;

    clearTimeout(this._spawnTimeout);
    this._spawnTimeout = setTimeout(this._spawnBalloon, this._getSpawnDelay());
  }

  _spawnBalloon() {
    this.renderer.spawnBalloon();
    this._spawnTimeout = setTimeout(this._spawnBalloon, this._getSpawnDelay());
  }

  _getSpawnDelay() {
    const halfMaxSpawn = this._maxSpawnInterval / 2;
    // min delay to 50ms
    const delay = Math.max(0.05, halfMaxSpawn + halfMaxSpawn * Math.random()); // seconds
    return delay * 1000;
  }

  _onTouchStart(e) {
    const touch = e.touches[0];
    const x = touch.clientX - this.view.canvasBoundingClientRect.left;
    const y = touch.clientY - this.view.canvasBoundingClientRect.top;

    this._testHit(this.renderer.balloons, x, y);
  }

  _testHit(balloons, x, y) {
    // start from top to bottom z-indexes
    for (let z = balloons.length - 1; z >= 0; z--) {
      const layer = balloons[z];

      for (let i = 0, l = layer.length; i < l; i++) {
        const balloon = layer[i];
        const dx = balloon.x - x;
        const dy = balloon.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < balloon.radius) {
          balloon.explode = true;
          this._updateScore(balloon.color);
          this._triggerSample(balloon.color, balloon.x, balloon.y);
          return;
        }
      }
    }
  }

  _updateScore(color) {
    if (this.view.content.showInstructions === true) {
      this.view.content.showInstructions = false;
      this.view.render('.section-center');
    }

    // update model
    this.globalState.score[color] += 1;
    // update view model
    this.view.content.score[color] += 1;
    this.view.render('.score');
  }

  _triggerSample(color, x, y) {
    this.synth.trigger(color);
  }

  _onSamplesSet(value) {
    this.synth.setSamplesSetIndex(value);
  }
}

export default KillTheBalloonsState;
