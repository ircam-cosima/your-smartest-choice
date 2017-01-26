import { audio } from 'soundworks/client';
const audioContext = audio.audioContext;

class KillTheBalloonsSynth {
  constructor(setsConfig, buffers, output) {
    this.setsConfig = setsConfig;
    this.buffers = buffers;
    this.samplesSetIndex = 0;
    this.output = output;
  }

  setSamplesSetIndex(index) {
    this.samplesSetIndex = index;
  }

  trigger(group) {
    const config = this.setsConfig[this.samplesSetIndex][group];
    const buffer = this.buffers[config.fileIndex];
    const min = config.duration[0] / 1000;
    const max = config.duration[1] / 1000;
    const duration = buffer.duration;
    const segmentDuration = Math.min(min + Math.random() * (max - min), duration);
    const offset = Math.random() * (duration - segmentDuration);
    const attack = 0.01;
    const release = Math.min(segmentDuration - attack, 0.9 * segmentDuration);

    const now = audioContext.currentTime;

    const env = audioContext.createGain();
    env.connect(this.output);
    env.gain.value = 0;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(1, now + attack);
    env.gain.setValueAtTime(1, now + segmentDuration - release);
    env.gain.linearRampToValueAtTime(0, now + segmentDuration);

    const src = audioContext.createBufferSource();
    src.connect(env);
    src.buffer = buffer;
    src.start(now, offset);
    src.stop(now + segmentDuration);
  }
}

export default KillTheBalloonsSynth;
