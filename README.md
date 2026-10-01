# V0.3 Deployment Strategy

This viewer uses free GitHub Pages. Source is public; original Gaussian models are versioned GitHub Release assets. CI downloads and SHA256-verifies the model, then publishes it alongside the viewer in the Pages artifact. Browser loading is same-origin because direct GitHub Release fetch failed the real CORS test.

See DEPLOYMENT.md for the measured result, free-plan limits and publishing steps.

Install: npm install
Develop: npm run dev
Test: npm test
Build frontend: npm run build

Put local Gaussian PLY in public/models/新福里.ply. Configure models in config/models.json; production uses .env.production and GitHub Actions. Models, credentials, node_modules and dist are not committed. Spark renders Gaussian data (not ordinary point clouds).

Controls: left drag rotate, right drag pan, wheel zoom; WASD/QE navigation, Shift faster, R/reset camera. Touch: one finger rotates, two fingers zoom/pan. AUTO/HIGH/MEDIUM/LOW, FPS and all V0.2 quality/adaptation functionality remain. Development Performance/Benchmark/Network panels are omitted from production. Share and supported Fullscreen controls are provided.

The loader reads the full Gaussian stream before rendering. It reports real byte progress when Content-Length is readable, otherwise indeterminate. WebGL2 is required. Mobile layout and OrbitControls are supported; real iOS/Android device validation must be distinguished from desktop narrow-viewport testing.

Build contains no models until deployment preparation: node scripts/prepare-pages-models.js; then node scripts/verify-pages.js. New models must have a new Release URL, matching size and SHA256 in the catalog. Original PLY remains unchanged; no Gaussian deletion, conversion or permanent quality reduction occurs.
