# NCUIM2026-Fresher

一個以手機瀏覽器為主要載體的活動互動網頁：參與者在活動現場透過掃描 QR Code 收集彼此的卡片，並可查看該場活動的公告。

本專案目前處於規格階段，尚無應用程式 scaffold。實作應在 P0 需求被接受後開始。

[繁體中文說明](README.zh-TW.md)

## 產品原則

- 掃描連結或 QR Code 即可使用，不要求安裝。
- 主要支援目前的 iOS Safari 與 Android Chrome。
- 新生不必註冊永久帳號即可參加活動。
- QR Code 是主要互動方式。
- 計分與管理操作必須由伺服器驗證。
- 只蒐集活動真正需要的資料。

## 技術棧（暫定，待 ADR 確認）

- Ionic React、TypeScript、Vite
- Firebase Authentication
- Cloud Firestore
- Cloud Storage for Firebase
- Cloud Functions
- Firebase Hosting、Security Rules、App Check

> 技術棧尚未正式記錄為 ADR，實作前應確認並補建 ADR。

## 規格文件

以中文規格為主要來源。相關決策記錄於 ADR。

| 文件 | 責任範圍 |
| --- | --- |
| [CONTEXT.md](CONTEXT.md) | 領域術語辭典：所有規格文件的詞彙基準 |
| [活動卡片收集系統](docs/specs/0001-event-card-collection.md) | 完整產品規格：使用者故事、實作決策、測試策略 |
| [ADR-0001](docs/adr/0001-per-event-identity-without-accounts.md) | 身分繫於單場活動，不建立帳號系統 |
| [ADR-0002](docs/adr/0002-achievements-are-never-revoked.md) | 已達成的 Achievement 永不撤銷 |

## 規模

單場活動約七十人，每組五至八人。沒有效能或擴展性顧慮。

## 語言規則

- 文件預設使用繁體中文；英文文件使用 `.en.md` 後綴。
- App 至少支援英文 `en` 與繁體中文 `zh-TW`。
- 找不到翻譯時回退英文。

## 倉庫狀態

No application scaffold has been generated yet. Implementation should begin only after the P0 requirements in the spec are accepted.
