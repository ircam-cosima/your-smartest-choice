import * as soundworks from 'soundworks/client';
import SharedSynth from './audio/SharedSynth';
import SharedVisuals from './renderers/SharedVisuals';

// config
import spriteConfig from '../../../data/sprite-config.json';
import sharedVisualsConfig from '../../../data/shared-visuals-config.json';
import sharedSynthConfig from '../../../data/shared-synth-config.json';
import areaConfig from '../../../data/area-config.json';
import killTheBalloonsConfig from '../../../data/kill-the-balloons-config.json';
import avoidTheRainConfig from '../../../data/avoid-the-rain-config.json';

// states
import WaitState from './states/WaitState';
import CompassState from './states/CompassState';
import BalloonsCoverState from './states/BalloonsCoverState';
import KillTheBalloonsState from './states/KillTheBalloonsState';
import IntermezzoState from './states/IntermezzoState';
import AvoidTheRainState from './states/AvoidTheRainState';
import ScoresState from './states/ScoresState';
import EndState from './states/EndState';

const audioContext = soundworks.audioContext;
const client = soundworks.client;

const states = {
  wait: WaitState,
  compass: CompassState,
  balloonsCover: BalloonsCoverState,
  killTheBalloons: KillTheBalloonsState,
  intermezzo: IntermezzoState,
  avoidTheRain: AvoidTheRainState,
  scores: ScoresState,
  end: EndState,
};

const globalState = {
  score: { red: 0, blue: 0, pink: 0, yellow: 0 },
};

const viewTemplate = `
  <canvas class="background"></canvas>
  <div id="shared-visual-container" class="background"></div>
  <div id="state-container" class="foreground"></div>
`;

class PlayerView extends soundworks.CanvasView {
  onRender() {
    super.onRender();

    this.$stateContainer = this.$el.querySelector('#state-container');
    this.$sharedVisualContainer = this.$el.querySelector('#shared-visual-container');
  }

  onResize(width, height, orientation) {
    super.onResize(width, height, orientation);

    this.$sharedVisualContainer.style.width = `${width}px`;
    this.$sharedVisualContainer.style.height = `${height}px`;
  }

  showSharedVisual(path) {
    const $container = this.$sharedVisualContainer;
    $container.style.backgroundImage = `url(${path})`;
    $container.style.backgroundRepeat = 'no-repeat';
    $container.style.backgroundPosition = '50% 50%';
    $container.style.backgroundSize = 'contain';

    // force re-rendering for iOS
    $container.style.width = '0px';
    const width = `${this.viewportWidth}px`;
    setTimeout(() => $container.style.width = width, 0);
  }

  hideSharedVisual() {
    // if (this.$sharedVisualContainer)
      this.$sharedVisualContainer.style.backgroundImage = '';
  }

  getStateContainer() {
    return this.$stateContainer;
  }
}

class PlayerExperience extends soundworks.Experience {
  constructor(assetsDomain) {
    super();

    // configurations
    this.sharedSynthConfig = sharedSynthConfig;
    this.sharedVisualsConfig = sharedVisualsConfig;
    this.spriteConfig = spriteConfig;
    this.areaConfig = areaConfig;
    this.killTheBalloonsConfig = killTheBalloonsConfig;
    this.avoidTheRainConfig = avoidTheRainConfig;

    // -------------------------------------------
    // prepare paths for audio files
    // -------------------------------------------

    const sharedSynthFiles = sharedSynthConfig.map((entry) => {
      return `sounds/shared-synth/${entry.filename}`;
    });

    const killTheBalloonsFiles = killTheBalloonsConfig.files.map((filename) => {
      return `sounds/kill-the-balloons/${filename}`;
    });

    const avoidTheRainSines = avoidTheRainConfig.sines.map(filename => {
      return `sounds/avoid-the-rain/${filename}`;
    });

    const avoidTheRainGlitches = avoidTheRainConfig.glitches.map(filename => {
      return `sounds/avoid-the-rain/${filename}`;
    });

    // -------------------------------------------

    const audioFiles = {
      'shared-synth': sharedSynthFiles,
      'kill-the-balloons': killTheBalloonsFiles,
      'avoid-the-rain:sines': avoidTheRainSines,
      'avoid-the-rain:glitches': avoidTheRainGlitches,
    };

    // this.platform = this.require('platform', { features: ['web-audio', 'wake-lock'] });
    this.platform = this.require('platform', { features: ['web-audio'] });

    this.checkin = this.require('checkin', { showDialog: false });
    this.audioBufferManager = this.require('audio-buffer-manager', {
      assetsDomain: assetsDomain,
      files: audioFiles,
    });

    this.groupFilter = this.require('group-filter', {
      directions: areaConfig.directions,
    });

    // load here instead of platform
    this.imageManager = this.require('image-manager', {
      files: Object.assign({}, {
        'sprite:blue': this.spriteConfig.groups.blue.file,
        'sprite:pink': this.spriteConfig.groups.pink.file,
        'sprite:yellow': this.spriteConfig.groups.yellow.file,
        'sprite:red': this.spriteConfig.groups.red.file,
      }, this.sharedVisualsConfig),
    });

    this.sharedParams = this.require('shared-params');
    this.sync = this.require('sync');
    this.scheduler = this.require('scheduler');

    this._setState = this._setState.bind(this);
    // this._onAcceleration = this._onAcceleration.bind(this);
    this._onCompassUpdate = this._onCompassUpdate.bind(this);
    this._setVolume = this._setVolume.bind(this);
    this._onSharedVisualTrigger = this._onSharedVisualTrigger.bind(this);

    this._accelerationListeners = new Set();
    this._compassListeners = {};
  }

  init() {
    // populate spriteConfig with the sprite images
    this.spriteConfig.groups.blue.image = this.imageManager.getAsCanvas('sprite:blue');
    this.spriteConfig.groups.pink.image = this.imageManager.getAsCanvas('sprite:pink');
    this.spriteConfig.groups.yellow.image = this.imageManager.getAsCanvas('sprite:yellow');
    this.spriteConfig.groups.red.image = this.imageManager.getAsCanvas('sprite:red');

    this.spriteConfig.groups.blue.halfSizeImage = this.imageManager.getAsHalfSizeCanvas('sprite:blue');
    this.spriteConfig.groups.pink.halfSizeImage = this.imageManager.getAsHalfSizeCanvas('sprite:pink');
    this.spriteConfig.groups.yellow.halfSizeImage = this.imageManager.getAsHalfSizeCanvas('sprite:yellow');
    this.spriteConfig.groups.red.halfSizeImage = this.imageManager.getAsHalfSizeCanvas('sprite:red');

    this.spriteConfig.colors = Object.keys(this.spriteConfig.groups);

    // initialize the view
    this.viewTemplate = viewTemplate;
    this.viewContent = {};
    this.viewCtor = PlayerView;
    this.viewOptions = {
      preservePixelRatio: false,
      ratios: { '#state-container': 1 },
    };
    this.viewEvents = {};
    this.view = this.createView();
  }

  start() {
    super.start();

    if (!this.hasStarted)
      this.init();

    this.show();

    // master audio
    this.master = audioContext.createGain();
    this.master.connect(audioContext.destination);
    this.master.gain.value = 1;

    // global view
    this.view.setPreRender((ctx, dt, width, height) => {
      ctx.clearRect(0, 0, width, height);
    });

    // global synth and visuals (Huihui controlled)
    this.sharedSynth = new SharedSynth(
      this.sharedSynthConfig,
      this.audioBufferManager.get('shared-synth'),
      this.groupFilter,
      this.getAudioDestination()
    );

    this.sharedVisuals = new SharedVisuals(this.spriteConfig.groups);

    this.view.addRenderer(this.sharedVisuals);

    // @todo - revise all this, this is far from really efficient
    this.receive('note:on', (pitch) => {
      const res = this.sharedSynth.noteOn(pitch);

      if (res !== null)
        this.sharedVisuals.trigger(res.group, res.sustained, res.duration);
    });

    this.receive('note:off', (pitch) => {
      const res = this.sharedSynth.noteOff(pitch);

      if (res !== null)
        this.sharedVisuals.stop(res.group);
    });

    this.addCompassListener('group', (group) => {
      const res = this.sharedSynth.updateGroup(group);

      if (res !== null)
        this.sharedVisuals.trigger(res.group, res.sustained, res.duration);
      else
        this.sharedVisuals.kill();
    });

    // state of the application
    this.groupFilter.startListening();
    this.groupFilter.addListener(this._onCompassUpdate);
    this.sharedParams.addParamListener('global:volume', this._setVolume);
    this.sharedParams.addParamListener('global:shared-visual', this._onSharedVisualTrigger);

    this.receive('global:state', (syncTime, state) => {
      this.scheduler.defer(() => this._setState(state), syncTime);
    });
  }

  getAudioDestination() {
    return this.master;
  }

  _setVolume(value) {
    this.master.gain.value = value;
  }

  _setState(name) {
    const ctor = states[name];

    if (!ctor)
      throw new Error(`Invalid state: "${name}"`);

    const state = new ctor(this, globalState, client);

    if (this._state)
      this._state.exit();

    this.hideSharedVisual();
    this._state = state;
    this._state.enter();
    this._currentStateName = name;
  }

  _onSharedVisualTrigger(value) {
    if (value === 'none')
      this.hideSharedVisual();
    else
      this.showSharedVisual(value);
  }

  showSharedVisual(id) {
    const path = this.sharedVisualsConfig[id];
    this.view.showSharedVisual(path);
  }

  hideSharedVisual() {
    this.view.hideSharedVisual();
  }

  addCompassListener(channel, callback) {
    if (!this._compassListeners[channel])
      this._compassListeners[channel] = new Set();

    this._compassListeners[channel].add(callback);
  }

  removeCompassListener(channel, callback) {
    if (this._compassListeners[channel])
      this._compassListeners[channel].delete(callback);
  }

  _onCompassUpdate(channel, ...args) {
    if (this._compassListeners[channel])
      this._compassListeners[channel].forEach(callback => callback(...args));
  }
}

export default PlayerExperience;
