import { audio } from 'soundworks/client';

const audioContext = audio.audioContext;

function startSource(time, buffer, offset, output) {
  const src = audioContext.createBufferSource();

  src.connect(output);
  src.buffer = buffer;
  src.start(time, offset);

  return src;
}

function stopSource(src, time) {
  src.stop(time);
}

function setSourceLoop(src, start, end) {
  src.loop = true;
  src.loopStart = start;
  src.loopEnd = end;
}

function resetSourceLoop(src) {
  src.loop = false;
}

function startEnvelope(time, attack, output) {
  const env = audioContext.createGain();
  env.connect(output);
  env.gain.value = 0;
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(1, time + attack);

  return env;
}

// the synth make sure that stop is never fired before the attack is ended
function stopEnvelope(env, time, release, cancelScheduledValues = false) {
  const endTime = time + release;

  if (cancelScheduledValues) {
    env.gain.cancelScheduledValues(time);
    env.gain.setValueAtTime(env.gain.value, time);
  } else {
    env.gain.setValueAtTime(1, time);
  }

  env.gain.linearRampToValueAtTime(0, endTime);

  return endTime;
}

function sanitize(value, defaultValue) {
  return value === undefined ? defaultValue : value;
}

const min = Math.min;
const max = Math.max;
const random = Math.random;

class SampleSynth {
  constructor(options) {
    this.buffer = options.buffer;

    if (!this.buffer)
      throw new Error('Undefined buffer');

    this.sustained = sanitize(options.sustained, false);

    // offset / attack / release
    this.offset = sanitize(options.offset, 0);
    this.offsetVar = sanitize(options.offsetVar, 0);
    this.attack = sanitize(options.attack, 0);
    this.release = sanitize(options.release, 0);

    // loop parameters
    this.loopStart = sanitize(options.loopStart, 0);
    this.loopEnd = sanitize(options.loopEnd, this.buffer.duration);
    this.loopStartVar = sanitize(options.loopStartVar, 0);
    this.loopEndVar = sanitize(options.loopEndVar, 0);

    this._output = audioContext.createGain();
    this._output.gain.value = sanitize(options.gain, 1);
    this._output.gain.setValueAtTime(sanitize(options.gain, 1), audioContext.currentTime);

    this._src = null;
    this._env = null;
    this._startTime = null;
    this._position = null;
  }

  set gain(value) {
    this._output.gain.setValueAtTime(value, audioContext.currentTime);
  }

  connect(node) {
    this._output.connect(node);
  }

  start(time) {
    if (this._src !== null)
      this.stop(time);

    const buffer = this.buffer;
    const duration = buffer.duration;
    let env = null;
    let src = null;

    let offset = this.offset + this.offsetVar * random() - this.offsetVar * 0.5;
    offset = max(0, min(duration, offset));

    if (!this.sustained) {
      // make sure the release is not triggered before the attack ends
      const attack = min(duration - offset, this.attack);
      const releasePosition = max(offset + attack, duration - this.release);
      const release = duration - releasePosition;
      // console.log('attack:', attack, 'release:', release, 'releasePosition:', releasePosition);
      // attack
      env = startEnvelope(time, attack, this._output);
      src = startSource(time, buffer, offset, env);
      // release
      const endTime = stopEnvelope(env, time + releasePosition, release);
      stopSource(src, endTime);
    } else {
      const start = this.loopStart + this.loopStartVar * random() - this.loopStartVar * 0.5;
      const end = this.loopEnd + this.loopEndVar * random() - this.loopEndVar * 0.5;
      const clampedStart = max(0, start);
      const clampedEnd = min(duration, end);
      const lower = min(clampedStart, clampedEnd);
      const upper = max(clampedStart, clampedEnd);
      // offset cannot be larger than loopStop (is done natively by webAudio but
      // we need to track the right value to properly compute the release)
      offset = min(offset, upper);
      // console.log('loopStart:', lower, 'loopEnd:', upper);
      env = startEnvelope(time, this.attack, this._output);
      src = startSource(time, buffer, offset, env);
      setSourceLoop(src, lower, upper);

      this._src = src;
      this._env = env;
    }

    this._startTime = time;
    this._position = offset;
  }

  stop(time) {
    if (!this.sustained || !this._src)
      return;

    const src = this._src;
    const env = this._env;
    const duration = this.buffer.duration;
    const loopStart = src.loopStart;
    const loopEnd = src.loopEnd === 0 ? duration : src.loopEnd;

    const dt = time - this._startTime;
    // current position in buffer according to the initial offset
    let position = this._position + dt;
    // process the position according to the loop boundaries
    if (position > loopStart)
      position = loopStart + (position - loopStart) % (loopEnd - loopStart);

    // if attack is not finished yet, we must cancel the scheduled values
    let cancelScheduledValues = (dt < this.attack) ? true : false;
    const release = min(duration - position, this.release);

    // stop source
    resetSourceLoop(src);
    const endTime = stopEnvelope(env, time, release, cancelScheduledValues);
    stopSource(src, endTime);

    this._src = null;
    this._env = null;
  }
}

export default SampleSynth;
