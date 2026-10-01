import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
async function walk(path){const entries=await readdir(path,{withFileTypes:true});return (await Promise.all(entries.filter(entry=>entry.name!=='debug').map(entry=>entry.isDirectory()?walk(join(path,entry.name)):[join(path,entry.name)]))).flat();}
for(const file of await walk('dist'))if(file.endsWith('.js')){
 const code=await readFile(file,'utf8');for(const marker of ['Copy Benchmark Report','Loading Profiler','Run HIGH / MEDIUM / LOW','Framebuffer readback unavailable','No non-background pixels in five sample tiles','LoadingProfilerPanel','PerformancePanel-','Benchmark-'])if(code.includes(marker))throw new Error(`Debug code leaked into normal production: ${file}`);
}
const debug=await readFile('dist/debug/index.html','utf8');if(!debug.includes('/debug/'))throw new Error('Missing independent debug build');
console.log('Normal production JS excludes debug panels; separate /debug/ build exists.');
