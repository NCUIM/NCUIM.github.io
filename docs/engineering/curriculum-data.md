# 課程資料架構與維護指南 (Course Data Architecture & Maintenance Guide)

本文檔說明 NCUIM2026-Fresher 的碩士班「選課清單 / 必修標籤 / 教室」資料從哪來、怎麼進到 App、以及每學期換季時該怎麼維護。適用範圍：碩士班課表（TimetablePage）、學分試算頁所依賴的 master course list。

---

## 1. 資料來源與設計哲學 (Data Sources & Philosophy)

碩士班課程資訊分散在三個地方，本系統只信任前兩個（CIS 與所辦課表），第三個只是離線備援：

| 來源 | 內容 | 型態 |
| :--- | :--- | :--- |
| **CIS 課務系統**（`cis.ncu.edu.tw` + S3 `all.json` dump） | 每門課的 serialNo、課號、教室、選修別、**分發條件**（誰能修） | 線上動態資料 |
| **所辦課表**（`src/data/im-curriculum.ts`） | 碩一/碩二必修、管必/系必等 **必修事實** | 靜態、手動維護 |
| **bundled fallback**（`src/data/im-master-courses.json`） | 與 snapshot **同源產生**的碩士清單（`allowMaster` 19 門 + CIS 教室 + all.json 教師/時段/人數），**僅網路失敗時**使用；必修 tag 由 runtime facts 補上 | 換季時由工具一起重產生 |

關鍵分層：**「誰能修」與「教室」只能問 CIS；「必修與否」只能問課表**。二者來源不同，因此分開維護、執行期才合併：

```text
scripts/reconcile-curriculum.mjs（定期跑）
  all.json (S3) ─┐
  CIS byKeywords ─┼─> src/data/im-master-snapshot.json   ← CIS-only：eligible + room + courseType
  CIS 分發條件    ─┘

執行期 (runtime)
  src/services/all-courses-api.ts
    live all.json  ──> 以 snapshot 過濾出 master list + 貼上 snapshot 的教室
    im-curriculum.ts ─> 以 REQUIRED_COURSE_FACTS 貼必修標籤 (requiredTag)
```

> 為何 snapshot 不含必修事實？因為 reconcile 工具是純 `.mjs`，CI 跑在 Node 20，無法 import TypeScript 的 `im-curriculum.ts`；把事實複製一份進工具又會造成 drift。所以 snapshot 只存 CIS 能回答的事實，必修事實一律在執行期由 `im-curriculum.ts` 提供（單一事實來源）。

---

## 2. 各檔案職責 (File Responsibilities)

| 檔案 | 職責 | 何時改 |
| :--- | :--- | :--- |
| `src/data/im-curriculum.ts` | `REQUIRED_COURSE_FACTS`（由 COMMON/MGMT/SYS 課程陣列**衍生**，不會 drift）、`getRequiredFact`、`requiredFactLabel` | 課表變更時（**人工**） |
| `src/data/im-master-snapshot.json` | 當期 52 門 IM 系課程的 CIS 事實：`{ serialNo: { classNo, title, credit, room, courseType, allowMaster } }` + `semester` | **由工具產生**，勿手改 |
| `scripts/reconcile-curriculum.mjs` | 抓 CIS → 產出/比對 snapshot（`--check` 給 CI 用） | 工具邏輯變更時 |
| `src/services/all-courses-api.ts` | `fetchImMasterCourses`：抓 live all.json → 用 snapshot 的 `allowMaster` 過濾（**唯一門檻**：snapshot 缺席的課一律排除，不設 5xxx–7xxx 數字區間 fallback，避免博士班/在職專班漏進）→ room 優先取 snapshot、`IM_CLASSROOM_MAP` 只是最後防線 | snapshot 或過濾規則變更時 |
| `.github/workflows/curriculum-drift.yml` | 每週一排程跑 `reconcile-curriculum.mjs --check`，snapshot 與 live CIS 不一致時紅燈 | 很少 |

---

## 3. 必修標籤的規則 (Required Tags)

`getRequiredTag(classNo)` 只查 `REQUIRED_COURSE_FACTS`，**不再**依賴 CIS 的 `courseType`：

* **common（所必修）** → `碩一必修` / `碩二必修`（year 由 一上/一下→碩一、二上/二下→碩二 推導）。
* **mgmt / sys（組必修）** → `管必` / `系必`。CIS 將組必修標成 `ELECTIVE`，所以舊的 `courseType === "REQUIRED"` gate 會把 tag 吞掉 —— 已移除。
* 查無事實的課（選修、博士班 IM7043/44、不在課表的課號）→ 回傳 `null`。

---

## 4. 每學期換季 SOP (Semester Turnover SOP)

開學前（例如 1152 下學期），依序執行：

1. **確認課表**：若所辦課表有增刪（新必修/新組必修），先改 `src/data/im-curriculum.ts`（課程陣列 → facts 自動衍生），並更新 `src/test/curriculum-fact.test.ts`。
2. **重新產生 snapshot**：
   ```bash
   node scripts/reconcile-curriculum.mjs          # 預設 1151
   NCU_SEMESTER=1152 node scripts/reconcile-curriculum.mjs   # 指定新學期
   ```
   工具會抓該學期 IM 系全部課程、逐課解析 分發條件 與 教室，覆寫 `src/data/im-master-snapshot.json` 與 `src/data/im-master-courses.json`（離線 fallback 同源重產生）。
3. **檢視輸出**：確認 master-eligible 清單合理（新課出現、停開的課消失、博士班/在職專班被排除）。
4. **更新測試 fixtures**：`all-courses-api.test.ts` 與 `curriculum-snapshot.test.ts` 使用**真實 serialNo / 課號**鎖定當期資料；換季後若有課程增刪，這些測試會**大聲失敗**——這是刻意設計，逼你重新檢視 snapshot 內容，再依失敗訊息更新 fixture。
5. **驗證並提交**：
   ```bash
   npm run typecheck && npm test
   git add -A && git commit   # 依原子化規則拆 app/test/docs
   ```

### 期中房間或資格異動

若 CIS 在學期中改了教室或分發條件，每週一的 drift workflow 會紅燈並列出每一筆 `changed`，此時重新跑一次產生指令、檢視 diff 後提交即可。

---

## 5. Drift 檢查與 CI (Drift Check & CI)

**離線不變式測試**（隨 `npm test` 跑，不需網路）：
* `src/test/curriculum-snapshot.test.ts` — snapshot 結構、master-eligible 排除博士班(IM7043/IM8xxx)與在職專班(IMA)、CIS-REQUIRED ↔ common fact 雙向一致、每門 master 課都有教室。
* `src/test/all-courses-api.test.ts` — snapshot gating（IM7043 進不來、IM7082 留著）、snapshot 缺席課程一律排除（無 band fallback）、離線 fallback 也套用必修 tag、管必/系必不被 `courseType` gate。

**線上 drift 檢查**（`.github/workflows/curriculum-drift.yml`，每週一 01:00 UTC + 可手動觸發）：
```bash
node scripts/reconcile-curriculum.mjs --check
```
比對 live CIS 與 committed snapshot（`generatedAt` 忽略），不一致時印出每筆 new/dropped/changed 並 **exit 1**。查詢學期解析順序：`NCU_SEMESTER` env → committed snapshot 的 `semester` → 預設 `1151`，所以換季後 snapshot 一更新，CI 自動改查新學期。

---

## 6. 已知限制 (Known Limitations)

* **離線 fallback 即時性**：`im-master-courses.json` 與 snapshot 同源產生（19 門、含管理溝通，tag 由 runtime 補上）；教師/人數為產生當下快照，非 live——可接受（離線時本來就拿不到 live 人數/教師）。
* **教室預設值**：`IM_CLASSROOM_MAP` 是手寫 legacy map，已對齊 1151 CIS；新課若 snapshot 缺教室會 fallback 到 `getCourseRoom`（最後回傳 `I1-404`）。教室真值一律以 snapshot（CIS）為準。
* **換季時效**：App 不會主動警告「snapshot 學期 ≠ 現在學期」；靠 drift CI + SOP 第 2 步換新 snapshot。
* **新課延遲上架**：學期中 CIS 新開的課在 snapshot 重新產生前不會出現在碩士清單（snapshot 為唯一門檻）；每週一 drift workflow 會列出 new course 提醒更新。
