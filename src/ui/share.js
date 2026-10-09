import {withCameraView} from '../viewer/cameraView.js';
export function shareData(title,href,normalBase,cameraView){
 const url=new URL(href);if(normalBase)url.pathname=normalBase;
 return {title,url:cameraView?withCameraView(url.href,cameraView):url.href};
}
