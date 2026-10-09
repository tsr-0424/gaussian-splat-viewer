// Camera poses are separate from the original Gaussian data.
export function validCameraView(view) {
  if (!view || !['position', 'target'].every(key =>
    Array.isArray(view[key]) && view[key].length === 3 &&
    view[key].every(value => Number.isFinite(value) && Math.abs(value) <= 1e8))) return false;
  return Math.hypot(...view.position.map((value, index) => value - view.target[index])) > 1e-6;
}
export function cameraViewFromUrl(href) {
  try {
    const url = new URL(href);
    if (url.searchParams.has('viewFor') && url.searchParams.get('viewFor') !== url.hash) return null;
    const raw = url.searchParams.get('view');
    if (!raw || raw.length > 300) return null;
    const parts = raw.split(',');
    if (parts.length !== 6 || parts.some(part => !part.trim())) return null;
    const values = parts.map(Number);
    const view = {position: values.slice(0, 3), target: values.slice(3)};
    return validCameraView(view) ? view : null;
  } catch { return null; }
}
export function withCameraView(href, view) {
  const url = new URL(href);
  if (validCameraView(view)) {
    url.searchParams.set('view', [...view.position, ...view.target].join(','));
    url.searchParams.set('viewFor', url.hash);
  }
  return url.href;
}
