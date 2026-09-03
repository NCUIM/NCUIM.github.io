# 公告發布與維護作業手冊 (Announcements Workflow)

本文檔說明 NCUIM2026-Fresher（中央資管通）公告發布系統之運作機制、發布流程、修改方式與下架封存作業標準程序（SOP）。

---

## 🏗️ 系統架構與運作原理

資管通採用 **無後端（Serverless）GitOps 公告發布架構**：

* **資料來源**：直接讀取專案的 GitHub Issues（標籤為 `announcement` 且狀態為 `open` 之貼文）。
* **快取與同步機制**：前端採用 SWR（Stale-While-Revalidate）本機 LocalStorage 快取（TTL 為 60 秒），兼顧 API 請求防護與近即時更新。
* **發布權限**：具備本 Repository 存取權限之系學會幹部、所代或專案管理員皆可直接發布。

---

## 📢 發布新公告 (Publishing)

1. 前往專案的 **[GitHub Issues](https://github.com/NCUIM/NCUIM.github.io/issues)** 頁面。
2. 點擊綠色的 **"New issue"** 按鈕。
3. 選擇 **「📢 發布資管通公告 (Announcement)」** 表單。
4. 填寫以下欄位：
   * **標題 (Title)**：輸入公告主標題（例如：`115學年度第1學期新生選課注意事項`）。
   * **公告類別 (Category)**：
     * 📚 `選課與學分 (category:course)`
     * 🎪 `迎新與活動 (category:event)`
     * 🏛️ `系所與行政 (category:department)`
     * 💼 `獎助與職涯 (category:career)`
     * 🛠️ `系統與維護 (category:system)`
     * 📢 `一般公告 (category:general)`
   * **重要程度 (Priority)**：
     * 🚨 `緊急置頂 (priority:urgent)`：紅色高亮標籤，強制置頂於首頁跑馬燈。
     * 🔴 `重要提醒 (priority:high)`：橘色標籤，次高優先級。
     * 🟡 `一般通知 (priority:normal)`：藍色標籤，標準排序。
     * 🟢 `參考資訊 (priority:low)`：灰色標籤，一般參考消息。
   * **發布單位與署名 (Author & Role)**：格式為 `單位/職稱 · 姓名`（例如：`資管所所代 · 阿駿`、`系辦公室`、`迎新活動籌備組`）。
   * **公告內文 (Content)**：支援完整 Markdown 語法（段落、粗體、列表、分行），並支援安全插入圖片（`![圖說](https://...)`）。可直接拖曳或剪貼簿貼上多張圖片，系統將自動解析為自適應圖片並支援點擊查看高解析原圖。
   * **相關連結 (Action URL，選填)**：若有外部表單（如 Google 表單報名、系網 PDF 或學校系統），填入完整網址 `https://...`；若無外部動作則留空。
5. 點擊 **"Submit new issue"**，系統將在 60 秒內自動讀取並上架。

---

## ✏️ 編輯既有公告 (Editing)

因 GitHub 平台機制限制，已送出的 Issue 在點擊 **Edit** 進入二次編輯時，會以標準 Markdown 文字框呈現：

* **修改內文或署名**：直接在編輯框中修改文字即可。
* **修改分類或優先級**：
  * 直接修改文字（例如將 `priority:normal` 改為 `priority:urgent`），或於右側欄位 **Labels** 勾選對應標籤。
* **新增／移除外部動作連結**：
  * **新增連結**：在內文末端新增 `### 相關連結 (Action URL)` 並換行填寫 `https://...`。
  * **移除連結**：直接將 `### 相關連結 (Action URL)` 整段包含網址刪除，儲存後首頁的「開啟相關連結 ↗」按鈕將自動消失。

---

## 📦 下架與封存公告 (Unpublishing & Archiving)

當公告活動截止、選課時效已過或需要撤下時：

1. 開啟該則 Issue。
2. 滑動至頁面最底部，點擊 **"Close issue"**。
3. **效果**：
   * 系統僅會撈取 `state=open` 的公告，關閉後公告將在 60 秒內自動自首頁與最新消息清單隱藏。
   * Issue 歷史討論與修改紀錄將完整留存於 GitHub，未來若需重新發布只需點擊 **"Reopen issue"** 即可。

---

## 🔗 相關工程文件

* [開發與協作工作流程 (Development Workflow)](development-workflow.md)
* [Conventional Commits 規範 (Commit Policy)](commit-policy.md)
* [測試策略與規範 (Testing Policy)](testing-policy.md)
