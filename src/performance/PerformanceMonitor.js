export class PerformanceMonitor {
  constructor(windowMs = 2000) {
    this.windowMs = windowMs;
    this.times = new Float64Array(1024);
    this.durations = new Float64Array(1024);
    this.reset();
  }
  reset() { this.head = 0; this.count = 0; this.sum = 0; this.last = null; }
  tick(now) {
    if (this.last === null) { this.last = now; return null; }
    const delta = now - this.last; this.last = now;
    if (delta <= 0 || delta > 1000) { this.reset(); this.last = now; return null; }
    while (this.count && now - this.times[this.head] > this.windowMs) this.removeOldest();
    if (this.count === this.times.length) this.removeOldest();
    const index = (this.head + this.count) % this.times.length;
    this.times[index] = now; this.durations[index] = delta; this.count++; this.sum += delta;
    return delta;
  }
  removeOldest() { this.sum -= this.durations[this.head]; this.head = (this.head + 1) % this.times.length; this.count--; }
  snapshot() {
    const frameMs = this.count ? this.sum / this.count : null;
    return { fps: frameMs ? 1000 / frameMs : null, frameMs, samples: this.count, durationMs: this.sum };
  }
}
