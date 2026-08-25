# NCUIM2026-Fresher

NCUIM 新生綜合服務與生活入口平台：以手機瀏覽器為主要載體，整合迎新活動互動、研究室選位、校園生活資訊於單一入口。

[English](README.md)

## 模組總覽

| 模組 | 路由 | 說明 | 負責人 |
| --- | --- | --- | --- |
| [活動卡片收集](docs/specs/0001-event-card-collection.md) | `/cards` | QR 掃碼互換、Profile 卡片、成就與排行榜 | ThanatosJun |
| [新生生存指南](docs/specs/0002-freshman-survival-guide.md) | `/guide`, `/seats`, `/stage/lottery`, `/timetable`, `/food`, `/tools/credit` | 抽籤大會、座位表、課表、美食地圖、學分試算 | Youchen Jiang |

## 產品原則

- 掃描連結或 QR Code 即可使用，不要求安裝。
- 主要支援目前的 iOS Safari 與 Android Chrome。
- 新生不必註冊永久帳號即可參加活動。
- QR Code 是主要互動方式。
- 計分與管理操作必須由伺服器驗證。
- 只蒐集活動真正需要的資料。

## 技術棧（暫定）

- Ionic React、TypeScript、Vite
- Firebase Authentication
- Cloud Firestore
- Cloud Storage for Firebase
- Cloud Functions
- Firebase Hosting、Security Rules、App Check

## 規格文件

以中文規格為主要來源。相關決策記錄於 ADR。

| 文件 | 說明 |
| --- | --- |
| [CONTEXT.md](CONTEXT.md) | 領域術語辭典：所有規格文件的詞彙基準 |
| [Spec 0001](docs/specs/0001-event-card-collection.md) | 活動卡片收集系統完整產品規格 |
| [Spec 0002](docs/specs/0002-freshman-survival-guide.md) | 新生生存指南與生活工具箱系統規格 |
| [ADR-0001](docs/adr/0001-per-event-identity-without-accounts.md) | 身分繫於單場活動，不建立帳號系統 |
| [ADR-0002](docs/adr/0002-achievements-are-never-revoked.md) | 已達成的 Achievement 永不撤銷 |
| [ADR-0003](docs/adr/0003-unified-portal-and-seating-architecture.md) | 整合多模組入口架構決策 |

## 規模

單場活動約七十人，每組五至八人。沒有效能或擴展性顧慮。

## 語言規則

- 文件預設使用繁體中文；英文文件使用 `.en.md` 後綴。
- App 至少支援英文 `en` 與繁體中文 `zh-TW`。
- 找不到翻譯時回退英文。
