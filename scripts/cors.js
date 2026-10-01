export function createCors(origins) {
  if(!origins.length)throw new Error('Provide at least one explicit Viewer origin');
  const allowed=origins.map(value=>{
    const url=new URL(value);if(url.origin!==value||!['http:','https:'].includes(url.protocol))throw new Error('Use an origin without trailing slash/path/wildcards');
    if(url.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(url.hostname))throw new Error('Non-local origins require HTTPS');
    return url.origin;
  });
  return [{AllowedOrigins:[...new Set(allowed)],AllowedMethods:['GET','HEAD'],AllowedHeaders:['Range','Accept'],
    ExposeHeaders:['Content-Length','Content-Range','Accept-Ranges','ETag','Cache-Control'],MaxAgeSeconds:86400}];
}
if(process.argv[1]?.endsWith('cors.js')){
  const rules=createCors(process.argv.slice(2));
  console.log(JSON.stringify(rules,null,2));
}
