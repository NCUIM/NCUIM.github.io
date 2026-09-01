# PR 審查檢核表 (PR Review Checklist)

使用本檢核表進行聚焦且高效率的 Code Review，確保資料正確性、使用者介面品質與架構健全。

---

## 審查範圍 (Review Scope)

每一個 Pull Request (PR) 應說明：
- 解決了什麼使用者或工程問題。
- 實作了哪一份規格或需求。
- 本 PR 的涵蓋檔案範圍與排除範圍。
- 如何進行驗證（附上測試結果）。

> ⚠️ **提交語言規範**：PR 標題與 Commit 訊息一律強制使用英文撰寫。

---

## 全域基礎檢核 (Required Checks For All PRs)

- 分支專注於單一目標（符合原子化原則）。
- 未暫存任何自動生成物或 `.env` 檔案。
- 新增相依套件具備充分合理性。
- 使用者介面文字繁體中文語意通順、清晰一致。
- 所有 Markdown 文件連結皆有效。
- 前一輪 Review 的討論已全數解決。

---

## 業務邏輯與資料檢核 (Business Logic & Data)

- 學分試算邏輯符合中央資管修業規章。
- CIS 書籤解析腳本具備充分的例外處理（如 undefined 或格式異動）。
- 多班合開課程合併演算法能正確配對教師與教室。
- 抽籤演算法保證同組相鄰不拆散。

---

## UI 介面與無障礙檢核 (UI & Accessibility)

- `npm run build` 通過。
- 瀏覽器冒煙測試通過（Desktop 與 Mobile 皆無破版或文字重疊）。
- 瀏覽器 Console 無任何 Error 或嚴重 Warning。
- 按鈕與圖標具備 `aria-label` 或無障礙名稱。
- 空資料狀態（Empty State）顯示清楚的提示文字。

---

## 測試驗證要求 (Test Expectations)

各變更領域所需之具體驗收證據詳見 [測試規範 (Testing Policy)](testing-policy.md)。

---

## 何時應阻擋 PR (When To Block A PR)

出現以下情況時必須阻擋合併：
- 隱私資料外洩或存在安全漏洞。
- 學分計算或課表資料存在靜默遺失/算錯風險。
- 高風險變更缺少單元測試驗證。
- CI 自動化檢驗（`test:docs`、`test:policy`、`typecheck`、`test`）未全數通過。

---

## 建議 Review 提示詞 (Suggested Review Prompt)

```text
Please review only the changed files and the linked spec.
Focus on whether the PR satisfies the spec, preserves privacy and data correctness,
has no UI overlap at mobile/desktop widths, and includes adequate test evidence.
Please avoid proposing new product scope unless it blocks the current behavior.
```

