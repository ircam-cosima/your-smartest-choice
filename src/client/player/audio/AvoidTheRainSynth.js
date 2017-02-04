import { audio } from 'soundworks/client';
const audioContext = audio.audioContext;
const scheduler = audio.getScheduler();
scheduler.lookahead = 0.5;

class SineEngine extends audio.GranularEngine {
  constructor(parent) {
    super();

    this.parent = parent;
  }

  advanceTime(time) {
    // update pitch
    this.resampling = this.parent.getSineResampling();
    // this.resamplingVar = this.parent.getSineResamplingVar();
    // update position
    const duration = this.durationAbs;
    const halfDuration = duration / 2;
    this.position = halfDuration + (Math.random() * (this.buffer.duration - duration));

    time = Math.max(time, audioContext.currentTime);
    return super.advanceTime(time);
  }
}

class AvoidTheRainSynth {
  constructor(sinesBuffers, glitchBuffers, harmonyConfig, output) {
    this.sinesBuffers = sinesBuffers;
    this.glitchBuffers = Object.values(glitchBuffers);
    this.harmonyConfig = harmonyConfig;
    this.currentHarmony = null;
    this.nextHarmony = null;
    this.output = output;

    this.currentBuffer = null;
    this.currentDetune = null;
    this.resamplingInterval = 100; // 1 tone up, 1 tone down
    this.controlPosition = [0, 0];

    const now = audioContext.currentTime;

    this.sineMaster = audioContext.createGain();
    this.sineMaster.connect(this.output);
    this.sineMaster.gain.value = 1;

    this.env = audioContext.createGain();
    this.env.connect(this.sineMaster);
    this.env.gain.value = 0;
    this.env.gain.setValueAtTime(0, now);

    this.volume = audioContext.createGain();
    this.volume.connect(this.env);
    this.volume.gain.value = 1;

    this.granularEngine = new SineEngine(this);
    this.granularEngine.connect(this.volume);
  }

  setNextHarmony(value) {
    this.nextHarmony = value;
  }

  setSineMaster(value) {
    this.sineMaster.gain.value = value;
  }

  getSineResampling() {
    const resamplingInterval = this.resamplingInterval;
    const normYPosition = this.controlPosition[1];
    const detune = (1 - normYPosition) * resamplingInterval - (resamplingInterval / 2);

    return this.baseSineResampling + detune; // + detune from balloon position
  }

  // triggered each time `this.controlPosition` is updated
  onControlUpdate() {
    const normXPosition = this.controlPosition[0];
    const delta = Math.abs(normXPosition - 0.5);
    const inverseNormDelta = 1 - (delta * 2);
    const scaledDelta = inverseNormDelta * 0.8 + 0.2;
    const gain = scaledDelta * scaledDelta;

    this.volume.gain.value = gain;
  }


  triggerGlitch() {
    const index = Math.floor(Math.random() * this.glitchBuffers.length);
    const buffer = this.glitchBuffers[index];
    const now = audioContext.currentTime;
    const duration = buffer.duration;
    // const detune = (Math.random() * 2 - 1) * 1200;
    const resampling = Math.random() * 1.5 + 0.5;

    const src = audioContext.createBufferSource();
    src.connect(this.output);
    src.buffer = buffer;
    src.playbackRate.value = resampling;
    src.start(now);
    src.stop(now + duration);
  }

  startSine(fadeInDuration) {
    if (this.nextHarmony)
      this.currentHarmony = this.nextHarmony;

    this.nextHarmony = null;

    if (scheduler.has(this.granularEngine))
      scheduler.remove(this.granularEngine);

    const parts = this.currentHarmony.split(':');
    const marker = parts[0];
    const bar = parts[1];

    const config = this.harmonyConfig['sines-score'][marker];
    // 0 is low voice, 1 is high voice - 0.7 probability for low voice
    const voiceIndex = Math.random() < 0.4 ? 0 : 1;
    const voice = config[voiceIndex];
    const buffer = this.sinesBuffers[voice.fileIndex];
    const detunes = voice.detunes[bar];

    this.baseSineResampling = detunes[Math.floor(Math.random() * detunes.length)];
    this.granularEngine.buffer = buffer;
    this.granularEngine.periodRel = 0.5;
    this.granularEngine.durationAbs = 0.8;
    this.granularEngine.positionVar = 0.03;
    this.granularEngine.attackAbs = 0;
    this.granularEngine.attackRel = 0.25;
    this.granularEngine.releaseAbs = 0;
    this.granularEngine.releaseRel = 0.25;
    this.granularEngine.centered = true;
    this.granularEngine.cyclic = false;
    scheduler.add(this.granularEngine);

    const now = audioContext.currentTime;
    this.env.gain.setValueAtTime(0, now);
    this.env.gain.linearRampToValueAtTime(1, now + fadeInDuration);
  }

  stopSine() {
    // shouldn't be necessary (but just in case...)
    if (scheduler.has(this.granularEngine)) {
      scheduler.remove(this.granularEngine);

      const now = audioContext.currentTime;
      this.env.gain.setValueAtTime(1, now);
      this.env.gain.linearRampToValueAtTime(0, now + 0.01)
    }
  }
}

export default AvoidTheRainSynth;
