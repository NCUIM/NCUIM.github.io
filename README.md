<div align="center">
  <img src="public/favicon.svg" alt="CIM-Life Logo" width="96" height="96" />
  <h1>CIM-Life · 中央資管通</h1>
  <p><b>國立中央大學資訊管理學系碩士班 · 新生綜合服務與生活入口平台</b></p>

  <p>
    <a href="https://github.com/NCUIM/NCUIM.github.io/actions/workflows/test.yml"><img src="https://img.shields.io/github/actions/workflow/status/NCUIM/NCUIM.github.io/test.yml?branch=main&label=CI%20Tests&style=flat-square" alt="CI Tests" /></a>
    <a href="https://github.com/NCUIM/NCUIM.github.io/actions/workflows/policy.yml"><img src="https://img.shields.io/github/actions/workflow/status/NCUIM/NCUIM.github.io/policy.yml?branch=main&label=Policy&style=flat-square" alt="Policy" /></a>
    <a href="https://ncuim.github.io/"><img src="https://img.shields.io/badge/Deploy-GitHub%20Pages-success?style=flat-square&logo=github" alt="GitHub Pages" /></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" /></a>
    <a href="https://ionicframework.com/"><img src="https://img.shields.io/badge/Ionic-8.0-3880FF?style=flat-square&logo=ionic" alt="Ionic" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript" alt="TypeScript" /></a>
    <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite" alt="Vite" /></a>
  </p>

  <p>
    <b>繁體中文</b> • <a href="README.en.md">English</a> • <a href="https://ncuim.github.io/">🌐 線上體驗 (Live Demo)</a>
  </p>
</div>

---

## 💡 為什麼打造中央資管通？ (Why CIM-Life?)

每逢開學與迎新，資管所新生常面臨以下切身痛點：
* **選課排課眼花撩亂**：學校 CIS 系統介面零碎，難以一眼掌握全所開課時段，多位教授合開的熱門課程更經常重疊混淆。
* **畢業學分算到頭痛**：碩一必修、碩二必修、各組專業選修、外所抵免上限… 規章繁雜且手算容易疏漏。
* **研究室認人查位困難**：走進管二館大研究室（209/310/313/919），想找特定指導教授的學長姐或同學卻不知坐在哪。
* **迎新選位流程繁瑣**：每年抽籤需要確保「同實驗室成員相鄰不拆散」與「S 型蛇形走位」，過去人工排位費時費力。

**CIM-Life (中央資管通)** 專為解決上述需求而生——一個專為中央資管碩士生打造的**行動優先、純前端零伺服器、極致重視隱私**的一站式生活工具箱。

---

## ✨ 核心亮點功能

### 📅 1. 智慧週課表與 CIS 一鍵同步 (`/timetable`)
- **全所總表與個人課表無縫切換**：提供每日精簡與全週矩陣兩種視圖，支援快速篩選碩一/碩二必修與選修。
- **多班合開智慧合併**：同名同時間課程（如《管理溝通》黃子菱老師與何迪亞老師）自動合併為清晰方塊，對齊各自教室，並以底線醒目標記個人修課班級。
- **CIS 書籤小工具同步**：無需輸入任何帳號密碼，直接透過瀏覽器書籤小工具安全解析校務系統，一鍵將當期選課與歷年紀錄載入本機。

### 🎓 2. 碩士畢業學分檢核試算 (`/tools/credit`)
- **自動化修業規章審查**：內建中央資管所最新修業規定，精確統計核心必修、組別選修、外所抵免與畢業學分差額。
- **抵免學分登錄**：支援大學預修、跨校抵免學分輸入，即時更新達成進度條。

### 🗺️ 3. 209/310/313/919 擬真座位圖 (`/seats`)
- **管二館實體格局還原**：依據真實研究室尺寸、大門走道、印表機與柱位配置繪製。
- **即時搜尋與成員定位**：輸入研究生姓名或指導教授，座位即刻高亮定位。

### 🎲 4. 迎新抽籤大會舞台模式 (`/stage/lottery`)
- **S 型蛇形相鄰回溯演算法**：嚴格保證同實驗室/同組成員全部分配在同一研究室且座位相鄰不拆散。
- **大螢幕開獎儀式感**：現場投影專屬 UI，提供組別跑馬燈、滿座進度條與熱烈灑花特效。

### 🍜 5. 新生生存指南與美食地圖 (`/guide`, `/food`)
- **新生 Checklist & 資源直通車**：入學手續時程表、校園授權軟體（GitHub Student Pack、JetBrains 等）領取攻略。
- **中大宵夜街美食轉盤**：收錄後門、宵夜街、前門店家營業時段與推薦品項，拯救午晚餐選擇障礙。

---

## ⚡ 1 分鐘極速體驗 (Quick Start)

### 方式 A：免安裝，直接使用 🌐
直接開啟 GitHub Pages 線上版：  
👉 **[https://ncuim.github.io](https://ncuim.github.io)**

### 方式 B：本地端啟動開發 💻
```bash
# 1. 複製專案
git clone https://github.com/NCUIM/NCUIM.github.io.git
cd NCUIM.github.io

# 2. 安裝相依套件 (自動啟用 Commit 檢驗 Hook)
npm install

# 3. 啟動本機開發伺服器
npm run dev
```
瀏覽器開啟 `http://localhost:5173` 即可立即預覽。

---

## 🔒 零伺服器與極致隱私保護 (Zero-Backend Privacy)

- **100% 純客戶端架構**：託管於 GitHub Pages 全球 CDN，零雲端冷啟動延遲。
- **資料不出本機**：您的個人選課、學分試算與修課歷史**全數保存於本機瀏覽器 LocalStorage**，不經過任何外部後端伺服器，完全無資料外洩風險。

---

## 🛠️ 開發與代碼品質檢驗 (Quality Assurance)

本專案實施嚴格的型別安全與自動化測試：

```bash
npm run typecheck    # TypeScript 嚴格型別檢查
npm test             # 執行 Vitest 全套單元測試 (44+ 測試通過)
npm run test:docs    # 驗證全庫 Markdown 檔案與連結完整性
npm run test:policy  # Commit 規範與 PR 標題自我測試
npm run build        # 生產環境 Bundle 建置
```

---

## 🤝 參與貢獻 (Contributing)

我們歡迎任何功能改善、資訊更新與 Bug 修復！請在發起 PR 前參閱：
- [CONTRIBUTING.md](CONTRIBUTING.md) —— 貢獻流程說明
- [docs/engineering/commit-policy.md](docs/engineering/commit-policy.md) —— Conventional Commits 規範（**Commit 與 PR 一律使用英文**）
- [docs/engineering/testing-policy.md](docs/engineering/testing-policy.md) —— 測試策略與驗收標準


