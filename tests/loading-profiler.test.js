import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectResourceTiming,LoadingProfiler,benchmarkReport} from '../src/performance/LoadingProfiler.js';
import {FirstSplatVisibility} from '../src/viewer/FirstSplatVisibility.js';
test('resource timing distinguishes compressed bytes, HTTP transfer and local cache without guessing cross-origin cache',()=>{
 const entry={requestStart:100,responseStart:110,responseEnd:1920,transferSize:25100300,encodedBodySize:25100000,decodedBodySize:98221187};
 const timing=inspectResourceTiming(entry,{sameOrigin:true});assert.equal(timing.networkMs,1820);assert.equal(timing.encodedBytes,25100000);assert.equal(timing.decodedBytes,98221187);
 assert.equal(inspectResourceTiming({...entry,transferSize:0},{sameOrigin:true}).cache,'local cache');
 const restricted=inspectResourceTiming({...entry,requestStart:0,responseStart:0,transferSize:0,decodedBodySize:0});assert.equal(restricted.transferBytes,null);assert.equal(restricted.cache,'unavailable');
 assert.match(inspectResourceTiming({...entry,transferSize:0},{sameOrigin:true,serviceWorker:true}).cache,/unavailable/);
});
test('loading phases preserve overlapping Spark load; unavailable parse/GPU/decompression remain null',()=>{
 const profiler=new LoadingProfiler({observerClass:null,performanceApi:null,origin:'https://viewer.example.com'});
 for(const [phase,at] of [['page-initialized',100],['viewer-open',5000],['request',5100],['headers',5200],['spark-start',5201],['download-complete',7000],['decoded',7400],['scene-init-start',7401],['scene-init-end',7410],['first-render',5150],['rendered',7500],['visible',7515],['ready',7520]])profiler.record({phase,at});
 const result=profiler.snapshot();assert.equal(result.sparkLoadMs,2199);assert.equal(result.sparkTailMs,400);assert.equal(result.sceneInitMs,9);assert.equal(result.openToReadyMs,2520);assert.equal(result.readyMs,7520);
 assert.equal(result.parseMs,null);assert.equal(result.decompressionMs,null);assert.equal(result.gpuInitializationMs,null);
});
test('resource observer ignores previous requests of the same model and post-load FPS requires a complete visible window',()=>{
 const profiler=new LoadingProfiler({observerClass:null,performanceApi:null,origin:'https://viewer.example.com'});profiler.record({phase:'request',at:1000,url:'https://viewer.example.com/model.ply'});
 profiler.acceptResource({name:profiler.url,startTime:100,responseEnd:900,decodedBodySize:100});assert.equal(profiler.snapshot().decodedBytes,null);
 profiler.recordFrame(20,'HIGH');assert.equal(profiler.frames,0);profiler.record({phase:'ready',at:2000});
 for(let i=0;i<499;i++)profiler.recordFrame(20,'HIGH');assert.equal(profiler.snapshot().averageFps,null);
 profiler.recordFrame(20,'HIGH');assert.equal(profiler.snapshot().averageFps,50);
 const interrupted=new LoadingProfiler({observerClass:null});interrupted.record({phase:'ready',at:10});interrupted.record({phase:'hidden',at:20});interrupted.recordFrame(20,'HIGH');assert.equal(interrupted.snapshot().fpsStatus,'interrupted');
});
test('visibility requires real non-background sampled pixels and probes stop after a bounded failure',()=>{
 let visible=false,calls=0;const gl={drawingBufferWidth:100,drawingBufferHeight:100,isContextLost:()=>false,RGBA:0x1908,UNSIGNED_BYTE:0x1401,readPixels(x,y,w,h,format,type,pixels){calls++;for(let i=0;i<pixels.length;i+=4){pixels[i]=visible?180:16;pixels[i+1]=21;pixels[i+2]=28;pixels[i+3]=255;}}};
 const renderer={getContext:()=>gl},probe=new FirstSplatVisibility();assert.equal(probe.check(renderer,false).state,'pending');assert.equal(probe.check(renderer,true).state,'pending');visible=true;assert.equal(probe.check(renderer,true).state,'visible');
 visible=false;const blank=new FirstSplatVisibility();blank.check(renderer,false);for(let i=0;i<4;i++)assert.equal(blank.check(renderer,true).state,'pending');assert.equal(blank.check(renderer,true).state,'unavailable');
});
test('benchmark text labels uncertain metrics and separates navigation time from viewer activation',()=>{
 const profile=new LoadingProfiler({observerClass:null}).snapshot();const report=benchmarkReport({profile,stats:{gpu:'unknown',quality:'HIGH',splats:396047},model:{projectTitle:'新福里',title:'主掃描',id:'main',format:'ply'},mode:'AUTO'});
 assert.match(report,/Decompression: unavailable/);assert.match(report,/PLY \/ format parse alone: unavailable/);assert.match(report,/includes gallery dwell/);assert.match(report,/Gaussian count: 396047/);
});
