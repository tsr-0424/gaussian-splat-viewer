# V0.3 免費部署

方案：Public GitHub source → GitHub Releases 原始模型 → Actions 下載、核對 SHA256 → GitHub Pages 同網域提供 Viewer 與模型。沒有 R2、付款資訊、Backend 或 Git LFS。

## 實測與取捨

2026-10-02 實測公開 PowerToys Release 的 9,044-byte asset：github.com download URL 回傳 302，最終 release-assets.githubusercontent.com 回傳 200；兩者都未提供 Access-Control-Allow-Origin。localhost 瀏覽器以 Viewer 相同 Accept/application/octet-stream fetch 設定得到 TypeError: Failed to fetch。不可用 no-cors 修正，opaque response 無法提供 Spark 所需 bytes。不可保存短效 signed redirect URL。

因此瀏覽器不直接 fetch Release。Release 是模型發佈來源；建置工具下載模型不受瀏覽器 CORS 限制。模型放進 Pages artifact 的 models/<完整SHA256>/xinfuri.ply，與 Viewer 同 origin。98,221,187 bytes 約 93.7 MiB，整個網站遠低於 Pages 1 GB published-site 限制。模型不放 source Git，不改原始 PLY。

## 發布步驟

1. 使用者已同意 source repository 改為 Public： https://github.com/tsr-0424/gaussian-splat-viewer 。免費 Pages 需要 Public。
2. 提交 source 與 package-lock.json；不提交 files、public/models、dist、token 或 .env.local。
3. 建立 Release tag model-xinfuri-v1，上傳原始 PLY 副本，asset name xinfuri.ply。
4. config/models.json 的 releaseUrl、sizeBytes、sha256 必須吻合實際 asset。不要用 latest URL 覆寫 immutable version。
5. Settings → Pages → Source 選 GitHub Actions。
6. .github/workflows/pages.yml 執行 npm ci、npm test、npm run build，下載 Release asset、核對大小及 SHA256，再 upload-pages-artifact / deploy-pages。正式 build 不含 Performance/Benchmark/Network 面板。
7. 開啟 Actions 實際產生的 Pages URL，實測模型與 controls。預計 path /gaussian-splat-viewer/，未部署前不能當作已驗證網址。

GitHub Actions 使用自動 GITHUB_TOKEN 的 contents:read、pages:write、id-token:write，不需要自訂 token、信用卡或付費方案。不要啟用付費 runner。

## 本機

npm install
npm test
npm run dev
npm run build

本機 public/models/新福里.ply 保持不變；.env.development 使用本機網址。production 使用 VITE_MODEL_HOST=pages、VITE_BASE_PATH=/gaussian-splat-viewer/。npm run build 只產生前端與 manifest；模型由 node scripts/prepare-pages-models.js 補入，node scripts/verify-pages.js 驗證 artifact。

更換模型：新增 Release version、更新 config/models.json 的 id、format、releaseUrl、sizeBytes、sha256 與 rotation，push 或手動觸發 Actions。SHA256 路徑可避免舊模型 cache 混用。GitHub Pages 不支援 Cloudflare _headers 設定，不能保證自訂一年 Cache-Control；noindex meta/robots 仍有效但不是存取控制。公開 source、Release 與模型任何人可下載。

Pages 有 published-site 1 GB、soft bandwidth 100 GB/month 等限制；約 98 MB 的首次完整下載，約千次未快取模型下載即可接近 100 GB。這是 MVP，不承諾無限使用或 production SLA。未來成長再評估儲存平台，現在不啟用任何計費。

https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases
