# Issue 追蹤與管理 (GitHub Issue Tracker)

本專案使用 GitHub Issues 與 GitHub CLI (`gh`) 進行問題追蹤與任務管理。

---

## 常用 GitHub CLI 操作指令

- **建立 Issue**：`gh issue create --title "..." --body "..."`
- **檢視 Issue**：`gh issue view <number> --comments`
- **列出開放中 Issue**：`gh issue list --state open`
- **新增留言**：`gh issue comment <number> --body "..."`
- **新增 / 移除標籤**：`gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **關閉 Issue**：`gh issue close <number> --comment "..."`

