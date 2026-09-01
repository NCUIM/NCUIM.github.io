# AI 代理人操作授權與行為準則 (Agent Authorization Gate)

本文件為所有於本專案執行的 AI 代理人（Agent）之**強制首讀規範**。

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
- **Allowed Scopes**：`app`, `auth`, `firestore`, `functions`, `hosting`, `rules`, `ui`, `admin`, `i18n`, `ci`, `deps`, `docs`, `test`, `security`, `spec`, `schema`, `offline`, `qr`, `lottery`, `leaderboard`, `grouping`, `privacy`, `workflow`, `quality`
- **Body**：必須為以 `1. ` 開始的英文數字編號清單。

### 5. 使用者拒絕或撤回 = 立即中止 (User Revocation = Immediate Stop)
若使用者表達拒絕或撤回指令，立即停止一切變更操作。

---

## 📐 技術環境 (Technical Context)

本專案為 **行動優先之純靜態 Web 應用（SPA）**，技術棧：
- **Ionic React 8 + React 18 + TypeScript + Vite 6**
- **GitHub Pages 靜態發佈**
- **無後端資料庫 / LocalStorage 本機保存**

