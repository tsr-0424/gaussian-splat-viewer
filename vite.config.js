import { defineConfig, loadEnv } from 'vite';
import { readFileSync } from 'node:fs';
import { generateManifest } from './scripts/manifest.js';
import {generateProjects,projectAssets} from './scripts/projects.js';
import {existsSync} from 'node:fs';

export default defineConfig(({command,mode})=>{
  const env=loadEnv(mode,process.cwd(),'VITE_');
  const siteBase=env.VITE_BASE_PATH||'/';
  const catalog=()=>JSON.parse(readFileSync('config/projects.json','utf8'));
  const options={development:mode==='development',assetBase:env.VITE_ASSET_BASE_URL,modelUrl:env.VITE_MODEL_URL,siteBase:env.VITE_MODEL_BASE_PATH||siteBase,pages:env.VITE_MODEL_HOST==='pages'};
  const manifest=()=>{const models=projectAssets(catalog());return JSON.stringify(generateManifest({version:1,defaultModelId:models[0].id,models},options),null,2);};
  const projects=()=>JSON.stringify(generateProjects(catalog(),options),null,2);
  return {base:siteBase,publicDir:command==='serve'?'public':false,
    server:{port:5173,strictPort:true},preview:{port:4173,strictPort:true},
    plugins:[{name:'viewer-deployment-assets',
      configureServer(server){server.middlewares.use((request,response,next)=>{
        const path=request.url?.split('?')[0];if(!['/models.json','/projects.json'].includes(path))return next();
        response.setHeader('Content-Type','application/json; charset=utf-8');response.setHeader('Cache-Control','no-cache');response.end(path==='/projects.json'?projects():manifest());
      });},
      generateBundle(){
        this.emitFile({type:'asset',fileName:'models.json',source:manifest()});
        this.emitFile({type:'asset',fileName:'projects.json',source:projects()});
        for(const file of ['robots.txt','404.html'])this.emitFile({type:'asset',fileName:file,source:readFileSync(`deploy/static/${file}`,'utf8')});
        const thumbnails=new Set(catalog().projects.flatMap(project=>[project.thumbnail,...project.scans.map(scan=>scan.thumbnail)]).filter(Boolean));
        for(const path of thumbnails){if(!/^thumbnails\/[\w/-]+\.(svg|png|jpg|jpeg|webp)$/i.test(path)||path.includes('..')||!existsSync(`public/${path}`))throw new Error(`Invalid/missing thumbnail: ${path}`);this.emitFile({type:'asset',fileName:path,source:readFileSync(`public/${path}`)});}
      },
    }],
  };
});
