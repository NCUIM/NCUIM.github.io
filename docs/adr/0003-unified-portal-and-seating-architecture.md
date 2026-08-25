# ADR-0003: 整合新生指南、抽籤系統與座位地圖之多模組入口架構

## Status

Accepted

## Context

原專案 `NCUIM2026-Fresher` 專注於新生迎新現場的「活動卡片收集（電子名片、掃碼破冰、成就系統）」（見 [Spec 0001](../specs/0001-event-card-collection.md)）。

然而，資管所新生與在校生在日常與開學初期亦面臨以下強烈需求：
1. **研究室抽籤 (Lab Lottery)**：迎新現場的 S 型蛇形相鄰分配與大螢幕開獎動畫。
2. **實體座位表 (Seating Map)**：抽籤結果沉澱後，日常於管二館 209/310/313/919 的查位與認人需求。
3. **新生生活指南與工具 (Guide & Tools)**：全系課表、中大美食地圖、入學 Checklist 與學分試算工具。

如果將這些功能拆散為多個獨立 Web 專案，將導致網址分散、推廣不易、維護成本倍增，且卡片活動結束後網站將失去長效價值。

## Decision

將專案定位升級為 **「NCUIM 新生綜合服務與生活入口平台」**，在同一前端與後端架構下以模組化方式整合所有功能：

1. **路由分流 (Modular Routing)**：
   - `/cards`：原電子名片收集、QR 掃描、成就與排行榜（活動期核心）。
   - `/stage/lottery`：大螢幕專屬之研究室抽籤開獎舞台模式（現場投影）。
   - `/seats`：209/310/313/919 擬真實體格局座位表（抽籤後常態查位）。
   - `/timetable`：全系週課表格狀矩陣與篩選。
   - `/food`：中大周邊美食地圖與「今天吃什麼」隨機轉盤。
   - `/guide`：新生修業指引、Checklist 與學分工具箱。

2. **技術與團隊責任邊界 (Decoupled Ownership)**：
   - **ThanatosJun 負責**：`Spec 0001`（電子名片、QR 掃描、活動身分、成就積分），代碼邊界為 `src/features/cards/`。
   - **Youchen Jiang 負責**：`Spec 0002`（研究室選位抽籤大會、209/310/313/919 實體座位表、全系課表、中大美食地圖、學分試算工具），代碼邊界為 `src/features/seating/`, `src/features/lottery/`, `src/features/guide/` 等。
   - 雙方共用最外層 Design System 與 App Layout，但業務邏輯完全解耦，實現多人開發 0 衝突。


3. **技術一致性**：
   - 沿用 Ionic React + TypeScript + Vite 6，保留極佳的手機端原生操作體驗。
   - 共用全域 Design System（中大資管風格主題、色彩變數、Header/BottomTabs）。
   - 抽籤結果與座位表數據儲存於 Firestore，實現大螢幕開獎、手機端即時連動。


## Consequences

### Positive
- **單一入口宣傳**：迎新、系學會與系辦僅需推廣單一網址/QR Code。
- **流量與生命週期延續**：活動結束後，卡片功能轉入封存/回顧，站點藉由座位表、課表與美食地圖持續保持高黏著度。
- **維護與開發成本低**：共用元件庫、CI/CD 構建與部署流程。

### Negative / Trade-offs
- 需要在行動端 Tab 導覽列與首頁資訊架構（IA）上進行良好的視覺層級設計，避免功能過多導致使用者介面雜亂。
