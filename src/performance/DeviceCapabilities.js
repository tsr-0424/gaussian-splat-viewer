const SOFTWARE = /swiftshader|microsoft basic render driver|microsoft basic display|llvmpipe|softpipe|software rasterizer|software renderer|lavapipe|swrast|\bwarp\b/i;

export function classifyRenderer(name) {
  if (!name || /^(WebKit WebGL|WebGL|unknown)$/i.test(name)) return 'unknown';
  return SOFTWARE.test(name) ? 'software' : 'hardware-likely';
}

// Probe once, then give this same WebGL2 context to Three.js. No per-frame GPU queries.
export function detectDevice() {
  const canvas = document.createElement('canvas');
  const attributes = { antialias: false, alpha: false, powerPreference: 'high-performance' };
  const context = canvas.getContext('webgl2', attributes);
  const legacyCanvas = document.createElement('canvas');
  const legacy = legacyCanvas.getContext('webgl');
  const webgl = Boolean(context || legacy);
  legacy?.getExtension('WEBGL_lose_context')?.loseContext();
  let gpu = 'Unavailable (browser privacy policy)', vendor = 'Unavailable';
  if (context) {
    const debug = context.getExtension('WEBGL_debug_renderer_info');
    if (debug) {
      gpu = context.getParameter(debug.UNMASKED_RENDERER_WEBGL);
      vendor = context.getParameter(debug.UNMASKED_VENDOR_WEBGL);
    }
  }
  const classification = gpu.startsWith('Unavailable') ? 'unknown' : classifyRenderer(gpu);
  return { canvas, context, webgl, webgl2: Boolean(context), gpu, vendor, classification,
    software: classification === 'software',
    webgpu: Boolean(navigator.gpu), // API exposed only; never request a second GPU adapter.
    deviceMemory: navigator.deviceMemory ?? null,
    browser: navigator.userAgent, // Recorded for benchmark only; not used to select quality.
  };
}
