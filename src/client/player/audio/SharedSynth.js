import { audio } from 'soundworks/client';
import SampleSynth from './SampleSynth';

const audioContext = audio.audioContext;

class SharedSynth {
  constructor(config, buffers, groupFilter) {
    this.groupFilter = groupFilter; // zone filter service
    this.config = new Map();
    this.pitchSynthMap = new Map();

    this.output = audioContext.createGain();
    this.output.connect(audioContext.destination);
    this.output.gain.value = 1;

    config.forEach((conf, index) => {
      conf.buffer = buffers[index];

      const pitch = conf.midiKey;
      const synth = new SampleSynth(conf);
      synth.connect(this.output);

      this.pitchSynthMap.set(pitch, synth);
      this.config.set(pitch, conf);
    });
  }

  trigger(pitch) {
    const config = this.config.get(pitch);

    if (config) {
      const group = config.group;

      if (this.groupFilter.test(group) || group === 'all') {
        const synth = this.pitchSynthMap.get(pitch);
        synth.start(audioContext.currentTime);
      }
    }
  }

  stop(pitch) {
    const synth = this.pitchSynthMap.get(pitch);

    if (synth)
      synth.stop(audioContext.currentTime);
  }
}

export default SharedSynth;
