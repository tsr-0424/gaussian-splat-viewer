import {shareData} from './share.js';
export class WebActions {
  constructor({normalBase}={}) {
    this.share=document.querySelector('#share');this.fullscreen=document.querySelector('#fullscreen');this.status=document.querySelector('#web-status');
    this.copyField=document.querySelector('#copy-link');
    const data=()=>shareData(document.title,location.href,normalBase);
    this.copy=async()=>{
      try{await navigator.clipboard.writeText(data().url);this.status.textContent='連結已複製';}
      catch{this.copyField.value=data().url;this.copyField.hidden=false;this.copyField.focus();this.copyField.select();this.status.textContent='請複製下方網址';}
    };
    this.onShare=async()=>{
      const payload=data();
      if(navigator.share){
        try{await navigator.share(payload);this.status.textContent='已開啟分享';return;}
        catch(error){if(error.name==='AbortError')return;}
      }
      await this.copy();
    };
    this.onFullscreen=async()=>{
      try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
      catch{this.status.textContent='此瀏覽器目前無法切換全螢幕';}
    };
    this.onFullscreenChange=()=>{this.fullscreen.textContent=document.fullscreenElement?'Exit Fullscreen':'Fullscreen';};
    this.fullscreen.hidden=!document.documentElement.requestFullscreen;
    this.share.textContent=navigator.share?'Share':'Copy Link';
    this.share.addEventListener('click',this.onShare);this.fullscreen.addEventListener('click',this.onFullscreen);
    document.addEventListener('fullscreenchange',this.onFullscreenChange);
  }
  dispose(){this.share.removeEventListener('click',this.onShare);this.fullscreen.removeEventListener('click',this.onFullscreen);document.removeEventListener('fullscreenchange',this.onFullscreenChange);}
}
