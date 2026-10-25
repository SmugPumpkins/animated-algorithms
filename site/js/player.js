export class Player {
  constructor(length) {
    this.length = length; this.index = 0; this.playing = false;
    this.loop = false; this.speed = 1; this.lastTime = 0;
  }
  seek(index, now) {
    this.index = Math.max(0, Math.min(this.length - 1, Number(index)));
    this.playing = false; this.lastTime = now;
  }
  toggle(now) {
    this.playing = !this.playing;
    if (this.playing && this.index === this.length - 1) this.index = 0;
    this.lastTime = now;
  }
  setSpeed(speed, now) { this.speed = speed; this.lastTime = now; }
  reset(now) { this.index = 0; this.lastTime = now; }
  tick(now) {
    if (!this.playing || now - this.lastTime < 1000 / this.speed) return false;
    this.lastTime = now;
    if (this.index < this.length - 1) this.index++;
    else if (this.loop) this.index = 0;
    else { this.playing = false; return true; }
    if (this.index === this.length - 1 && !this.loop) this.playing = false;
    return true;
  }
}
