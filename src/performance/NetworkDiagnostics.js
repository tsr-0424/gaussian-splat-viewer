export class NetworkDiagnostics {
  constructor() {this.events={};this.bytes=null;}
  record({phase,at,...details}) {this.events[phase]=at;if(details.bytes!==undefined)this.bytes=details.bytes;Object.assign(this,details);}
  snapshot() {
    const e=this.events;
    const interval=(start,end)=>e[start]===undefined||e[end]===undefined?null:e[end]-e[start];
    const downloadMs=interval('headers','download-complete');
    return {requestStartMs:e.request??null,headerLatencyMs:interval('request','headers'),
      firstByteMs:e['first-byte']??null,bytes:this.bytes,downloadMs,
      throughputMiBs:downloadMs>0&&this.bytes!==null?this.bytes/1048576/(downloadMs/1000):null,
      decodeTailMs:interval('download-complete','decoded'),downloadDecodeMs:interval('first-byte','decoded'),
      firstRenderedFrameMs:e.rendered??null,status:this.status??null,contentLength:this.contentLength??null,
      acceptRanges:this.acceptRanges??null,cacheControl:this.cacheControl??null};
  }
}
