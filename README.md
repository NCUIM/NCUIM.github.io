# CIM-Life (中央資管通) · NCUIM 新生綜合服務與生活入口平台

[![CI Tests](https://github.com/NCUIM/NCUIM.github.io/actions/workflows/test.yml/badge.svg)](https://github.com/NCUIM/NCUIM.github.io/actions/workflows/test.yml)
[![Repository Policy](https://github.com/NCUIM/NCUIM.github.io/actions/workflows/policy.yml/badge.svg)](https://github.com/NCUIM/NCUIM.github.io/actions/workflows/policy.yml)
[![Deploy to GitHub Pages](https://github.com/NCUIM/NCUIM.github.io/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/NCUIM/NCUIM.github.io/actions/workflows/deploy-pages.yml)
[![React](https://img.shields.io/badge/React-18.3-blue.svg?logo=react)](https://react.dev/)
[![Ionic](https://img.shields.io/badge/Ionic-8.0-3880ff.svg?logo=ionic)](https://ionicframework.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?logo=vite)](https://vitejs.dev/)

> **國立中央大學資訊管理學系碩士班綜合服務與新生生活指南平台（CIM-Life）**  
> 為資管所新生量身打造的行動優先 Web 應用，整合選課課表、畢業學分檢核試算、新生生活指南、研究室座位格局圖與抽籤大會。

[English Documentation](README.en.md)

---

## 🌟 核心功能特色

### 1. 📅 碩士班課表與 CIS 同步 (`/timetable`)
- **全所開課總表與個人週課表切換**：快速檢視研究所各時段開課狀況，支援當日精簡與全週完整視圖。
- **一鍵 CIS 書籤小工具同步**：無需繁瑣手動輸入，透過瀏覽器書籤腳本直接解析校務系統，同時同步當期選課與歷年修課紀錄。
- **多班合開課程智慧合併**：相同課名與時段的合開課程（如《管理溝通》）合併於同一區塊呈現，清楚標示各班教授與專屬教室，並以底線標註個人修習班級。
- **碩一 / 碩二必修清晰標籤**：醒目標記必修與選修類別，排課選課一目瞭然。

### 2. 🎓 碩士畢業學分試算系統 (`/tools/credit`)
- **畢業學分與門檻檢核**：依據中央資管碩士班修業規章，自動計算應修學分（含畢業學分門檻、必修與選修領域分配）。
- **抵免學分與歷年紀錄整合**：支援自選課程、抵免學分登錄與即時差額計算。

### 3. 🧭 新生生存指南與生活工具 (`/guide`, `/food`)
- **中央資管生活指南**：選課技巧、校園必備連結、新生待辦事項指引。
- **中大美食地圖**：後門、宵夜街、前門與校內餐廳生活推薦。

### 4. 🗺️ 研究室座位格局與抽籤大會 (`/seats`, `/stage/lottery`)
- **研究室座位格局圖**：互動式視覺化平面圖，清晰標註各研究室格局與座位配置。
- **抽籤大會舞台模式**：支援大螢幕即時開獎與蛇形相鄰分配演算法。

---

## 🏗️ 系統架構與技術棧

本專案採純前端靜態單頁應用（SPA）架構設計，兼具極致載入效能與資安隱私，無外部伺服器資料外洩風險。

| 領域 | 技術選型 |
| --- | --- |
| **前端框架** | [React 18](https://react.dev/) + [Ionic Framework v8](https://ionicframework.com/) |
| **程式語言** | [TypeScript 5.7](https://www.typescriptlang.org/)（嚴格型別模式） |
| **建置工具** | [Vite 6](https://vitejs.dev/) |
| **單元測試** | [Vitest](https://vitest.dev/) + [@testing-library/react](https://testing-library.com/) |
| **端到端測試** | [Playwright](https://playwright.dev/) |
| **CI / CD** | GitHub Actions（自動規範檢查、安全掃描與 GitHub Pages 部署） |
| **託管平台** | [GitHub Pages](https://pages.github.com/) |

---

## 🚀 快速上手 (Quick Start)

### 環境需求
- **Node.js** `>= 20.6.0`
- **npm** `>= 10.0.0`

### 安裝與啟動
```bash
# 1. 複製專案
git clone https://github.com/NCUIM/NCUIM.github.io.git
cd NCUIM.github.io

# 2. 安裝相依套件（自動安裝 Git commit-msg hook）
npm install

# 3. 啟動本機開發伺服器
npm run dev
```
啟動後於瀏覽器開啟 `http://localhost:5173` 即可預覽。

---

## 🧪 測試與代碼規範 (Testing & Quality Assurance)

為確保系統穩定度與代碼品質，本專案實施嚴格的自動化檢驗：

```bash
# 執行 TypeScript 型別檢查
npm run typecheck

# 執行全套單元測試 (Vitest)
npm test

# 執行測試覆蓋率分析
npm run test:coverage

# 執行文件完整性檢查
npm run test:docs

# 執行 Commit 與 PR Policy 自我檢驗
npm run test:policy

# 生產環境建置
npm run build
```

---

## 🤝 貢獻指南 (Contributing)

我們歡迎任何功能改善與 Bug 修復！請在發起 Pull Request 前參閱：
- [CONTRIBUTING.md](CONTRIBUTING.md) —— 貢獻流程與 Commit 訊息標準規範
- [docs/engineering/commit-policy.md](docs/engineering/commit-policy.md) —— Conventional Commits 規範文件
- [docs/engineering/testing-policy.md](docs/engineering/testing-policy.md) —— 測試策略與驗收標準

