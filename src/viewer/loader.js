import { SplatMesh } from '@sparkjsdev/spark';
import { asViewerError } from './errors.js';
export async function loadGaussian(config, onProgress, signal, onNetwork) {
  // Fetch directly to distinguish HTTP / network errors without allocating a second file buffer.
  let response;
  const emit=(phase,details={})=>onNetwork?.({phase,at:performance.now(),...details});
  emit('request');
  try { response = await fetch(config.url, { signal, headers: { Accept: 'application/octet-stream' } }); }
  catch(error) {throw asViewerError(error,'DOWNLOAD_FAILED');}
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.code = response.status === 404 ? 'MODEL_NOT_FOUND' : 'DOWNLOAD_FAILED'; throw error;
  }
  if (!response.body) throw Object.assign(new Error('ReadableStream unavailable'), { code: 'DOWNLOAD_FAILED' });
  emit('headers',{status:response.status,contentLength:response.headers.get('content-length'),acceptRanges:response.headers.get('accept-ranges'),cacheControl:response.headers.get('cache-control')});
  const encoding=response.headers.get('content-encoding');
  const total = !encoding||encoding==='identity' ? Number(response.headers.get('content-length')) || 0 : 0;
  onProgress({ phase: 'download', percent: total ? 0 : null });
  let bytes=0,lastProgress=0;
  const reader=response.body.getReader();
  const stream=new ReadableStream({
    async pull(controller){
      try {
        const {done,value}=await reader.read();
        if(done){emit('download-complete',{bytes});onProgress({phase:'decode',percent:null});reader.releaseLock();controller.close();return;}
        if(bytes===0)emit('first-byte');bytes+=value.byteLength;
        const now=performance.now();
        if(now-lastProgress>100){onProgress({phase:'download',percent:total&&bytes<=total?Math.floor(bytes/total*100):null});lastProgress=now;}
        controller.enqueue(value);
      }catch(error){controller.error(asViewerError(error,'DOWNLOAD_FAILED'));}
    },cancel(reason){return reader.cancel(reason);},
  });
  const mesh = new SplatMesh({ stream, streamLength: total || undefined,
    fileName: decodeURIComponent(new URL(config.url, location.href).pathname.split('/').pop()),
  });
  mesh.rotation.set(...config.rotation);
  try {
    await mesh.initialized;
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (!mesh.numSplats) throw new Error('No Gaussian splats');
    emit('decoded');
    return mesh;
  } catch (error) { mesh.dispose(); throw asViewerError(error,'INVALID_MODEL'); }
}
