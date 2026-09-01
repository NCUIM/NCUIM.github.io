# NCUIM2026-Fresher AI 代理人行為準則 (AI Agent Guidelines)

本文件定義 AI 代理人於本專案進行架構設計、程式撰寫與問題排查的核心行為準則。

---

## 1. 問題排查策略 (Problem-Solving Strategy)

### 核心哲學：**難題求一，得一求全**

遇到問題時，不要急著盲目嘗試解法。先把問題縮到最簡單的形式，看懂它的底層機制，再回來解決原本的問題。

### 準則：
1. **先觀察再動手 (Stop and observe first)**：切勿立即嘗試隨機修改。未理解系統前的不斷試錯是無效的。
2. **細讀錯誤訊息、原始碼與文件**：在動手前徹底理解報錯的原因。
3. **歸納為最小基礎案例 (Normalize to base case)**：找出可被驗證的最小單元，先讓它成功運作，再擴展至全局。
4. **隨時自我反思**：問自己「我是在解決核心問題，還是只是在碰運氣試錯？」

---

## 2. 溝通與授權原則 (Communication Protocol)

### 變更摘要 (Diff Summary)
每次修改程式碼結束前：
- 列出受影響的檔案路徑與變更行數。
- 簡要說明修改目的與驗證結果。

### 提交規範 (Commit & PR Requirements)
- **所有 Git Commit 訊息與 PR 標題一律強制使用英文**，遵循 Conventional Commits 格式（`type(scope): description`）。
- 嚴禁自動執行 `git push`。

---

## 3. 程式碼品質與型別安全 (Code Stability)

- **保留現有架構**：除非使用者明確要求，否則維持既有結構與命名一致性。
- **嚴格型別 (Type Safety)**：TypeScript Strict 模式，禁止無註解的 `any` 型別。
- **零後端純前端原則**：使用者選課與學分資料全數保存於 LocalStorage，避免引入非必要的雲端伺服器相依。

---

## 4. 測試與驗收 (Testing Strategy)

- **高風險邏輯 (學分試算、課表解析、抽籤演算法)**：必須具備完整的 Vitest 單元測試與極端值覆蓋。
- **UI 介面變更**：必須確認桌面版與行動版排版無文字重疊破版，且瀏覽器 Console 無 Error。
- **全套檢查**：變更後執行 `npm run build`、`npm run typecheck`、`npm test` 與 `npm run test:policy`。

