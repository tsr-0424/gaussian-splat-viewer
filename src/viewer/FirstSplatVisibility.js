// Bounded, startup-only framebuffer evidence. No full-frame image allocation,
// no additional scene render, and no probe after visibility is established.
export class FirstSplatVisibility {
 constructor(){this.baseline=null;this.attempts=0;this.pixels=new Uint8Array(16*16*4);}
 check(renderer,candidate){
  const gl=renderer.getContext();if(gl.isContextLost())return {state:'unavailable',reason:'WebGL context lost'};
  const width=gl.drawingBufferWidth,height=gl.drawingBufferHeight;
  if(width<16||height<16)return {state:'unavailable',reason:'Framebuffer too small'};
  if(!candidate&&this.baseline)return {state:'pending'};
  const points=[[.5,.5],[.3,.5],[.7,.5],[.5,.3],[.5,.7]];
  const point=candidate?points[this.attempts]:points[0];if(!point)return {state:'unavailable',reason:'No non-background pixels in five sample tiles; visibility unconfirmed'};
  try{gl.readPixels(Math.floor((width-16)*point[0]),Math.floor((height-16)*point[1]),16,16,gl.RGBA,gl.UNSIGNED_BYTE,this.pixels);}
  catch{return {state:'unavailable',reason:'Framebuffer readback unavailable'};}
  if(!candidate){this.baseline=[...this.pixels.slice(0,3)];return {state:'pending'};}
  if(!this.baseline)return {state:'unavailable',reason:'Missing pre-model background sample'};
  this.attempts++;
  for(let i=0;i<this.pixels.length;i+=4)if(this.pixels[i+3]>0&&this.baseline.some((channel,j)=>Math.abs(channel-this.pixels[i+j])>3))return {state:'visible'};
  return this.attempts===points.length?{state:'unavailable',reason:'No non-background pixels in five sample tiles; visibility unconfirmed'}:{state:'pending'};
 }
}
