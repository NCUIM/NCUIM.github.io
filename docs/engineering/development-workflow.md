# 開發與協作工作流程 (Development Workflow)

本專案採用輕量敏捷交付與風險導向測試策略。所有工作皆以小型 Pull Request (PR) 針對 `main` 分支進行交付，不維護長期存在的 `dev` 分支。

---

## 分支流程 (Branch Flow)

1. 自最新的 `main` 分支切出。
2. 建立具備簡潔名稱的短期分支：
   - `feature/<short-name>`：新功能開發
   - `fix/<short-name>`：Bug 修復
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
