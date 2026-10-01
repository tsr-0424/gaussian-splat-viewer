# Spatial Scan Platform — Gaussian Viewer V0.4

[首頁](https://tsr-0424.github.io/gaussian-splat-viewer/)
[新福里 Viewer](https://tsr-0424.github.io/gaussian-splat-viewer/#/viewer/xinfuri/main)
[Debug Viewer](https://tsr-0424.github.io/gaussian-splat-viewer/debug/#/viewer/xinfuri/main)

Three.js + Spark + Vite，純靜態、零成本 GitHub Pages / Releases。無 React、帳號、Database、Backend、R2、analytics 或 tracking。原始 PLY 與 V0.2 的品質／控制功能保留。

## 安裝與本機

Node.js 24.17.0（已驗證），需要 WebGL2。

```powershell
npm install
npm run dev
npm test
npm run build
npm run build:debug
```

預設 dev：http://127.0.0.1:5173/ 。port 被原先 server 使用時可 `npm run dev -- --port 5174`。Development 自動提供 Profiler，仍預設隱藏。模型放 public/models/新福里.ply；原始備份放 files/。兩者均不提交 Git，clone 後請自行準備。

`npm run build` 產生正常網站，JS 不含 debug 面板。`npm run build:debug` 產生 dist/debug 的獨立版，模型與正常版共用，不重複儲存。GitHub Actions 會下載並 SHA256 驗證 Release 模型，再發布正常網站與獨立 debug 版。公開訪客正常入口不會載入 profiler。

## 路由

使用 GitHub Pages 可直接重新整理的 hash routing：

- `#/`：Project Gallery。
- `#/project/xinfuri`：新福里 Project。
- `#/viewer/xinfuri/main`：主掃描 Viewer。
- 舊 `?model=xinfuri` 自動轉到 Viewer hash URL。

首頁與 Project 不初始化 WebGL，不下載大型模型；進 Viewer 才 lazy import Spark 與 Three.js。換頁會停止 animation loop、取消下載、釋放 mesh/renderer、斷開 observer，避免留下多個 viewer。

## 新增 Project / Scan

唯一來源是 config/projects.json；models.json 僅為建置產生的舊版相容 manifest，不再手動維護。

1. 原始模型上傳 GitHub Release，新版使用新 tag/asset，不覆寫原始 PLY。
2. 本機副本放 public/models/；thumbnail 放 public/thumbnails/（可省略，會顯示 placeholder）。
3. 新增 project 與 scans entry。project/scan id 使用小寫英數與 hyphen；各 project 內 scan id 唯一。assetId 可省略，自動用 project-id--scan-id。
4. metadata 填入正確 sizeBytes、sha256；填 releaseUrl、format、developmentUrl、rotation。defaultCamera 可空，或 `{position:[x,y,z],target:[x,y,z]}`。
5. push main，Actions 自動測試、建置、下載模型並驗證。Gallery 不需改 source 就會新增 entry。

完整 schema、第二個 Project 範例、發布限制见 DEPLOYMENT.md。

## 控制與 UI

Viewer 全視窗；左上專案／掃描名稱，右上 Fullscreen、Share、Settings，底部 Orbit/Explore、Reset、Quality。Explore 目前切換為 ground-plane panning，並保留 WASD/QE；不是新作的第一人稱碰撞系統。

左鍵旋轉、右鍵或 Shift+左鍵平移、滾輪縮放；WASD/QE 移動，Shift 加速，R 重設。Touch 使用 OrbitControls：單指旋轉、雙指縮放／平移。AUTO/HIGH/MEDIUM/LOW、software renderer 警示、自動取景及 cooldown/hysteresis 保留。preset 只改 framebuffer resolution。

Share 使用系統分享；不支援時 Copy Link，Settings 也有明確 Copy Link。Debug 版分享會產生正常版的目前 Project/Scan URL。Fullscreen 在瀏覽器支援時顯示。

Loading 顯示 Loading Spatial Data；僅有真實 bytes progress 才顯示百分比，gzip response 則 indeterminate。下載完成後仍等待 Gaussian 渲染及有限次 pixel 取樣才淡出；取樣未確認時明確提示，Profiler 不編造 First Visible 數字。

## Loading Profiler / Benchmark Report

本機 dev 或公開 `/debug/` → Settings → Performance（桌機可 P）→ Copy Benchmark Report。手機 debug 版也能複製；clipboard 不可用則顯示可手動複製的文字框。面板可 Close。

Network 使用 PerformanceResourceTiming 的 requestStart→responseEnd；Transfer 包含 HTTP headers，Encoded/Decoded body 分開。跨 origin 未提供 Timing-Allow-Origin、API 不支援或資訊不足時顯示 unavailable。Cache 僅在可確認本機 cache 的情況標示 local cache，不推測 CDN hit/miss。

Spark Load 是 SplatMesh 建構→initialized，會與下載重疊；Spark Tail 是 stream EOF→initialized，不能當純 parse。Scene CPU 是 bounds/scene attachment/camera setup；GPU initialization、解壓縮、純 parse 無公開獨立 timing，維持 unavailable。

First Render 可為背景；First Splat Submission 為已排序 splats 的渲染提交。First Visible 是同一 framebuffer 有非背景 pixel 的取樣證據，不等於 compositor/螢幕呈現時間。最多一次背景與五次 16×16 取樣，不重畫場景、不是每幀長期 readback。

同時報告 navigation→Ready 與 viewer-open→Ready，避免把 Gallery 停留時間誤當載入。Average FPS 是 ready 後前 10 秒有效 frame intervals；不足 10 秒為 collecting、隱藏分頁則 interrupted。記錄品質集合與測量視窗，便於辨認品質混用。

所有 UI/面板最多 2 Hz 更新；隱藏面板不更新 DOM。沒有重寫 Spark，沒有降低原始模型品質。初次完整下載與 gzip 解碼不是 progressive Gaussian LOD。

Profiler 另列 Viewer JS 與 Debug JS 的 import→ready wall-clock（含下載／evaluation）；若開始請求模型前有等待，可避免把這段誤算為 PLY parse。
