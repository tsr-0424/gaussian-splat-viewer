# V0.4 免費部署

方案：Public GitHub source → GitHub Releases 原始模型 → Actions 下載、核對 SHA256 → GitHub Pages 同網域提供 Viewer 與模型。沒有 R2、付款資訊、Backend 或 Git LFS。

## 實測與取捨

2026-10-02 實測公開 PowerToys Release 的 9,044-byte asset：github.com download URL 回傳 302，最終 release-assets.githubusercontent.com 回傳 200；兩者都未提供 Access-Control-Allow-Origin。localhost 瀏覽器以 Viewer 相同 Accept/application/octet-stream fetch 設定得到 TypeError: Failed to fetch。不可用 no-cors 修正，opaque response 無法提供 Spark 所需 bytes。不可保存短效 signed redirect URL。

因此瀏覽器不直接 fetch Release。Release 是模型發佈來源；建置工具下載模型不受瀏覽器 CORS 限制。模型放進 Pages artifact 的 models/<完整SHA256>/xinfuri.ply，與 Viewer 同 origin。98,221,187 bytes 約 93.7 MiB，整個網站遠低於 Pages 1 GB published-site 限制。模型不放 source Git，不改原始 PLY。

## 發布步驟

1. 使用者已同意 source repository 改為 Public： https://github.com/tsr-0424/gaussian-splat-viewer 。免費 Pages 需要 Public。
2. 提交 source 與 package-lock.json；不提交 files、public/models、dist、token 或 .env.local。
3. 建立 Release tag model-xinfuri-v1，上傳原始 PLY 副本，asset name xinfuri.ply。
4. config/projects.json 的 releaseUrl、sizeBytes、sha256 必須吻合實際 asset。不要用 latest URL 覆寫 immutable version。
5. Settings → Pages → Source 選 GitHub Actions。
6. .github/workflows/pages.yml 執行 npm ci、npm test、npm run build，下載 Release asset、核對大小及 SHA256，再 upload-pages-artifact / deploy-pages。正式 build 不含 Performance/Benchmark/Network 面板；另外建立 /debug/ 診斷入口。
7. 開啟 Actions 實際產生的 Pages URL，實測模型與 controls。預計 path /gaussian-splat-viewer/，未部署前不能當作已驗證網址。

GitHub Actions 使用自動 GITHUB_TOKEN 的 contents:read、pages:write、id-token:write，不需要自訂 token、信用卡或付費方案。不要啟用付費 runner。

## 本機

npm install
npm test
npm run dev
npm run build

本機 public/models/新福里.ply 保持不變；.env.development 使用本機網址。production 使用 VITE_MODEL_HOST=pages、VITE_BASE_PATH=/gaussian-splat-viewer/。npm run build 只產生前端與 manifest；模型由 node scripts/prepare-pages-models.js 補入，node scripts/verify-pages.js 驗證 artifact。

更換模型：新增 Release version、更新 config/projects.json 的 id、format、releaseUrl、sizeBytes、sha256 與 rotation，push 或手動觸發 Actions。SHA256 路徑可避免舊模型 cache 混用。GitHub Pages 不支援 Cloudflare _headers 設定，不能保證自訂一年 Cache-Control；noindex meta/robots 仍有效但不是存取控制。公開 source、Release 與模型任何人可下載。

Pages 有 published-site 1 GB、soft bandwidth 100 GB/month 等限制；約 98 MB 的首次完整下載，約千次未快取模型下載即可接近 100 GB。這是 MVP，不承諾無限使用或 production SLA。未來成長再評估儲存平台，現在不啟用任何計費。

https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases

## 已完成公開部署

公開網址：https://tsr-0424.github.io/gaussian-splat-viewer/
Release：https://github.com/tsr-0424/gaussian-splat-viewer/releases/tag/model-xinfuri-v1
已確認 Public repository、Pages Actions source、workflow run 36892402092 成功（37秒）。原始模型大小/SHA256均通過部署腳本驗證；未登入Pages模型HTTP200，Range16bytes回傳206。模型Cache-Control由Pages提供max-age=600，使用完整SHA256路徑避免版本混淆，不宣稱自訂immutable cache header。

自己的xinfuri.ply Release URL也已實際瀏覽器fetch測試，同樣Failed to fetch；HEAD確認302→200皆無ACAO。Pages同origin解決此問題。Pages本身提供ACAO:*，這是平台行為，沒有自行放寬伺服器CORS設定。

## 公開瀏覽器驗證完成

公開頁面載入完整Gaussian、桌機約75 FPS；HIGH/MEDIUM/LOW/AUTO切換、Reset、resize通過，console error 0。另一公開分頁390x844的canvas390x844、scrollWidth390；本地視覺Worker確認模型可見、按鈕未越界、無Loading或錯誤。實體iOS/Android尚未測試，touch由既有OrbitControls單指旋轉/雙指縮放平移支援。

Pages實際gzip傳輸Content-Length25,074,893 bytes，解碼後模型98,221,187 bytes；同origin可讀Content-Encoding，loader正確採用indeterminate progress。首個body chunk小型測試200、19,610 bytes、約295.9ms（這次測試觀察值，不是完整下載時間或效能保證）。

Actions成功run提供Node20 action runtime轉換為Node24的非阻擋提示，以及ubuntu-latest未來映像遷移公告；build另有Spark bundle大小提示。沒有將這些提示當成Viewer console error。

# V0.4 Project / Scan 與 debug 發布

目前主程式首頁改為 Gallery。新福里直接網址：
https://tsr-0424.github.io/gaussian-splat-viewer/#/viewer/xinfuri/main

明確進入 debug 版：
https://tsr-0424.github.io/gaussian-splat-viewer/debug/#/viewer/xinfuri/main

正常版 JS 不包含 profiler / benchmark；debug 有自己的 HTML/JS，模型仍指向網站根目錄的同一份 models/<sha>/asset.ply。兩個入口都維持 noindex；debug 是公開的明確選用工具，不是有登入保護的私人頁面。

## 新 manifest

config/projects.json 是唯一來源。建置生成 projects.json（供新 UI）與 models.json（維持舊 ?model 相容）。Project：id、title、description、date/location（可空）、thumbnail（可空）、scans。Scan：id、title、assetId（optional）、developmentUrl、releaseUrl、format、rotation、thumbnail、defaultCamera、metadata。metadata：sizeBytes、sha256、source 與未來自訂資訊。

新增第二個 Project 的 entry 例如（此為格式範例，請換成真正公開 Release、檔案大小及完整 SHA256）：

```json
{
  "id": "my-room",
  "title": "我的房間",
  "description": "房間空間紀錄",
  "date": null,
  "thumbnail": "thumbnails/my-room.webp",
  "scans": [{
    "id": "main",
    "title": "主掃描",
    "developmentUrl": "models/my-room.ply",
    "releaseUrl": "https://github.com/OWNER/REPO/releases/download/TAG/my-room.ply",
    "format": "ply",
    "rotation": [0,0,0],
    "defaultCamera": null,
    "metadata": {"sizeBytes": 123456, "sha256": "REPLACE_WITH_64_LOWERCASE_HEX_DIGITS"}
  }]
}
```

assetId 省略時為 my-room--main，Viewer URL 為 #/viewer/my-room/main。thumbnail 限制為 public/thumbnails/ 下的 SVG/PNG/JPEG/WebP，建置只複製 manifest 引用的檔案，不複製 public/models。

## 更新的 workflow

npm ci → npm test → npm run build → prepare-pages-models → verify-pages → npm run build:debug → verify-production-ui → upload/deploy Pages。

Node 與 build/env 基礎沿用 V0.3。.env.debug 的 VITE_MODEL_BASE_PATH 指向正常網站根目錄，VITE_BASE_PATH 指向 /debug/。CI 使用 configure-pages 產生的 base_path；沒有增加 secrets、storage service 或付費 runner。

Resource Timing 必須在模型 stream 完成後才會有 entry；ResourceTiming requestStart→responseEnd 與 Spark Load 可能重疊，不可直接相加。更多定義及資料可得性见 README.md 與 V0.4_完成回報.txt。

官方依據：
https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming
https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/transferSize
https://sparkjs.dev/docs/splat-mesh/
https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels

