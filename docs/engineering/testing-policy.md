# 測試規範 (Testing Policy)

本文件定義各模組與變更領域所需的測試驗證標準。本文件為全專案測試期望的**單一事實來源**。

---

## 風險領域定義 (Risk Areas)

| 領域 | 包含模組與範圍 | 風險等級 |
| :--- | :--- | :--- |
| **學分計算 (Credit)** | 碩士畢業學分試算、必選修門檻統計、抵免學分邏輯 | High |
| **課表與同步 (Timetable)** | CIS 課程解析、雙人合開課程合併、時段矩陣計算 | High |
| **抽籤演算法 (Lottery)** | S型蛇形相鄰分配、房間容量約束求解 | High |
| **UI 介面與排版 (UI)** | 響應式佈局（電腦與手機端）、文字排版、座位平面圖 | Medium |
| **指南與公告 (Guide)** | 新生待辦 Checklist、美食推薦、公告彈窗 | Low |
| **建置與設定 (Config)** | Vite 設定、TypeScript 設定、CI/CD 腳本 | Low |

---

## 各風險層級之驗收要求 (Required Evidence)

### 高風險領域 (High Risk: Credit, Timetable, Lottery)
- 業務邏輯與邊界案例需有完整的單元測試覆蓋（Vitest）。
- 空資料（Empty State）、無效輸入與極端情境驗證。
- TypeScript 嚴格型別檢查 (`npm run typecheck`) 100% 通過。

### 中風險領域 (Medium Risk: UI & Layout)
- 視覺冒煙測試（確認 Desktop 與 Mobile 寬度下皆無破版或重疊文字）。
- 瀏覽器 Console 無任何 JavaScript 異常或 Warning。
- 生產環境建置 (`npm run build`) 成功。

### 低風險領域 (Low Risk: Guide, Config)
- `npm run build` 與 `npm run typecheck` 通過。
- 手動驗證修改之功能與行為。

---

## 測試指令一覽 (Test Commands)

```sh
npm run typecheck    # TypeScript 嚴格型別檢查
npm run build        # 生產環境 Bundle 建置
npm test             # 單元測試 (Vitest)
npm run test:policy  # Commit 規範與 PR 標題自我檢查
npm run test:docs    # 文件完整性與連結有效性檢查
npm run test:zap     # OWASP ZAP 靜態安全掃描 (需 Docker)
```

---

## 自動化安全掃描 (Security Scanning)

每週一由 GitHub Actions 自動執行 OWASP ZAP Baseline 安全掃描（`.github/workflows/zap-scan.yml`），檢驗 HTTP 安全標頭、Cookie 政策與敏感資訊洩漏防護。亦可於本地端手動執行：

```sh
npm run test:zap
```

