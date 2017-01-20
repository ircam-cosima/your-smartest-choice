
class Balloon {
  constructor(color, spriteImage, clipPositions, clipWidth, clipHeight, refreshRate, width, height, x, y, zIndex = 0) {
    this.color = color;
    this.spriteImage = spriteImage;
    this.clipPositions = clipPositions;
    this.nbrClips = clipPositions.length;
    this.refreshRate = refreshRate;
    this.clipWidth = clipWidth;
    this.clipHeight = clipHeight;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.zIndex = zIndex;
    this.radius = width / 2 - 4;

    this.counter = 0;
    this.clipIndex = 0;

    this.explode = false;
    this.isDead = false;
    this.opacity = 1;

    this.rotation = Math.random() * 2 * Math.PI;
    this.rotationDirection = Math.random() < 0.5 ? -1 : 1;
    this.rotationVelocity = Math.random() * Math.PI / 10; // 2 / S

    this.debugHitZone = false;

    // move this in a mixin
    // this.vy = - (Math.random() * 0.4 + 0.6) * 200;
  }

  update(dt) {
    // move all this in a mixin
    // this.vy *= 1.002;
    // this.x += Math.random() * 0.2 - 0.1;
    // this.y += (this.vy * dt);
    // end move

    // probably keep rotation generic
    this.rotation += (this.rotationDirection * this.rotationVelocity * dt);

    if (this.explode === true) {
      this.counter += 1;

      if (this.counter >= this.refreshRate) {
        this.counter = 0;
        this.clipIndex = (this.clipIndex + 1) % this.nbrClips;

        // reset once exploded
        if (this.clipIndex === 0)
          this.isDead = true;
      }
    };
  }

  render(ctx) {
    if (this.isDead)
      return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = this.opacity;

    const position = this.clipPositions[this.clipIndex];
    const sx = position[0];
    const sy = position[1];
    const sw = this.clipWidth;
    const sh = this.clipHeight;
    const tx = -this.width / 2;
    const ty = -this.height / 2;
    const tw = this.width;
    const th = this.height;

    ctx.drawImage(this.spriteImage, sx, sy, sw, sh, tx, ty, tw, th);

    // test hit zone
    if (this.debugHitZone) {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(23, 23, 23, 0.2)';
      ctx.arc(0, 0, this.radius, 0, 2 * Math.PI, false);
      ctx.fill();
      ctx.closePath();
    }

    ctx.restore();
  }
}

export default Balloon;
