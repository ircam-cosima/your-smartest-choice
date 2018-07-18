import { CanvasView, Canvas2dRenderer } from 'soundworks/client';
import Balloon from '../renderers/Balloon';

const template = `
  <canvas class="background"></canvas>
  <div class="foreground">
    <div class="score-wrapper">
      <div class="score red">
        <p class="global"><%= showGlobalScore ? globalScore.red : '' %></p>
        <p class="local"><%= localScore.red %></p>
      </div>
      <div class="score blue">
        <p class="global"><%= showGlobalScore ? globalScore.blue : '' %></p>
        <p class="local"><%= localScore.blue %></p>
      </div>
      <div class="score pink">
        <p class="global"><%= showGlobalScore ? globalScore.pink : '' %></p>
        <p class="local"><%= localScore.pink %></p>
      </div>
      <div class="score yellow">
        <p class="global"><%= showGlobalScore ? globalScore.yellow : '' %></p>
        <p class="local"><%= localScore.yellow %></p>
      </div>
    </div>
  </div>
`;

const scoreOrder = ['red', 'blue', 'pink', 'yellow'];

class ScoresView extends CanvasView {
  onRender() {
    super.onRender();

    this.$scores = Array.from(this.$el.querySelectorAll('.score'));
    this.$foreground = this.$el.querySelector('.foreground');
  }

  onResize(viewportWidth, viewportHeight, ...args) {
    super.onResize(viewportWidth, viewportHeight, ...args);

    // resize foreground
    this.$foreground.style.width = `${viewportWidth}px`;
    this.$foreground.style.height = `${viewportHeight}px`;

    const hw = viewportWidth / 2;
    const hh = viewportHeight / 2;

    this.$scores.forEach(($score, index) => {
      $score.style.width = `${hw}px`;
      $score.style.height = `${hh}px`;
      $score.style.lineHeight = `${hh}px`;
      $score.style.left = `${(index % 2) * hw}px`;
      $score.style.top = `${Math.floor(index / 2) * hh}px`;
    });
  }
}

class FadeInBalloon extends Balloon {
  constructor(fadeInTarget, ...args) {
    super(...args);

    this.fadeInTarget = fadeInTarget;
    this.opacity = 0;
    this.fadeIn = true;
  }

  update(dt) {
    super.update(dt);

    if (this.fadeIn && this.opacity < this.fadeInTarget) {
      this.opacity = Math.min(1, this.opacity += 0.02);

      if (this.opacity === this.fadeInTarget)
        this.fadeIn = false;
    }
  }
}

class ScoresRenderer extends Canvas2dRenderer {
  constructor(spriteConfig, score) {
    super();

    this.spriteConfig = spriteConfig;
    this.localScore = score;
    this.globalScore = null;
    this.transferRatios = { red: 0, blue: 0, pink: 0, yellow: 0 };

    this.localBalloons = [];
    this.globalBalloons = [];

    this.globalBalloonsOffset = 20;
    // this.bars = [];
    this.exploded = [];
    this.showGlobalScore = false;
  }

  _getLocalBalloonSize(color) {
    const hw = this.canvasWidth / 2;
    const hh = this.canvasHeight / 2;
    const size = Math.min(hw, hh);
    const config = this.spriteConfig;
    const padding = 10;
    const maxSize = size - padding;
    const minSize = maxSize * config.minSizeScoreRatio;
    const localScore = this.localScore;

    let maxScore = -Infinity;
    let minScore = +Infinity;

    for (let color in localScore) {
      if (localScore[color] > maxScore)
        maxScore = localScore[color];

      if (localScore[color] < minScore)
        minScore = localScore[color];
    }

    const score = localScore[color];
    const normScore = (maxScore - minScore) === 0 ?
      0 : (score - minScore) / (maxScore - minScore);
    const remainingRatio = 1 - this.transferRatios[color];
    const remainingNormScore = normScore * remainingRatio;
    const displaySize = (maxSize - minSize) * remainingNormScore + minSize;

    return Math.floor(displaySize);
  }

  _getGlobalBalloonSize(color) {
    const config = this.spriteConfig;
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    const maxSize = Math.min(h, w) * 2;
    const minSize = Math.min(h, w) * 0.3;
    const globalScore = this.globalScore;

    if (globalScore === null)
      return minSize;

    let maxPercent = -Infinity;

    for (let color in globalScore) {
      if (globalScore[color] > maxPercent)
        maxPercent = globalScore[color];
    }

    // max percent is max size - 0 is min size
    const currentPercent = globalScore[color] * this.transferRatios[color];
    const normCurrentPercent = currentPercent / maxPercent;
    const displaySize = (maxSize - minSize) * normCurrentPercent + minSize;

    return Math.floor(displaySize);
  }

  init() {
    this.initLocalBalloons();
    this.initGlobalBalloons();
  }

  initLocalBalloons() {
    const config = this.spriteConfig;
    const hh = this.canvasHeight / 2;
    const hw = this.canvasWidth / 2;

    scoreOrder.forEach((color, index) => {
      const image = config.groups[color].image;
      const clipPositions = config.groups[color].clipPositions;
      const clipWidth = config.clipSize.width;
      const clipHeight = config.clipSize.height;
      const refreshRate = config.animationRate;
      const size = this._getGlobalBalloonSize(color);

      const x = hw / 2 + hw * (index % 2);
      const y = hh / 2 + hh * Math.floor(index / 2);

      const balloon = new FadeInBalloon(1, color, image, clipPositions, clipWidth, clipHeight, refreshRate, size, size, x, y);

      this.localBalloons.push(balloon);
    });
  }

  initGlobalBalloons() {
    const config = this.spriteConfig;
    const h = this.canvasHeight;
    const w = this.canvasWidth;
    const offset = this.globalBalloonsOffset;

    scoreOrder.forEach((color, index) => {
      const image = config.groups[color].image;
      const clipPositions = config.groups[color].clipPositions;
      const clipWidth = config.clipSize.width;
      const clipHeight = config.clipSize.height;
      const refreshRate = config.animationRate;
      const size = this._getGlobalBalloonSize(color);

      const x = (index % 2) === 0 ? offset : w - offset;
      const y = Math.floor(index / 2) === 0 ? offset : h - offset;

      const balloon = new Balloon(color, image, clipPositions, clipWidth, clipHeight, refreshRate, size, size, x, y);

      this.globalBalloons.push(balloon);
    });
  }

  setTransfertRatio(color, value) {
    this.transferRatios[color] = value;

    this.localBalloons.forEach((balloon) => {
      if (balloon.color === color) {
        const size = this._getLocalBalloonSize(color);
        balloon.width = size;
        balloon.height = size;

        if (!balloon.fadeIn)
          balloon.opacity = (1 - value) * 0.8 + 0.2;
      }
    });

    this.globalBalloons.forEach((balloon) => {
      if (balloon.color === color) {
        const size = this._getGlobalBalloonSize(color);
        balloon.width = size;
        balloon.height = size;
        balloon.opacity = value * 0.8 + 0.2;
      }
    });
  }

  explode(color) {
    this.localBalloons.forEach((balloon) => {
      if (balloon.color === color)
        balloon.explode = true;
    });

    this.globalBalloons.forEach((balloon) => {
      if (balloon.color === color)
        balloon.explode = true;
    });

    this.exploded.push(color);
  }

  onResize(width, height, orientation) {
    super.onResize(width, height, orientation);

    const hw = width / 2;
    const hh = height / 2;
    const offset = this.globalBalloonsOffset;

    this.localBalloons.forEach((balloon, index) => {
      balloon.x = hw / 2 + hw * (index % 2);
      balloon.y = hh / 2 + hh * Math.floor(index / 2);
    });

    this.globalBalloons.forEach((balloon, index) => {
      balloon.x = (index % 2) === 0 ? offset : width - offset;
      balloon.y = Math.floor(index / 2) === 0 ? offset : height - offset;
    });
  }

  update(dt) {
    this.localBalloons.forEach((balloon) => balloon.update(dt));

    if (this.showGlobalScore)
      this.globalBalloons.forEach((balloon) => balloon.update(dt));
  }

  render(ctx) {
    this.localBalloons.forEach((balloon) => balloon.render(ctx));

    if (this.showGlobalScore)
      this.globalBalloons.forEach((balloon) => balloon.render(ctx));
  }
}

class ScoresState {
  constructor(experience, globalState) {
    this.experience = experience;
    this.globalState = globalState;

    this.localScore = globalState.score;
    this.globalScore = null;
    this.transferRatios = { red: 0, blue: 0, pink: 0, yellow: 0 };
    // @debug
    // this.localScore = { red: -12, blue: 35, pink: 23, yellow: 18 };

    this._onGlobalScoreResponse = this._onGlobalScoreResponse.bind(this);
    //
    this._onShowGlobalScore = this._onShowGlobalScore.bind(this);
    this._onBlueTransfertRatioUpdate = this._onTransfertRatioUpdate('blue');
    this._onPinkTransfertRatioUpdate = this._onTransfertRatioUpdate('pink');
    this._onYellowTransfertRatioUpdate = this._onTransfertRatioUpdate('yellow');
    this._onRedTransfertRatioUpdate = this._onTransfertRatioUpdate('red');
    this._onExplode = this._onExplode.bind(this);

    this.renderer = new ScoresRenderer(this.experience.spriteConfig, this.localScore);
  }

  enter() {
    const displayedLocalScore = Object.assign({}, this.localScore);
    const displayedGlobalScore = { red: '0.0%', blue: '0.0%', pink: '0.0%', yellow: '0.0%' };

    this.view = new ScoresView(template, {
      showGlobalScore: false,
      localScore: displayedLocalScore,
      globalScore: displayedGlobalScore,
    }, {}, {
      className: ['scores-state', 'foreground'],
      ratios: { '.score-wrapper': 1 },
    });

    this.view.render();
    this.view.show();
    this.view.appendTo(this.experience.view.getStateContainer());

    this.view.setPreRender((ctx, dt, width, height) => {
      ctx.clearRect(0, 0, width, height);
    });

    this.view.addRenderer(this.renderer);

    // send local and receive global score
    this.experience.send('player:score', this.localScore);
    this.experience.receive('global:score', this._onGlobalScoreResponse);

    const sharedParams = this.experience.sharedParams;
    sharedParams.addParamListener('score:showGlobalScore', this._onShowGlobalScore);
    sharedParams.addParamListener('score:blue:transfertRatio', this._onBlueTransfertRatioUpdate);
    sharedParams.addParamListener('score:pink:transfertRatio', this._onPinkTransfertRatioUpdate);
    sharedParams.addParamListener('score:yellow:transfertRatio', this._onYellowTransfertRatioUpdate);
    sharedParams.addParamListener('score:red:transfertRatio', this._onRedTransfertRatioUpdate);
    sharedParams.addParamListener('score:explode', this._onExplode);
  }

  exit() {
    this.view.$el.classList.remove('foreground');
    this.view.$el.classList.add('background');

    this.view.removeRenderer(this.renderer);
    this.view.remove();

    const sharedParams = this.experience.sharedParams;
    sharedParams.removeParamListener('score:showGlobalScore', this._onShowGlobalScore);
    sharedParams.removeParamListener('score:blue:transfertRatio', this._onBlueTransfertRatioUpdate);
    sharedParams.removeParamListener('score:pink:transfertRatio', this._onPinkTransfertRatioUpdate);
    sharedParams.removeParamListener('score:yellow:transfertRatio', this._onYellowTransfertRatioUpdate);
    sharedParams.removeParamListener('score:red:transfertRatio', this._onRedTransfertRatioUpdate);
    sharedParams.removeParamListener('score:explode', this._onExplode);

    this.experience.removeListener('global:score', this._onGlobalScoreResponse);
  }

  _onGlobalScoreResponse(globalScore) {
    // populate renderer with globalScore
    this.globalScore = globalScore;
    this.renderer.globalScore = globalScore;

    this._onBlueTransfertRatioUpdate(this.transferRatios['blue']);
    this._onPinkTransfertRatioUpdate(this.transferRatios['pink']);
    this._onYellowTransfertRatioUpdate(this.transferRatios['yellow']);
    this._onRedTransfertRatioUpdate(this.transferRatios['red']);
  }

  _onShowGlobalScore(value) {
    if (value === 'show') {
      this.renderer.showGlobalScore = true;
      this.view.model.showGlobalScore = true;
      this.view.render('.score-wrapper');
    }
  }

  _onTransfertRatioUpdate(color) {
    return (value) => {
      this.transferRatios[color] = value;
      this.renderer.setTransfertRatio(color, value);

      // update local score
      const remainValue = Math.round(this.localScore[color] * (1 - value));
      this.view.model.localScore[color] = remainValue;
      // update global score
      if (this.globalScore) {
        const percent = this.globalScore[color] * value;
        this.view.model.globalScore[color] = `${percent.toFixed(1)}%`;
      }

      this.view.render(`.score.${color} p.local`);
      this.view.render(`.score.${color} p.global`);
    }
  }

  _onExplode(color) {
    if (color !== 'none') {
      this.renderer.explode(color);

      this.view.model.localScore[color] = '';
      this.view.render('.score-wrapper');
    }
  }
}

export default ScoresState;
