# NCUIM 2026 新生茶會互動 Web App

這是一套供中央大學資訊管理學系新生在 2026 新生茶會中彼此認識與互動的手機優先 Web App。

目前專案處於需求與規格階段，產品會以手機瀏覽器直接開啟，不上架 App Store 或 Play Store。

[English](README.md)

## 核心原則

- 掃描連結或 QR Code 即可使用，不要求安裝。
- 主要支援目前的 iOS Safari 與 Android Chrome。
- 新生不必註冊永久帳號即可參加活動。
- QR Code 是主要互動方式；NFC URL 標籤只作為輔助捷徑。
- 計分、Flag、兌獎與管理操作必須由伺服器驗證。
- 只蒐集活動真正需要的資料。

## 技術選型

- Ionic React、TypeScript、Vite
- Firebase Authentication
- Cloud Firestore
- Cloud Storage for Firebase
- Firebase Realtime Database（僅在線狀態）
- Cloud Functions
- Firebase Hosting、Security Rules、App Check
- 離線 TypeScript Challenge Station、SQLite 與簽章證明
- 選配的 Python OR-Tools 實驗室分配工具

## 規格文件

英文文件是正式規格來源；繁中版本若未特別聲明，主要用於導覽與溝通。

| 文件 | 責任範圍 |
| --- | --- |
| [產品需求](docs/01-product-requirements.md) | 範圍、角色、流程、優先級與驗收條件 |
| [系統架構](docs/02-system-architecture.md) | 路由、Firebase 邊界、Functions 與部署方式 |
| [資料與安全](docs/03-data-and-security.md) | 資料模型、權限、隱私、圖片、Secret 與防濫用 |
| [互動與獎勵](docs/04-interactions-and-rewards.md) | QR／NFC、Flag 彩蛋、提交與兌獎 |
| [後台與營運](docs/05-admin-and-operations.md) | 工作人員權限、監控、復原、審核與現場流程 |
| [品質與上線](docs/06-quality-and-launch.md) | i18n、無障礙、瀏覽器、測試、效能與上線門檻 |
| [視覺設計](docs/07-visual-design.md) | Pixel Quest 方向、設計 Token、字體、畫面、動畫與必要設計產物 |
| [離線 Challenge Server](docs/08-challenge-server.md) | 獨立站台、簽章票券／證明、離線運作與安全 |
| [分組、排行榜與實驗室抽選](docs/09-grouping-leaderboard-and-lottery.md) | 分組、計分、排名、志願分配與公平性 |
| [假活動設定](docs/examples/event-config.example.json) | 120 名假參加者與四個佔位實驗室的可替換種子資料 |

## 語言規則

- App 至少支援英文 `en` 與繁體中文 `zh-TW`。
- 找不到翻譯時回退英文。
- 使用者可以隨時切換語言，選擇需保存在裝置上。
- 文件預設使用英文；繁中檔名使用 `.zh-TW.md`。

## 目前狀態

尚未建立應用程式 scaffold。實作前應先確認 P0 需求，以及活動日期、人數、獎品數量與工作人員帳號等上線設定。
