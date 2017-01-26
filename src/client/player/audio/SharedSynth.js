import { audio } from 'soundworks/client';
import SampleSynth from './SampleSynth';

const audioContext = audio.audioContext;

class SharedSynth {
  constructor(config, buffers, groupFilter, output) {
    this.groupFilter = groupFilter; // zone filter service
    this.output = output;

    this.pitchConfigMap = new Map();
    this.configSynthMap = new Map();
    this.activeConfigs = new Set();

    this._currentSynth = null;
    this._currentConfig = null;

    config.forEach((conf, index) => {
      conf.buffer = buffers[index];

      const pitch = conf.midiKey;
      const synth = new SampleSynth(conf);
      synth.connect(this.output);

      this.pitchConfigMap.set(pitch, conf);
      this.configSynthMap.set(conf, synth);
    });

    this.updateGroup = this.updateGroup.bind(this);
  }

  updateGroup(group) {
    if (this._currentConfig && this._currentConfig.group !== 'all')
      this._stop();
    else if (this._currentConfig && this._currentConfig.group === 'all')
      return this._currentConfig;

    for (let config of this.activeConfigs) {
      if (config.group === group ||  config.group === 'all') {
        this._start(config);
        return config;
      }
    }

    return null;
  }

  noteOn(pitch) {
    const config = this.pitchConfigMap.get(pitch);

    if (config) {
      this.activeConfigs.add(config);

      if (this.groupFilter.test(config.group) || config.group === 'all') {
        this._stop();
        this._start(config);
        return config;
      }
    }

    return null;
  }

  noteOff(pitch) {
    const config = this.pitchConfigMap.get(pitch);

    if (config) {
      this.activeConfigs.delete(config);
      this._stop();
      return config;
    }

    return null;
  }

  _start(config) {
    const synth = this.configSynthMap.get(config);
    synth.start(audioContext.currentTime);

    this._currentSynth = synth;
    this._currentConfig = config;
  }

  _stop() {
    if (this._currentSynth !== null) {
      this._currentSynth.stop(audioContext.currentTime);
      this._currentSynth = null;
      this._currentConfig = null;
    }
  }
}

export default SharedSynth;
