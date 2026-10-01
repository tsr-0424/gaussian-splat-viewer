export function shareData(title,href,normalBase){
 const url=new URL(href);if(normalBase)url.pathname=normalBase;
 return {title,url:url.href};
}
