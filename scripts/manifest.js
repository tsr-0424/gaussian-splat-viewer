export function generateManifest(catalog, { development = false, assetBase = '', modelUrl = '', siteBase = '/', pages = false } = {}) {
  const absolute = value => {const url=new URL(value);if(url.protocol!=='https:')throw new Error('Production model URL must use HTTPS');if(url.username||url.password||url.search)throw new Error('Use public URLs without credentials or signed query tokens');return url.href;};
  const base=assetBase ? absolute(assetBase.replace(/\/+$/,'')+'/') : '';
  const models=catalog.models.map(({developmentUrl,...model})=>({ ...model,
    modelUrl: development ? `${siteBase}${developmentUrl}` : pages ? `${siteBase}models/${model.sha256}/${model.id}.${model.format}` : modelUrl && model.id===catalog.defaultModelId ? absolute(modelUrl) : base ? new URL(model.modelUrl,base).href : null,
  }));
  return {version:catalog.version,defaultModelId:catalog.defaultModelId,configurationRequired:models.some(model=>!model.modelUrl),models};
}
