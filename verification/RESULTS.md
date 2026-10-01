# V0.1 驗證 — 2026-10-01

- Node 24.17.0、npm 11.13.0；npm install 成功，0 vulnerabilities。
- npm run build 成功。Spark 含 WASM，bundle 約 3.07 MB（gzip 1.03 MB）；Vite 有大型 chunk 提示，不影響 build。
- Vite dev server http://127.0.0.1:5173 啟動成功。
- 實際瀏覽器載入 新福里.ply：396,047 Gaussians、Loading 100%、FPS 約 75（僅此測試機，不保證其他硬體）。
- 載入、Reset View、滑鼠旋轉與滾輪縮放後 console error：0。
- 有一則 WebGL shader 編譯 warning：signed/unsigned mismatch, unsigned assumed。來自 Spark／顯示驅動編譯器；未阻止渲染，未隱藏警告。
- 390 × 844 響應式測試：canvas clientWidth/Height 與 viewport 完全一致；Reset View 成功。
- 原始與 public 模型 SHA256 相同：4E447A26C34819F1558933F12F783CDF9FF574B3213056C6D38E1C894AED9B7B。
- 畫面保存為 viewer.png，依 AGENTS.md 交給本地 01a_vision_worker.py 判讀：確認可見三維場景、Loading 100%、FPS 75、UI 未擋住場景；Worker 提到右側局部模糊，未能判定是掃描資料或渲染造成。未進行原始掃描品質修復。
- 鍵盤及右鍵平移已實作，尚未逐鍵自動化測試。

後續維護注意：先核對 Spark 安裝版本的型別／source；不要拿普通 PLYLoader 取代 Gaussian 解碼；公開模型切換 R2 前注意 CORS 與 URL；Vite public 大檔會複製到 dist。
