// Starts before importing Three/Spark. Keep the original response stream: no clone,
// second PLY buffer, model mutation, or request retry.
export function beginModelRequest(url, signal) {
 const events=[{phase:'request',at:performance.now(),url}];
 const request={url,events};
 const promise=fetch(url,{signal,headers:{Accept:'application/octet-stream'}}).then(response=>{
  request.headersEvent={phase:'headers',at:performance.now(),status:response.status,contentLength:response.headers?.get('content-length')??null,acceptRanges:response.headers?.get('accept-ranges')??null,cacheControl:response.headers?.get('cache-control')??null};
  return response;
 });
 promise.catch(()=>{}); // Import/navigation can finish later; consume the same rejection.
 request.promise=promise;return request;
}
