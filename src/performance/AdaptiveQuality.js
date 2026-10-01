const LEVELS = ['LOW', 'MEDIUM', 'HIGH'];
export class AdaptiveQuality {
  constructor({ quality = 'MEDIUM', maxQuality = 'HIGH', onChange }) {
    this.quality = quality; this.maxQuality = maxQuality; this.onChange = onChange;
    this.mode = 'AUTO'; this.reset(0);
  }
  reset(now) { this.lowSince = null; this.highSince = null; this.nextChange = now + 12000; }
  setMode(mode, now) {
    if (mode !== 'AUTO' && !LEVELS.includes(mode)) throw new Error('Invalid quality mode');
    this.mode = mode;
    if (mode !== 'AUTO') this.change(mode, now);
    this.reset(now);
  }
  change(quality, now) {
    quality = LEVELS[Math.min(LEVELS.indexOf(quality), LEVELS.indexOf(this.maxQuality))];
    if (quality !== this.quality) { this.quality = quality; this.onChange(quality); }
    this.reset(now);
  }
  update(stats, now) {
    if (this.mode !== 'AUTO' || stats.samples < 5 || stats.durationMs < 1000) return;
    if (now < this.nextChange) { this.lowSince = this.highSince = null; return; }
    if (stats.frameMs > 1000 / 28) {
      this.lowSince ??= now; this.highSince = null;
      if (now - this.lowSince >= 4000) this.change(LEVELS[Math.max(0, LEVELS.indexOf(this.quality) - 1)], now);
    } else if (stats.frameMs < 1000 / 55) {
      this.highSince ??= now; this.lowSince = null;
      if (now - this.highSince >= 10000) this.change(LEVELS[Math.min(2, LEVELS.indexOf(this.quality) + 1)], now);
    } else { this.lowSince = this.highSince = null; }
  }
}
