<div align="center">
  <img src="public/favicon.svg" alt="CIM-Life Logo" width="80" height="80" />
  <h1>CIM-Life (中央資管通)</h1>
  <p>國立中央大學資訊管理學系碩士班 · 綜合服務與生活入口平台</p>

  <p>
    <a href="https://github.com/NCUIM/NCUIM.github.io/actions/workflows/test.yml"><img src="https://img.shields.io/github/actions/workflow/status/NCUIM/NCUIM.github.io/test.yml?branch=main&label=CI&style=flat-square" alt="CI" /></a>
    <a href="https://ncuim.github.io/"><img src="https://img.shields.io/badge/Online-ncuim.github.io-blue?style=flat-square" alt="Online" /></a>
    <a href="https://github.com/NCUIM/NCUIM.github.io/blob/main/LICENSE"><img src="https://img.shields.io/github/license/NCUIM/NCUIM.github.io?style=flat-square" alt="License" /></a>
  </p>

  <p>
    <b>繁體中文</b> | <a href="README.en.md">English</a>
  </p>
</div>

---

**CIM-Life** 是專為國立中央大學資管所學生設計的 Web 工具，整合全所開課課表、個人課表排程、碩士畢業學分試算、研究室座位格局圖與校園生活資訊。

純前端單頁應用（SPA），所有個人選課與學分資料僅保存在本機瀏覽器（LocalStorage），無後端伺服器儲存，確保個人隱私。

## 主要功能

### 課表與選課同步 (`/timetable`)
- **全所開課總表與個人週課表**：提供全週矩陣視圖與每日精簡視圖，支援快速篩選必修/選修。
- **多班合開課程合併**：同名同時間之合開課程（如《管理溝通》）自動合併為單一方塊，清楚呈現各班教授與教室，並以底線標註個人修習班級。
- **CIS 書籤小工具同步**：提供 Bookmarklet 腳本，登入學校課務系統後點擊即可自動解析選課資料並匯入本機。

### 畢業學分檢核 (`/tools/credit`)
- **修業規章審查**：依據資管所碩士班修業規定，自動統計核心必修、組別選修、外所選修與畢業總學分差額。
- **抵免學分登記**：支援輸入大學預修與跨校抵免學分。

### 研究室座位圖 (`/seats`)
- **管二館實體格局**：收錄 209（20席）、310（27席）、313（23席）、919（9席）平面圖。
- **座位與成員搜尋**：支援依學生姓名或指導教授即時搜尋與定位座位。

### 新生指南與校園生活 (`/guide`, `/food`)
- **入學時程與資源清單**：包含選課時程、校園授權軟體與常用系統連結。
- **中大周邊美食**：整理後門、宵夜街與校內餐飲資訊與營業時間。

## 線上使用

直接開啟網頁即可使用，無須安裝：
**https://ncuim.github.io**

## 本機開發

### 環境需求
- Node.js >= 20.6.0
- npm >= 10.0.0

### 安裝與執行
```bash
git clone https://github.com/NCUIM/NCUIM.github.io.git
cd NCUIM.github.io
npm install
npm run dev
```

開發伺服器預設啟動於 `http://localhost:5173`。

### 測試與建置
```bash
npm run typecheck    # TypeScript 型別檢查
npm test             # 單元測試 (Vitest)
npm run test:docs    # 文件完整性檢查
npm run test:policy  # Commit 規範檢查
npm run build        # 生產環境 Bundle 建置
```

## 貢獻

發起 Pull Request 前請參閱：
- [CONTRIBUTING.md](CONTRIBUTING.md) — 貢獻流程說明
- [docs/engineering/commit-policy.md](docs/engineering/commit-policy.md) — Conventional Commits 規範（Commit 訊息與 PR 標題需使用英文）
- [docs/engineering/testing-policy.md](docs/engineering/testing-policy.md) — 測試策略與驗收標準



