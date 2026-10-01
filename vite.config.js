import { defineConfig, loadEnv } from 'vite';
import { readFileSync } from 'node:fs';
import { generateManifest } from './scripts/manifest.js';

export default defineConfig(({command,mode})=>{
  const env=loadEnv(mode,process.cwd(),'VITE_');
  const siteBase=env.VITE_BASE_PATH||'/';
  const manifest=()=>JSON.stringify(generateManifest(JSON.parse(readFileSync('config/models.json','utf8')),
    {development:mode==='development',assetBase:env.VITE_ASSET_BASE_URL,modelUrl:env.VITE_MODEL_URL,siteBase,pages:env.VITE_MODEL_HOST==='pages'}),null,2);
  return {base:siteBase,publicDir:command==='serve'?'public':false,
    server:{port:5173,strictPort:true},preview:{port:4173,strictPort:true},
    plugins:[{name:'viewer-deployment-assets',
      configureServer(server){server.middlewares.use((request,response,next)=>{
        if(request.url?.split('?')[0]!=='/models.json')return next();
        response.setHeader('Content-Type','application/json; charset=utf-8');response.setHeader('Cache-Control','no-cache');response.end(manifest());
      });},
      generateBundle(){
        this.emitFile({type:'asset',fileName:'models.json',source:manifest()});
        for(const file of ['_headers','robots.txt','404.html'])this.emitFile({type:'asset',fileName:file,source:readFileSync(`deploy/static/${file}`,'utf8')});
      },
    }],
  };
});
