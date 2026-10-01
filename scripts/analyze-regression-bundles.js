import {build} from 'vite';
import {readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {gzipSync} from 'node:zlib';
const root=process.cwd(),workspace=resolve('verification/regression'),report={};
for(const variant of ['A','B','C']){
 const directory=join(workspace,variant);
 for(const name of ['src/main.js','src/viewer/GaussianViewer.js','src/viewer/loader.js']){
  const path=join(directory,name);writeFileSync(path,readFileSync(path,'utf8').replace("window.__bench.event('main-evaluation');\n",'').replace("window.__bench.event('route-resolved');",'').replace("window.__bench.event('viewer-constructor');",'').replace('window.__bench.first(this);','').replace("window.__bench.event('spark-initialized');",''));
 }
 report[variant]={};
 for(const separated of [false,true]){
  process.env.VITE_BASE_PATH='/gaussian-splat-viewer/';process.env.VITE_MODEL_HOST='pages';process.env.VITE_DEBUG_BUILD='false';
  const groups=[['spark',/node_modules[\\/]@sparkjsdev[\\/]spark[\\/]/],['three',/node_modules[\\/]three[\\/]/],['ui',/src[\\/]ui[\\/]/],['viewer',/src[\\/]viewer[\\/]/]].map(([name,test])=>({name,test}));
  process.chdir(directory);let result;
  try{result=await build({root:directory,configFile:join(directory,'vite.config.js'),logLevel:'silent',build:{outDir:join(directory,separated?'analysis-separated':'analysis-production'),emptyOutDir:true,...(separated?{rolldownOptions:{output:{strictExecutionOrder:true,codeSplitting:{includeDependenciesRecursively:false,groups}}}}:{})}});}finally{process.chdir(root);}
  const output=(Array.isArray(result)?result[0]:result).output;
  report[variant][separated?'attributionOnlyNotDeployed':'production']=output.filter(item=>item.type==='chunk').map(item=>({file:item.fileName,raw:Buffer.byteLength(item.code),gzip:gzipSync(item.code).length,entry:item.isEntry,imports:item.imports,dynamicImports:item.dynamicImports,modules:Object.keys(item.modules).map(name=>name.replaceAll('\\','/').replace(directory.replaceAll('\\','/'),'<fixture>').replace(root.replaceAll('\\','/'),'<workspace>'))}));
 }
}
writeFileSync(join(workspace,'production-bundle-analysis.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(Object.fromEntries(Object.entries(report).map(([variant,data])=>[variant,{production:data.production.map(({modules,...rest})=>rest),attribution:data.attributionOnlyNotDeployed.map(({modules,...rest})=>rest)}])),null,2));
