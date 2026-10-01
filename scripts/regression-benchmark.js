// Rebuild actual Git snapshots; instrument only isolated fixtures. No production hooks.
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,copyFileSync,existsSync,symlinkSync} from 'node:fs';
import {resolve,dirname,join,sep} from 'node:path';
import {gzipSync} from 'node:zlib';
import {createServer} from 'node:http';
import {build} from 'vite';
const root=process.cwd(),workspace=resolve('verification/regression'),port=5184;
mkdirSync(workspace,{recursive:true});
const variants={A:'309df5e',B:'b23e239',C:null,Boff:'b23e239'};
const analysis={};
for(const [variant,ref] of Object.entries(variants)){
 const directory=join(workspace,variant.replace(/\\/g, '/'));mkdirSync(directory,{recursive:true});
 const names=execFileSync('git',['ls-tree','-rz','--name-only',ref||'HEAD'],{encoding:'utf8'}).split('\0').filter(Boolean);
 if(!ref)names.push('src/viewer/modelRequest.js');
 for(const name of new Set(names)){if(name.startsWith('verification/')||name.startsWith('.git/'))continue;const target=join(directory,name);mkdirSync(dirname(target),{recursive:true});if(ref)writeFileSync(target,execFileSync('git',['show',`${ref}:${name}`],{maxBuffer:16e6}));else if(existsSync(name))copyFileSync(name,target);}
 if(!existsSync(join(directory,'node_modules')))symlinkSync(resolve('node_modules'),join(directory,'node_modules'),'junction');
 const update=(name,fn)=>writeFileSync(join(directory,name),fn(readFileSync(join(directory,name),'utf8')));
 update('src/main.js',source=>`window.__bench.event('main-evaluation');\n${source}`.replace('const openedAt=performance.now();',"window.__bench.event('route-resolved');const openedAt=performance.now();"));
 update('src/viewer/GaussianViewer.js',source=>source.replace('this.callbacks = callbacks;',"window.__bench.event('viewer-constructor');this.callbacks = callbacks;").replace('this.firstFrameReady=true;',"this.firstFrameReady=true;window.__bench.first(this);").replace(variant==='Boff'?'this.visibilityProbe=new FirstSplatVisibility();':'THIS_WILL_NOT_MATCH','this.visibilityProbe=null;').replace(variant==='Boff'?'this.visibilityProbe.check(this.renderer,candidate)':'THIS_WILL_NOT_MATCH',"this.visibilityProbe?.check(this.renderer,candidate)??{state:'unavailable'}"));
 update('src/viewer/loader.js',source=>source.replace('await mesh.initialized;',"await mesh.initialized;window.__bench.event('spark-initialized');"));
 const out=join(directory,'dist');
 process.env.VITE_BASE_PATH=`/bench/${variant}/`;process.env.VITE_MODEL_HOST='pages';process.env.VITE_DEBUG_BUILD='false';
 process.chdir(directory);
 let result;try{result=await build({root:directory,configFile:join(directory,'vite.config.js'),logLevel:'silent',build:{outDir:out,emptyOutDir:true,manifest:true}});}finally{process.chdir(root);}
 const output=(Array.isArray(result)?result[0]:result).output;
 analysis[variant]=output.filter(item=>item.type==='chunk').map(item=>({file:item.fileName,raw:Buffer.byteLength(item.code),gzip:gzipSync(item.code).length,entry:item.isEntry,imports:item.imports,dynamicImports:item.dynamicImports,modules:Object.keys(item.modules).map(name=>name.replace(directory,'<fixture>').replace(root,'<workspace>'))}));
 for(const item of output)if(item.type==='chunk')writeFileSync(join(out,item.fileName),`window.__bench.event(${JSON.stringify('chunk-evaluation-start:'+item.fileName)});\n${item.code}\nwindow.__bench.event(${JSON.stringify('chunk-evaluation-end:'+item.fileName)});`);
}
writeFileSync(join(workspace,'bundle-analysis.json'),JSON.stringify(analysis,null,2));
if(process.argv.includes('--prepare-only')){console.log('Fixture builds completed.');process.exit(0);}
const harness=`(()=>{
 const events=[],event=name=>events.push({name,at:performance.now()}),rawFetch=window.fetch.bind(window);
 const output=document.createElement('pre');output.id='regression-result';output.style='position:fixed;z-index:20000;right:0;top:50px;max-width:400px;max-height:100px;overflow:auto;background:#111;color:white';
 const button=document.createElement('button');button.textContent='Benchmark complete';button.disabled=true;button.style='position:fixed;z-index:20000;left:0;top:0';
 document.addEventListener('DOMContentLoaded',()=>{document.body.append(button,output);});
 window.fetch=(input,options)=>{const url=String(input);event(url.endsWith('.json')?'manifest-request':url.includes('.ply')?'model-request':'fetch');return rawFetch(input,options);};
 let finished=false;
 window.__bench={event,first(viewer){if(finished)return;finished=true;event('first-splat-submission');
 const gl=viewer.renderer.getContext(),pixels=new Uint8Array(16*16*4);let visible=false;for(const [x,y] of [[.5,.5],[.3,.5],[.7,.5],[.5,.3],[.5,.7]]){gl.readPixels(Math.floor((gl.drawingBufferWidth-16)*x),Math.floor((gl.drawingBufferHeight-16)*y),16,16,gl.RGBA,gl.UNSIGNED_BYTE,pixels);for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]&&[16,21,28].some((n,j)=>Math.abs(n-pixels[i+j])>3)){visible=true;break;}if(visible)break;}if(visible)event('first-visible-splat');
 button.onclick=()=>{output.dataset.steady=JSON.stringify(viewer.getStats());};
 setTimeout(()=>{const resources=performance.getEntriesByType('resource').map(e=>({name:e.name,start:e.startTime,request:e.requestStart,end:e.responseEnd,transfer:e.transferSize,encoded:e.encodedBodySize,decoded:e.decodedBodySize,initiator:e.initiatorType}));const nav=performance.getEntriesByType('navigation')[0];const stats=viewer.getStats();const result={url:location.href,navigation:{responseStart:nav.responseStart,responseEnd:nav.responseEnd},events,resources,visible,stats};output.textContent=JSON.stringify(result);output.dataset.result=JSON.stringify(result);button.disabled=false;},2100);
 }};
})();`;
const ply=readFileSync('public/models/新福里.ply'),compressedModel=gzipSync(ply),cache=new Map();
const latency=40,bytesPerSecond=8_000_000;
const server=createServer((request,response)=>{
 const url=new URL(request.url,'http://localhost');
 const match=url.pathname.match(/^\/(cold|warm)\/(A|B|C|Boff)\/(\d+\/)?(.*)$/);
 if(!match){response.writeHead(404).end();return;}
 const [,mode,variant,iteration='',relative]=match,prefix=`/${mode}/${variant}/${iteration}`;
 let content,kind;
 if(relative.endsWith('.ply')){content=compressedModel;kind='application/octet-stream';}
 else{
  const file=resolve(workspace,variant,'dist',relative||'index.html');
  if(!file.startsWith(join(workspace,variant,'dist')+sep)||!existsSync(file)){response.writeHead(404).end();return;}
  const key=prefix+relative;
  if(!cache.has(key)){let source=readFileSync(file);if(/\.(html|js|json|css)$/.test(file)){source=Buffer.from(source.toString().replaceAll(`/bench/${variant}/`,prefix));if(file.endsWith('.html'))source=Buffer.from(source.toString().replace('<head>',`<head><script>${harness}</script>`));}cache.set(key,gzipSync(source));}
  content=cache.get(key);kind=file.endsWith('.html')?'text/html':file.endsWith('.js')?'text/javascript':file.endsWith('.json')?'application/json':'text/css';
 }
 response.writeHead(200,{'Content-Type':kind,'Content-Encoding':'gzip','Content-Length':content.length,'Cache-Control':mode==='cold'?'no-store':'public,max-age=600'});
 let offset=0;const send=()=>{if(response.destroyed)return;const end=Math.min(content.length,offset+256000);response.write(content.subarray(offset,end));offset=end;if(offset===content.length)response.end();else setTimeout(send,32);};setTimeout(send,latency);
});
server.listen(port,'127.0.0.1',()=>console.log(`Regression fixtures ready http://127.0.0.1:${port}; 40ms server delay, 8MB/s compressed stream, identical model ${ply.length} bytes / gzip ${compressedModel.length}. A=309df5e B=b23e239 C=working source Boff=probe OFF; warm URL priming excluded.`));
