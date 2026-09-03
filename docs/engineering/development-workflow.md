# 開發與協作工作流程 (Development Workflow)

本專案採用輕量敏捷交付與風險導向測試策略。所有工作皆以小型 Pull Request (PR) 針對 `main` 分支進行交付，不維護長期存在的 `dev` 分支。

---

## 分支流程 (Branch Flow)

1. 自最新的 `main` 分支切出。
2. 建立具備簡潔名稱的短期分支（前綴一律比照 Conventional Commit Type 縮寫）：
   - `feat/<short-name>`：新功能開發
   - `fix/<short-name>`：Bug 修復
   - `refactor/<short-name>`：架構重構或程式碼整理
   - `docs/<short-name>`：文件或流程改善
   - `style/<short-name>`：UI 樣式微調
   - `chore/<short-name>`：工具與維護工作
3. 確保每一次 Commit 符合原子化原則，每個 PR 為獨立可交付的單元。
4. 若分支過期，發起 PR 前應先針對 `main` 進行 Rebase。
5. 必須於所有 CI 檢驗通過且 Code Review 討論解決後方可合併。

---

## 提交與 PR 粒度 (Commit and PR Granularity)

規範分為兩個層次：

- **Commit —— 原子化單位 (Atomic Unit)**：單一 Commit 僅能包含一個邏輯變更。無關的修改必須分開提交。**所有 Commit 訊息必須使用全英文撰寫**。
- **PR —— 可交付單位 (Deliverable Unit)**：PR 為最小可獨立審查、合併與回滾的完整功能切片。**PR 標題必須使用全英文**。

---

## 前端技術棧 (Frontend Stack)

- Ionic Framework (v8)
- React 18
- TypeScript (Strict Mode)
- Vite 6
- Vitest & Playwright (E2E)
- GitHub Pages (Static Hosting)

---

## 常用指令 (Frontend Commands)

```sh
npm install
npm run dev
npm run build
npm test
```

通訊埠唯一定義於 `package.json`：

| 指令 | 預設 URL | 說明 |
| --- | --- | --- |
| `npm run dev` | `http://127.0.0.1:5173/` | 本機開發伺服器 |
| `npm run preview` | `http://127.0.0.1:4173/` | 生產環境預覽 |
| `npm run dev:e2e` | `http://127.0.0.1:4174/` | Playwright E2E 測試伺服器 |

---

## 專案目錄架構 (Directory Structure)

專案採用標準 Vite + React + Ionic SPA 架構，各目錄分工如下：

```
NCUIM2026-Fresher/
├── public/              # 靜態資源源碼庫（原始圖示、圖檔、不需編譯的檔案）
│   └── ncuim-icons/     # 官方核心圖標資產庫（Favicon, Logo, Avatar, Banner）
├── src/                 # 核心應用程式原始碼（TypeScript / React / Ionic）
│   ├── components/      # 共用 UI 元件（課表格子、座位搜尋列、彈窗等）
│   ├── pages/           # 路由頁面（首頁、全系課表、學分試算、研究室座位等）
│   ├── services/        # 資料處理與演算法邏輯（學分試算、公告爬蟲、課表同步）
│   ├── theme/           # 設計系統與全域樣式（variables.css 配色與字級規範）
│   ├── types/           # TypeScript 資料結構與型別定義
│   └── test/            # 單元與整合測試套件（Vitest 測試案例）
├── docs/                # 專案架構、規範與規格文件庫
│   ├── adr/             # 重大架構決策紀錄（Architectural Decision Records）
│   ├── engineering/     # 工程規範（Commit 規範、測試策略、開發工作流）
│   └── specs/           # 功能規格書（如新生指南規格）
├── scripts/             # 自動化品質檢查腳本（連結校驗、Commit 規範驗證）
├── dist/                # npm run build 自動產生的最終上線部署產物（禁止提交）
└── 根目錄設定檔          # package.json, vite.config.ts, tsconfig.json 等
```

| 目錄路徑 | 負責角色與用途 | 是否手動維護？ |
| :--- | :--- | :---: |
| `public/` | **靜態資源源碼庫**：放置網站圖示（`favicon.svg`、`hero-logo.svg`）與靜態檔案。打包時 Vite 會原封不動複製到 `dist/`。 | **是** |
| `src/` | **業務邏輯與前端介面**：包含所有 React 元件、頁面、CSS 樣式與 TypeScript 邏輯。 | **是** |
| `docs/` | **技術與工程規範文件庫**：包含架構決策、貢獻規範、Commit 規則等，供團隊維護專案時查閱。 | **是** |
| `scripts/` | **CI/CD 自動化工具**：包含文件超連結校驗腳本、Commit 格式檢查等，在 `npm test` 時自動執行。 | **是** |
| `dist/` | **發布產物（Distribution）**：執行 `npm run build` 時 Vite 自動編譯壓縮出來的檔案，用來部署到 GitHub Pages 線上伺服器。 | **否（自動生成）** |

---

## PR 驗證要求 (PR Verification)

發起前端 PR 時必須確認：

1. 執行 `npm run build` 成功。
2. 瀏覽器冒煙測試通過（無介面破版、無重疊文字）。
3. 瀏覽器 Console 無任何 Error 報錯。
4. 確認無任何自動生成的暫存檔案被暫存（Staged）。

### 冒煙測試檢核清單：
- 於開發環境成功載入應用。
- 主導覽列（Tabs / Header）正常顯示。
- 手機與桌面寬度下排版皆正常無文字遮擋。
- 瀏覽器 Console 無 JavaScript 異常。

---

## 風險導向測試 (Risk-Driven Testing)

涉及資料精確度、存取控制或關鍵演算法之程式碼需實施嚴格測試。各風險領域之測試要求詳見 [測試規範 (Testing Policy)](testing-policy.md)。

---

## 禁止提交自動生成物 (Generated Artifacts)

切勿提交以下生成物或本地暫存檔：
- `node_modules/`
- `dist/`
- `tmp/`
- `*.tsbuildinfo`
- 真實 `.env` 檔案
