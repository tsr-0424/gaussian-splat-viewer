import {readFileSync,writeFileSync} from 'node:fs';
const all=JSON.parse(readFileSync('verification/regression/results.json','utf8'));
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const samples=all.filter(run=>run.cache!=='prime').map(run=>{
 const time=name=>run.events.find(event=>event.name===name)?.at??null;
 const model=run.resources.find(entry=>entry.name.includes('.ply'));
 return {variant:run.variant,cache:run.cache,iteration:run.iteration,requestMs:time('model-request'),networkMs:model.end-time('model-request'),afterResponseMs:time('first-visible-splat')-model.end,firstVisibleMs:time('first-visible-splat'),submissionMs:time('first-splat-submission'),fps:run.stats.fps,transfer:model.transfer,encoded:model.encoded,decoded:model.decoded,visible:run.visible};
});
const medians=[];
for(const cache of ['cold','warm'])for(const variant of ['A','B','C','Boff']){
 const group=samples.filter(run=>run.cache===cache&&run.variant===variant);if(!group.length)continue;
 if(group.length!==5||group.some(run=>!run.visible||cache==='warm'&&run.transfer!==0||cache==='cold'&&run.transfer<=0))throw new Error(`Invalid or non-comparable ${cache}/${variant} samples`);
 medians.push({variant,cache,n:group.length,...Object.fromEntries(['requestMs','networkMs','afterResponseMs','firstVisibleMs','fps'].map(key=>[key,median(group.map(run=>run[key]))]))});
}
const waterfalls=all.filter(run=>run.cache==='cold'&&run.iteration===3).map(run=>({variant:run.variant,navigation:run.navigation,events:run.events,resources:run.resources}));
const report={environment:{browser:all[0].stats.browser,gpu:all[0].stats.gpu,viewport:[all[0].stats.viewportWidth,all[0].stats.viewportHeight],dpr:all[0].stats.dpr,ratio:all[0].stats.pixelRatio,gaussians:all[0].stats.splats,serverDelayMs:40,compressedBytesPerSecond:8000000,cold:'HTTP no-store and unique asset URL; shader/JIT cache not cleared',warm:'primed exact URL, model transferSize verified zero'},medians,samples,waterfalls};
writeFileSync('verification/V0.4.1-regression-results.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({environment:report.environment,medians},null,2));
