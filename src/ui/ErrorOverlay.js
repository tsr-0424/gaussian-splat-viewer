const MESSAGES = {
  MODEL_CONFIG: '模型設定尚未完成或無法讀取，請確認 models.json 與公開模型網址。',
  MODEL_NOT_FOUND: '找不到模型，請確認模型檔案位置。',
  DOWNLOAD_FAILED: '模型下載失敗，請檢查網路與模型網址。',
  INVALID_MODEL: '模型格式不支援或檔案損壞，請使用有效的 Gaussian Splat 檔案。',
  WEBGL_UNSUPPORTED: '此瀏覽器不支援 WebGL2，無法顯示 Gaussian Splat。請使用支援 WebGL2 的瀏覽器。',
  CONTEXT_LOST: '圖形裝置連線中斷，請重新整理頁面。',
};
export class ErrorOverlay {
  constructor() {
    this.element = document.createElement('div'); this.element.className = 'overlay-card'; this.element.hidden = true;
    this.element.setAttribute('role','alert'); document.body.append(this.element);
  }
  show(error) {
    if (import.meta.env.DEV) console.error(error);
    this.element.replaceChildren();
    const text = document.createElement('p'); text.textContent = MESSAGES[error.code] || '無法顯示模型，請重新整理後再試。';
    const button = document.createElement('button'); button.textContent = '重新整理'; button.onclick = () => location.reload();
    this.element.append(text,button); this.element.hidden = false;
  }
  softwareWarning(onLow) {
    this.element.replaceChildren();
    const text = document.createElement('p'); text.textContent = '目前瀏覽器似乎沒有啟用圖形硬體加速，3D 模型可能無法流暢顯示。';
    const low = document.createElement('button'); low.textContent = '低畫質模式';
    low.onclick = () => { this.element.hidden = true; onLow(); };
    const retry = document.createElement('button'); retry.textContent = '重新檢測'; retry.onclick = () => location.reload();
    this.element.append(text,low,retry); this.element.hidden = false;
  }
  dispose() { this.element.remove(); }
}
