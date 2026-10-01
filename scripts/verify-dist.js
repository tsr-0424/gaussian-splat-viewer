import { readdir,readFile,stat } from 'node:fs/promises';
import { join } from 'node:path';
async function files(directory){const entries=await readdir(directory,{withFileTypes:true});return(await Promise.all(entries.map(entry=>entry.isDirectory()?files(join(directory,entry.name)):[join(directory,entry.name)]))).flat();}
const entries=await files('dist');
for(const file of entries){
  if(/\.(ply|spz|sog|splat|ksplat|rad)$/i.test(file))throw new Error(`Model asset must not be deployed with Viewer: ${file}`);
  if((await stat(file)).size>25*1024*1024)throw new Error(`Oversized static asset: ${file}`);
  if(file.endsWith('.js')){
    const source=await readFile(file,'utf8');
    for(const marker of ['Run HIGH / MEDIUM / LOW','Network diagnostics · V0.3','Performance · V0.2'])if(source.includes(marker))throw new Error(`Development code present: ${marker}`);
  }
}
const manifest=JSON.parse(await readFile('dist/models.json','utf8'));
if(process.argv.includes('--deploy')&&manifest.configurationRequired)throw new Error('Configure the production model before deploying. See DEPLOYMENT.md.');
console.log(`Verified ${entries.length} static files; no Gaussian assets or development diagnostics in dist.`);
if(manifest.configurationRequired)console.log('Production model URL still requires configuration.');
