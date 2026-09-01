# Commit 與 PR 規範 (Commit and PR Policy)

## 狀態 (Status)

**已啟用並強制執行。** 本文件為本專案 Commit 訊息與 Pull Request 規範的說明。所有檢驗規則皆唯一定義於 `scripts/commit-policy.mjs`。

> ⚠️ **重要原則**：儘管本專案文件以繁體中文維護，**所有 Git Commit 訊息、Subject 標題、Body 內容與 GitHub PR 標題，均一律強制要求使用英文書寫**，以利 CI 自動化檢驗與跨工具鏈分析。

## 單一事實來源 (Single Source of Truth)

所有強制執行的規則皆定義於 **`scripts/commit-policy.mjs` 單一檔案**。

本地端的 Git Hook 與 GitHub Actions CI 皆直接執行該檔案，保證本機與雲端檢驗完全一致：

| 檢驗關卡 | 執行檔案 | 觸發時機與行為 |
| --- | --- | --- |
| **本機提示 (Advisory)** | `scripts/hooks/pre-commit` | 於 `git add` 後提示合適的 scope；**不阻擋 Commit** |
| **本機攔截 (Hard Gate)** | `scripts/hooks/commit-msg` | 每次執行 `git commit` 時即時檢驗；**不符規範則阻擋提交** |
| **CI 雲端檢查** | `.github/workflows/policy.yml` | 每次發起或更新 PR 時，檢驗 PR 標題與所有 Commit 訊息 |

---

## 核心規範 (The Rules)

### 1. Subject 標題格式 (Subject Format)

每一筆 Commit Subject 與 PR 標題必須符合以下格式：

```text
<type>(<scope>): <description>
```

- **必須指定 scope**，且必須屬於下方允許的清單。
- Subject 總長度 **最多 72 字元 (at most 72 characters)**。
- 描述開頭必須為 **小寫英文字母或數字**。
- 結尾 **不可有句號 (.)**。
- 禁止使用模糊描述：如 `update`, `misc`, `stuff`, `changes`, `fix bug`, `bug fix`。
- **必須全英文書寫 (written in English)**。

### 2. 允許的 Type (Allowed Types)

`feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`, `security`

### 3. 允許的 Scope (Allowed Scopes)

`app`, `auth`, `firestore`, `functions`, `hosting`, `rules`, `ui`, `challenge`,
`admin`, `i18n`, `ci`, `deps`, `docs`, `test`, `security`, `spec`, `schema`,
`offline`, `qr`, `lottery`, `leaderboard`, `grouping`, `privacy`, `workflow`,
`quality`, `setup`, `style`

### 4. Body 內容格式 (Body Format)

Commit 的 Body 內容必須包含 **英文數字編號清單 (numbered list in English)**，第一項由 `1. ` 或 `1)` 開始：

```text
feat(timetable): add smart merged multi-section course card

1. Merge identical courses in the same time slot into a unified card.
2. Render separate professor and classroom badges with enrolled underline.
```

### 5. PR 標題規範 (PR Title)

Pull Request 標題與 Commit Subject 遵守完全相同的格式與長度規則。

---

## 如何修改規範

1. 僅需修改 `scripts/commit-policy.mjs` —— 這是全專案規則的唯一來源。
2. 執行 `npm run test:policy` 進行內建自我測試。
3. 提交符合規範的 Commit（如 `chore(ci): extend allowed commit scopes`）。
4. 同步更新本文件。

