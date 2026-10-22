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

### 3. 嚴格原子化 Commit 與暫存紀律 (Strict Atomic Staging & Commits)
- **領域隔離 (Domain Isolation)**：跨子系統（如 `scripts/` 工具、`src/` 核心邏輯、`docs/` 文件）之變更絕不打包進同一個 Commit。
- **精確暫存 (Strict Staging)**：**嚴格禁止大量暫存 (`git add -A` 或 `git add .`)**。一律明確指定具體檔案路徑進行暫存（例如 `git add src/test/setup.ts`）。
- **可還原獨立性 (Revert Independence)**：每一次 Commit 僅能代表一個獨立邏輯變更，確保單一 Commit 具備獨立可 Revert 特性。

### 4. 分支範疇與命名規範 (Branch Scope & Naming Discipline)
- **單一焦點規則 (Single Scope Rule)**：每個分支僅能處理單一特定功能或問題。若任務涉及多個主題，必須拆分多個 PR。
- **禁止複合後綴 (No Compound Suffixes)**：禁止以連字號無限制拼接複合主題。
- **嚴格單詞與長度限制 (Strict Word & Length Limits)**：
  - 分支後綴僅能包含 **2 到 3 個英文單詞**。
  - 分支後綴長度 **不得超過 25 個字元**（例如 `feat/pr-tool` 為 7 字元、`refactor/cis-sync` 為 8 字元）。
- **事前宣告協議 (Pre-Branch Agreement)**：建立或推送任何新分支前，**必須向使用者明確宣告擬定之分支名稱與後綴字元數**，取得明確授權後方可建立。

### 5. PR 生命週期紅線與意圖嚴格解讀 (PR Lifecycle Red Line)
- **嚴格意圖解讀 (Strict Intent Interpretation)**：使用者的「修」、「改」、「處理」等指令，**嚴格限定為修改本地程式碼並提交修復**。嚴禁擅自解讀為關閉 PR、放棄分支或重開新分支。
- **嚴禁自主關閉或放棄 PR (Never Autonomously Close/Abandon PRs)**：現有 PR 除非使用者在該輪對話中逐字明確要求（例如「關閉 PR」、「放棄此分支」），否則**絕對嚴禁自主執行 `gh pr close` 或拋棄分支**。所有 CI 失敗、靜態分析警告或 Review 回饋一律在原分支追加原子化 Commit 修復。
- **外部變更指令零容忍 (Zero-Tolerance for Unauthorized PR Mutation)**：嚴禁未經逐一獨立授權逕自執行 `gh pr close`、`gh pr edit`、`gh pr merge`、`git push --delete`、`git push --force`。

### 6. PR 審查安全與討論串關閉守則 (Review Thread Safety & Closure Protocol)
- **禁止自主留言**：嚴禁自主在 GitHub PR 留言區發表、回覆、編輯或刪除 Review 評論。
- **討論串關閉程序 (Review Thread Closure Protocol)**：修復完畢且 CI 全數通過後，主動且具體列出所有尚未解決的 Review Thread ID 與對應修復 Commit SHA，並**明確向使用者請求 Resolve 授權**後方可關閉，或由使用者自行在 GitHub 介面關閉。

### 7. Commit 訊息格式強制全英文 (Commit Message Format)
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

### 8. 專用工作流工具 (Workflow Automation Tool)
- 統一以 `node scripts/pr-tool.mjs` 作為本地驗證、PR 建立與審查輔助之標準工具，避免手動組合 Shell 命令造成 Markdown 模板破版或參數遺漏。

### 9. 使用者拒絕或撤回 = 立即中止 (User Revocation = Immediate Stop)
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
