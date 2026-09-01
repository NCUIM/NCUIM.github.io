# AI 代理人操作授權與行為準則 (AI Agent Guidelines & Authorization Gate)

本文件為所有於本專案執行的 AI 代理人（Agent）之**強制首讀與唯一權威規範**。

---

## 🚦 工具呼叫前之動作分級 (Action Classification)

在進行任何工具呼叫前，必須將動作嚴格歸類為以下三個層級：

1. **唯讀操作 (Read-only)**：
   - 檢視檔案、Git 狀態與歷史紀錄、測試結果、CI 狀態或外部公開狀態。
   - *權限*：**預設允許**。
2. **本地端修改 (Local edit)**：
   - 僅在使用者明確指示下建立或修改檔案。
   - *權限*：允許於本次任務範圍內修改。**不代表擁有 Commit、Push 或發布之授權**。
3. **外部變更與 Git 提交 (External mutation / Git commits)**：
   - 任何分支操作、Commit 提交、Push/Force-Push、標籤修改、PR 建立/合併或 Workflow 觸發。
   - *權限*：**必須取得使用者在該輪對話中的明確授權**。

---

## 🛡️ 核心不可變規則 (Non-Negotiable Rules)

### 1. 授權不可傳遞 (Authorization Non-Transitivity)
任務 A 的授權絕不延伸至任務 B。在執行具不可逆性的狀態變更前，一律先回報驗證結果並等待確認。

### 2. 嚴禁自主 Push (No Autonomous Push)
**嚴禁自主執行 `git push`**。預設僅進行本地 Commit。唯有使用者明確要求 Push 時方可執行。

### 3. 嚴格原子化 Commit (Strict Atomic Commits)
每一次 Commit 僅能代表一個獨立邏輯變更。無關修改必須分開提交。

### 4. Commit 訊息格式強制全英文 (Commit Message Format)
所有 Commit 訊息一律遵循 Conventional Commits 格式，且**必須全英文書寫**：

```text
<type>(<scope>): <short description>

1. <Numbered detail 1 in English>
2. <Numbered detail 2 in English>
```

- **Header**：不得超過 72 字元，結尾不得有句號。
- **Allowed Types**：`feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`, `security`
- **Allowed Scopes**：`app`, `auth`, `firestore`, `functions`, `hosting`, `rules`, `ui`, `challenge`, `admin`, `i18n`, `ci`, `deps`, `docs`, `test`, `security`, `spec`, `schema`, `offline`, `qr`, `lottery`, `leaderboard`, `grouping`, `privacy`, `workflow`, `quality`, `setup`, `style`
- **Body**：必須為以 `1. ` 開始的英文數字編號清單。

### 5. 使用者拒絕或撤回 = 立即中止 (User Revocation = Immediate Stop)
若使用者表達拒絕或撤回指令，立即停止一切變更操作。

---

## 🧠 問題排查策略 (Problem-Solving Strategy)

### 核心哲學：**難題求一，得一求全**
遇到複雜問題或測試失敗時，不要盲目嘗試解法。先把問題縮小到最簡單的最小單元，釐清底層運作機制後，再回頭解決全局問題。

### 執行準則：
1. **先觀察再動手 (Stop and observe first)**：切勿隨意修改。動手前必須理解錯誤訊息、原始碼與相關文件。
2. **歸納為最小基礎案例 (Normalize to base case)**：找出可被驗證的最小單元，先讓它成功運作，再擴展至全局。
3. **隨時自我反思**：問自己「我是在解決核心問題，還是只是在試錯？」。

---

## 📐 領域知識與架構指引 (Domain & Technical Context)

在探索與修改本專案程式碼前，請依照以下指引閱讀領域文件：
1. **`CONTEXT.md`**（專案根目錄）：領域術語辭典，定義課表、學分、研究室、抽籤等專用名詞。在命名變數、檔案、測試或 Issue 時，請務必遵循此定義。
2. **`docs/adr/`**：架構決策紀錄（ADR），記載純前端 SPA 架構與各項技術選型。
3. **`docs/specs/`**：產品功能規格書（如 `0002-freshman-survival-guide.md`）。
4. **技術環境**：
   - **Ionic React 8 + React 18 + TypeScript (Strict 模式) + Vite 6**
   - **GitHub Pages 靜態發布**
   - **零後端純前端原則**：使用者選課與學分資料全數保存於 LocalStorage。

---

## 📋 協作與標籤規範 (Issue & Triage Vocabulary)

專案 Issue 採用以下標準標籤體系，請勿自創或重新命名標籤：
- `needs-triage`：新建立尚未經人工或 Agent 審閱的 Issue。
- `needs-info`：需求描述不清、缺少重現步驟或需要發起者補充資訊。
- `ready-for-agent`：需求明確、規格完整，可由 AI 代理人獨立承接執行。
- `ready-for-human`：涉及主觀設計決策、架構重大調整或需人工審查。
- `wontfix`：經評估後不予處理或超出專案範圍之項目。


