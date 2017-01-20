import * as soundworks from 'soundworks/client';
import PlayerRenderer from './PlayerRenderer';
import SharedSynth from './audio/SharedSynth';

// config
import spriteConfig from '../shared/spriteConfig';
// @todo - this should be loaded instead
import sharedVisualsConfig from '../../../data/shared-visuals-config.json';
import sharedSynthConfig from '../../../data/shared-synth-config.json';
import areaConfig from '../../../data/area-config.json';

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

const viewTemplate = ``;

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

class PlayerExperience extends soundworks.Experience {
  constructor(assetsDomain) {
    super();

    // configurations
    this.sharedSynthConfig = sharedSynthConfig;
    this.sharedVisualsConfig = sharedVisualsConfig;
    this.spriteConfig = spriteConfig;
    this.areaConfig = areaConfig;

    const audioFiles = {
      'shared-synth': sharedSynthConfig.map((entry) => `sounds/shared-synth/${entry.filename}`),
    };

    this.platform = this.require('platform', { features: ['web-audio'] });
    this.checkin = this.require('checkin', { showDialog: false });
    this.audioBufferManager = this.require('audio-buffer-manager', {
      assetsDomain: assetsDomain,
      files: audioFiles,
    });

    this.motionInput = this.require('motion-input', {
      descriptors: ['accelerationIncludingGravity'],
    });

    this.groupFilter = this.require('group-filter', {
      directions: areaConfig.directions,
    });

    // load here instead of platform
    this.imageManager = this.require('image-manager', {
      files: {
        spriteBlue: this.spriteConfig.groups.blue.file,
        spritePink: this.spriteConfig.groups.pink.file,
        spriteYellow: this.spriteConfig.groups.yellow.file,
        spriteRed: this.spriteConfig.groups.red.file,
      },
    });

    this.sharedParams = this.require('shared-params');

    this._setState = this._setState.bind(this);
    this._onAcceleration = this._onAcceleration.bind(this);
    this._onCompassUpdate = this._onCompassUpdate.bind(this);

    this._accelerationListeners = new Set();
    this._compassListeners = new Set();
  }

  init() {
    // populate spriteConfig with the sprite images
    this.spriteConfig.groups.blue.image = this.imageManager.get('spriteBlue');
    this.spriteConfig.groups.pink.image = this.imageManager.get('spritePink');
    this.spriteConfig.groups.yellow.image = this.imageManager.get('spriteYellow');
    this.spriteConfig.groups.red.image = this.imageManager.get('spriteRed');
    this.spriteConfig.colors = Object.keys(this.spriteConfig.groups);

    // initialize the view
    this.viewTemplate = viewTemplate;
    this.viewContent = {};
    this.viewCtor = soundworks.View;
    this.viewOptions = { preservePixelRatio: true };
    this.viewEvents = {};
    this.view = this.createView();
  }

  start() {
    super.start();

    if (!this.hasStarted)
      this.init();

    this.show();

    // global synth and visuals (Huihui controlled)
    const sharedSynthBuffers = this.audioBufferManager.get('shared-synth');
    this.sharedSynth = new SharedSynth(this.sharedSynthConfig, sharedSynthBuffers, this.groupFilter);
    // this.sharedVisuals = new SharedVisuals(config, this.view, this.groupFilter);

    this.receive('note:on', (pitch) => {
      this.sharedSynth.trigger(pitch);
      // this.sharedVisuals.trigger(pitch);
    });

    this.receive('note:off', (pitch) => {
      this.sharedSynth.stop(pitch);
      // this.sharedVisuals.stop(pitch);
    });

    // motion input
    if (this.motionInput.isAvailable('accelerationIncludingGravity'))
      this.motionInput.addListener('accelerationIncludingGravity', this._onAcceleration);
    else
      console.warn('@todo: no acceleration');

    this.groupFilter.addListener(this._onCompassUpdate);
    // state of the application
    this.sharedParams.addParamListener('state', this._setState);
  }

  _setState(name) {
    console.log('%cstate: ' + name, 'color:green');
    const ctor = states[name];

    if (!ctor)
      throw new Error(`Invalid state: "${name}"`);

    const state = new ctor(this, globalState);

    if (this._state)
      this._state.exit();

    this._state = state;
    this._state.enter();
    this._currentStateName = name;
  }

  addAccelerationListener(callback) {
    this._accelerationListeners.add(callback);
  }

  removeAccelerationListener(callback) {
    this._accelerationListeners.delete(callback);
  }

  _onAcceleration(data) {
    console.log(data);
    this._accelerationListeners.forEach(callback => callback(data));
  }

  addCompassListener(callback) {
    this._compassListeners.add(callback);
  }

  removeCompassListener(callback) {
    this._compassListeners.delete(callback);
  }

  _onCompassUpdate(angle, color) {
    this._compassListeners.forEach(callback => callback(angle, color));
  }
}

export default PlayerExperience;
