// Extension points: add LOD / SH / progressive options here and apply them in Viewer.
// V0.2 changes framebuffer resolution only. No model mutations.
export const PRESETS = Object.freeze({
  HIGH: { dprCap: 2, maxPixels: 4_000_000 },
  MEDIUM: { dprCap: 1.25, maxPixels: 2_000_000 },
  LOW: { dprCap: 0.75, maxPixels: 1_000_000 },
});
export function pixelRatioFor(quality, dpr, width, height) {
  const preset = PRESETS[quality];
  if (!preset) throw new Error(`Unknown quality: ${quality}`);
  const area = Math.max(1, width * height);
  return Math.max(0.1, Math.min(dpr || 1, preset.dprCap, Math.sqrt(preset.maxPixels / area)));
}
export function initialQuality(device, width, height, dpr) {
  if (device.software) return 'LOW';
  const physicalPixels = width * height * Math.min(dpr || 1, 2) ** 2;
  return device.classification === 'unknown' || physicalPixels > 2_000_000 ? 'MEDIUM' : 'HIGH';
}
