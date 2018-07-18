import { Canvas2dRenderer } from 'soundworks/client';

class SharedVisuals extends Canvas2dRenderer {
  constructor(groupConfig) {
    super();

    this.groupConfig = groupConfig;
    this._glitch = null;
  }

  trigger(group, sustained, duration) {
    const color = (group === 'all') ? '#ffffff' : this.groupConfig[group].hex;

    this._glitch = {
      group: group,
      color: color,
      ttl: sustained ? +Infinity : duration,
      sustained: sustained,
    };
  }

  stop(group) {
    if (this._glitch && this._glitch.group === group && this._glitch.sustained === true)
      this._glitch = null;
  }

  kill() {
    this._glitch = null;
  }

  update(dt) {
    if (this._glitch) {
      this._glitch.ttl -= dt;

      if (this._glitch.ttl < 0)
        this._glitch = null;
    }
  }

  render(ctx) {
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    if (this._glitch) {
      ctx.save();
      ctx.globalAlpha = Math.random();
      ctx.fillStyle = this._glitch.color;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }
}

export default SharedVisuals;
