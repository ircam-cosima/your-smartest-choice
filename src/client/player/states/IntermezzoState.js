import { CanvasView, Canvas2dRenderer } from 'soundworks/client';
import Balloon from '../renderers/Balloon';

const template = `
  <canvas class="background"></canvas>
  <div class="foreground">
    <div class="score-wrapper">
      <% if (showScoreNumbers) { %>
        <div class="score red"><%= score.red %></div>
        <div class="score blue"><%= score.blue %></div>
        <div class="score pink"><%= score.pink %></div>
        <div class="score yellow"><%= score.yellow %></div>
      <% } %>
    </div>
  </div>
`;

const scoreOrder = ['red', 'blue', 'pink', 'yellow'];

class IntermezzoView extends CanvasView {
  onRender() {
    super.onRender();

    this.$red = this.$el.querySelector('.red');
    this.$blue = this.$el.querySelector('.blue');
    this.$pink = this.$el.querySelector('.pink');
    this.$yellow = this.$el.querySelector('.yellow');

    this.$scores = Array.from(this.$el.querySelectorAll('.score'));
  }

  onResize(viewportWidth, viewportHeight, ...args) {
    super.onResize(viewportWidth, viewportHeight, ...args);

    const hw = viewportWidth / 2;
    const hh = viewportHeight / 2;

    this.$scores.forEach(($score) => {
      $score.style.width = `${hw}px`;
      $score.style.height = `${hh}px`;
      $score.style.lineHeight = `${hh}px`;
    });
  }
}

class IntermezzoRenderer extends Canvas2dRenderer {
  constructor(spriteConfig, score, onExploded) {
    super();

    this.spriteConfig = spriteConfig;
    // this.score = score;
    this.score = score;
    this.onExploded = onExploded;

    this.balloons = [];
  }

  init() {
    const hw = this.canvasWidth / 2;
    const hh = this.canvasHeight / 2;
    const size = Math.min(hw, hh);
    const config = this.spriteConfig;
    const padding = 10; //
    const maxSize = size - padding;
    const minSize = maxSize * config.minSizeScoreRatio;
    let maxScore = -Infinity;
    let minScore = +Infinity;

    for (let key in this.score) {
      if (this.score[key] > maxScore)
        maxScore = this.score[key];

      if (this.score[key] < minScore)
        minScore = this.score[key];
    }

    // initialize the balloons
    scoreOrder.forEach((color, index) => {
      const score = this.score[color];
      const normScore = (maxScore - minScore) === 0 ?
        0 : (score - minScore) / (maxScore - minScore);

      const image = config.groups[color].image;
      const clipPositions = config.groups[color].clipPositions;
      const clipWidth = config.clipSize.width;
      const clipHeight = config.clipSize.height;
      const refreshRate = config.animationRate;

      const size = (maxSize - minSize) * normScore + minSize;
      const x = hw / 2 + hw * (index % 2);
      const y = hh / 2 + hh * Math.floor(index / 2);

      const balloon = new Balloon(color, image, clipPositions, clipWidth, clipHeight, refreshRate, size, size, x, y);

      balloon.opacity = 0;

      this.balloons.push(balloon);
    });
  }

  explode() {
    this.balloons.forEach((balloon) => balloon.explode = true);
  }

  onResize(width, height, orientation) {
    super.onResize(width, height, orientation);

    const hw = width / 2;
    const hh = height / 2;

    this.balloons.forEach((balloon, index) => {
      balloon.x = hw / 2 + hw * (index % 2);
      balloon.y = hh / 2 + hh * Math.floor(index / 2);
    });
  }

  update(dt) {
    this.balloons.forEach((balloon) => {
      if (balloon.opacity < 1)
        balloon.opacity = Math.min(1, balloon.opacity += 0.02);

      balloon.update(dt)
    });

    let animationEnded = true;

    this.balloons.forEach((balloon) => {
      if (!balloon.isDead)
        animationEnded = false;
    });

    if (animationEnded === true)
      this.onExploded();
  }

  render(ctx) {
    this.balloons.forEach((balloon) => balloon.render(ctx));
  }
}

class IntermezzoState {
  constructor(experience, globalState) {
    this.experience = experience;
    this.globalState = globalState;

    this._onExploded = this._onExploded.bind(this);

    this.renderer = new IntermezzoRenderer(this.experience.spriteConfig, globalState.score, this._onExploded);
  }

  enter() {
    const displayedScore = { red: 0, blue: 0, pink: 0, yellow: 0 };
    const score = this.globalState.score;

    this.view = new IntermezzoView(template, {
      showScoreNumbers: true,
      score: displayedScore,
    }, {}, {
      className: ['intermezzo-state', 'foreground'],
      ratios: { '.score-wrapper': 1 },
    });

    this.view.render();
    this.view.show();
    this.view.appendTo(this.experience.view.getStateContainer());

    this.view.setPreRender((ctx, dt, width, height) => {
      ctx.clearRect(0, 0, width, height);
      // abuse preRender to animate score numbers
      let updated = false;
      // increment displayed scores
      for (let color in displayedScore) {
        if (displayedScore[color] < score[color]) {
          displayedScore[color] += 1;
          updated = true;
        }

        if (displayedScore[color] > score[color]) {
          displayedScore[color] -= 1;
          updated = true;
        }
      }

      if (updated === true)
        this.view.render('.score-wrapper');
    });

    this.view.addRenderer(this.renderer);
  }

  exit() {
    this.view.$el.classList.remove('foreground');
    this.view.$el.classList.add('background');

    this.view.model.showScoreNumbers = false;
    this.view.render('.score-wrapper');

    this.renderer.explode();
  }

  _onExploded() {
    this.view.removeRenderer(this.renderer);
    this.view.remove();
  }
}

export default IntermezzoState;
