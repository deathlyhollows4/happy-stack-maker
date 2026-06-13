$env:CODEWISE_URL = "http://localhost:3001"
cd "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"
npx playwright test --project=chromium tests/e2e/critical-path.spec.ts 2>&1
