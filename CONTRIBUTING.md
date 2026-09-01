# 專案貢獻指南 (Contributing Guide)

感謝您對 CIM-Life (中央資管通) 的貢獻！為維持程式庫之高品質與可維護性，本專案採用嚴格的 Commit 與 Pull Request 規範。

---

## 分支規範 (Branch Rules)

- `main` 分支必須隨時保持可部署狀態。
- 嚴禁直接 Push 至 `main` 分支。
- 依任務類型從 `main` 切出短期分支：
  - `feature/<short-name>`：新功能開發
  - `fix/<short-name>`：Bug 修復
  - `docs/<short-name>`：文件撰寫與維護
  - `style/<short-name>`：UI 樣式與排版調整
  - `chore/<short-name>`：相依套件與工程維護
- 若分支過期，發起 PR 前請先針對 `main` 進行 Rebase。

---

## 提交訊息格式 (Commit Format)

> ⚠️ **重要**：雖然專案文件以繁體中文撰寫，但 **所有 Commit 訊息與 PR 標題必須使用英文**，並嚴格遵循 [Commit 與 PR 規範](docs/engineering/commit-policy.md)。

格式範例：
```text
feat(timetable): add smart merged multi-section course card
```

允許的 Type、Scope、字數限制與 Body 編號清單格式皆唯一定義於規範文件與 `scripts/commit-policy.mjs`。

---

## 原子化 Commit 原則 (Atomic Commits)

每次 Commit 僅能代表一個獨立邏輯變更：
- 分離無關功能的修改。
- 分離 Refactor 重構與功能行為變更。
- 檔案重新命名或移動一律使用 `git mv` 以保留 Git 歷史。

---

## Pull Request 流程

- PR 標題遵守與 Commit 相同之英文格式。
- 請使用 [`.github/pull_request_template.md`](.github/pull_request_template.md) 提供的範本填寫 PR 描述與驗證結果。
- 發起 PR 前請確保本地執行 `npm test`、`npm run typecheck`、`npm run test:policy` 與 `npm run test:docs` 通過。

---

## 隱私與資安防護

- 嚴禁提交真實學生個資、真實選課私密資料或任何 API 憑證。
- 測試資料與 Mock Fixture 必須全面使用去識別化之合成資料。

