# Gaussian Splat Web Viewer V0.3

公開 Viewer：https://tsr-0424.github.io/gaussian-splat-viewer/
Source：https://github.com/tsr-0424/gaussian-splat-viewer （Public）

完全免費 MVP：GitHub Releases 保存原始 Gaussian；GitHub Actions 下載並核對 SHA256，再與 Viewer 一起發布到 GitHub Pages。瀏覽器使用同網域模型 URL，因為實測 Release 直接 fetch 會遇到 CORS 錯誤。沒有 R2、Backend、信用卡、付費方案或 Git LFS。

## 安裝與執行

需要 Node.js 24.17.0（已驗證）與 WebGL2。

```powershell
npm install
npm run dev
npm test
npm run build
```

開啟 http://127.0.0.1:5173/ 。模型放 public/models/新福里.ply，原始备份放 files/；模型與備份不進 source Git。clone 後須自行準備本機模型。

npm run build 產生前端和 manifest，不包含模型。npm run build:pages 再下載公開 Release、驗證大小與SHA256、產生完整Pages artifact；npm run preview 可檢查其 /gaussian-splat-viewer/ 路徑。正式發布由 .github/workflows/pages.yml 負責，不需自訂 token。

## 設定與更換模型

config/models.json 設定 id、name、format、developmentUrl、releaseUrl、sizeBytes、sha256、rotation、defaultCamera。正式 manifest 的 modelUrl 由 Pages base path + SHA256 產生，不使用短效 signed redirect URL。新模型上傳新的 Release version，更新目錄再 push main。普通 Point Cloud PLY 不等於 Gaussian PLY；Spark 解碼Gaussian的尺度、旋轉、opacity與SH/color。

.env.development 使用本機模型；.env.production 使用 VITE_MODEL_HOST=pages 與 repository base path。所有VITE_*都是公開資料，不可放credentials。完整步驟、CORS實測、Pages限制見 DEPLOYMENT.md。

## 操作與 V0.2 功能

- 左鍵旋轉、右鍵平移、滾輪縮放；WASD/QE移動，Shift加速，R或Reset View重設。
- Touch：單指旋轉、雙指縮放/平移，由OrbitControls支援。
- AUTO/HIGH/MEDIUM/LOW、FPS、software renderer檢測、hysteresis/cooldown、自動取景保留。
- Share與支援的Fullscreen；手機safe-area與resize。
- 開發Performance/Benchmark/Network面板不進production JS。
- 只在可取得真實byte progress時顯示百分比，其餘indeterminate。下載/解碼完成、首次Gaussian渲染後淡出。

目前使用完整Gaussian stream，沒有宣稱progressive LOD或Range逐步顯示；不修改原始PLY、不刪Gaussian。公開Desktop與390x844 viewport測試通過，實體iOS/Android效能尚待測試。
