import { Renderer } from 'soundworks/client';


const { random, floor, ceil, min, max } = Math;

// randomize an array (which is funny with white noise)
function randomize(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const target = floor(random() * i);
    const s = arr[i];
    arr[i] = arr[target];
    arr[target] = s;
  }
}

const FRAME_DURATION = 0.016; // ± the duration of a frame

// class Glitch extends Renderer {
class Glitch {
  constructor() {
    this.bufferSize = ceil(1 / FRAME_DURATION);
    this.noiseBuffer = new Array(this.bufferSize);

    for (let i = 0; i < this.bufferSize; i++)
      this.noiseBuffer[i] = random();


    this.target = null;
    this.pointer = null;
    this.color = null;
  }

  trigger(color, duration) {
    this.target = min(ceil(duration / FRAME_DURATION), this.bufferSize);
    this.pointer = -1;
    this.color = color;

    randomize(this.noiseBuffer);
  }

  update(dt) {
    this.pointer += 1;

    if (this.pointer >= this.target) {
      this.target = null;
      this.pointer = null;
      this.color = null;
    }
  }

  render(ctx) {
    if (this.pointer !== null) {
      ctx.save();
      ctx.globalAlpha = this.noiseBuffer[this.pointer];
      ctx.fillStyle = this.color;
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      ctx.restore();
    }
  }
}

export default Glitch;
