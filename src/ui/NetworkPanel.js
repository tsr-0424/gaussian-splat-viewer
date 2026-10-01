export class NetworkPanel {
  constructor(parent) {
    this.element=document.createElement('section');
    this.element.innerHTML='<h3>Network diagnostics · V0.3</h3><pre></pre><p>解碼與下載可重疊；解碼收尾不代表完整 CPU 解碼時間。首幀表示 splats 排序後已提交渲染，非 GPU/compositor 計時。</p>';
    parent.append(this.element);
  }
  update(s) {
    if(this.element.closest('[hidden]'))return;
    const ms=value=>value===null?'…':`${value.toFixed(1)} ms`;
    this.element.querySelector('pre').textContent=[
      `網址開啟 → 開始 fetch: ${ms(s.requestStartMs)}`,`Response headers latency: ${ms(s.headerLatencyMs)}`,
      `網址開啟 → 首個 body chunk: ${ms(s.firstByteMs)}`,`Bytes consumed: ${s.bytes===null?'…':s.bytes.toLocaleString()}`,
      `Body download / consumption: ${ms(s.downloadMs)}`,
      `Average throughput: ${s.throughputMiBs===null?'…':`${s.throughputMiBs.toFixed(2)} MiB/s`}`,
      `Download → decode/init finish: ${ms(s.decodeTailMs)}`,`First byte → decode/init finish: ${ms(s.downloadDecodeMs)}`,
      `網址開啟 → 首個 GS rendered frame: ${ms(s.firstRenderedFrameMs)}`,
      `HTTP: ${s.status??'…'} / Content-Length: ${s.contentLength??'Unavailable'}`,
      `Accept-Ranges: ${s.acceptRanges??'Unavailable'}`,`Cache-Control: ${s.cacheControl??'Unavailable'}`,
    ].join('\n');this.element.dataset.metrics=JSON.stringify(s);
  }
}
