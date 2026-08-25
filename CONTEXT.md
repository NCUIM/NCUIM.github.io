# NCUIM2026-Fresher

一個以手機瀏覽器為主要載體的活動互動網頁：參與者在活動現場透過掃描 QR Code 收集彼此的卡片，並可查看該場活動的公告。

## Language

### 活動與參與

**Event（活動）**:
一場有明確起訖時間的實體活動。是所有身分與收集行為的邊界：一場 Event 中建立的身分與收集紀錄不會延續到另一場 Event。
> **避免用詞：** Session, 場次

**Archive（封存）**:
Event 結束時的狀態轉換：收集功能自此關閉，但 Participant 與 Admin 仍可查看該場 Event 已產生的 Profile 與 Collection。封存不等於刪除。
> **避免用詞：** 結束, 關閉, 刪除

**Participant（參與者）**:
在單一 Event 中參與收集的人。身分繫於該場 Event，不跨 Event 延續；Event 封存後身分依然可用於查看該場收集成果，但無法再進行收集。
> **避免用詞：** User, 會員, 帳號

**Role（身分）**:
Participant 在 Event 中的類別，於報到時由所掃描的 Entry Code 決定，之後不再變動。目前分為一般參與者與工作人員，工作人員不計入 Leaderboard。
> **避免用詞：** 權限, 角色, 分組

**Entry Code（註冊碼）**:
Event 層級的 QR Code，掃描後建立一個新的 Participant 身分。同一場 Event 可有多組 Entry Code，各自對應不同的 Role。與 Personal Code 是完全不同的東西。
> **避免用詞：** 活動 QR, Session QR

**Admin（管理員）**:
管理 Event 並監看其中所有 Participant 活動狀況的人。與 Participant 是不同種類的角色，並非權限較高的 Participant。
> **避免用詞：** 主辦方, Staff

### 收集

**Profile（個人資料）**:
一位 Participant 在某場 Event 中對外呈現的自我描述：頭像、暱稱、一則 https 社群連結、三個個性化圖示，以及一句話自我介紹。因身分不跨 Event，Profile 亦不跨 Event 延續。
> **避免用詞：** 個人檔案, 名片資料

**Card（卡片）**:
一位 Participant 的 Profile 對外呈現的形式。Card **即時反映 Profile 的最新狀態，不是收集當下的快照**——因此使用者的修正與 Admin 的違規內容移除，會立即反映給所有持有該 Card 的人。Card 本身不具備獨立於 Profile 之外的欄位（如稀有度或卡面樣式）。
> **避免用詞：** 名片, 好友, 快照

**Personal Code（個人碼）**:
Participant 層級的 QR Code，代表這個人本身，供他人掃描以建立 Collection。是公開的，不可用於登入或找回身分。與 Entry Code 是完全不同的東西。
> **避免用詞：** 個人 QR, 名片碼

**Scan（掃描）**:
一位 Participant 主動掃描另一位 Participant Personal Code 的動作。一次 Scan 會同時促成雙方的 Collection，但 Scan 本身只歸屬於**發起的那一方**，是衡量主動程度的唯一依據。
> **避免用詞：** 收集, 加好友

**Collection（收集紀錄）**:
一筆「某位 Participant 在某場 Event 中持有某張 Card」的紀錄。一次 Scan 會**同時**為掃描雙方各建立一筆 Collection，因此持有關係是對稱的；誰主動發起則記錄在 Scan 而非 Collection。同一位 Participant 在單一 Event 內的所有 Collection 構成他的收集清單。
> **避免用詞：** 好友清單, 通訊錄

**Announcement（公告）**:
由 Admin 發布、於單一 Event 內對所有 Participant 顯示的活動訊息。
> **避免用詞：** 通知, 訊息

### 遊戲化

**Team（組別）**:
Admin 在單一 Event 內編排的 Participant 分組。與 Role 不同，Team 不由 Entry Code 決定，而是由系統於報到時自動輪流指派、或由 Admin 事後批次編排，且 Admin 可隨時手動調整。用途是作為 Achievement 的判定依據，並顯示於 Card 上。
> **避免用詞：** 小隊, 隊伍, 群組

**Achievement（成就）**:
由 Admin 為單一 Event 設定的目標，Participant 達成後獲得分數。成就的條件與分值逐場設定，不同 Event 可以完全不同。每個 Achievement 可設為公開或隱藏：公開者顯示名稱與進度，隱藏者在達成前僅顯示為「隱藏成就」，不透露條件也不顯示進度。
> **避免用詞：** 任務, 徽章, 關卡

**Score（分數）**:
一位 Participant 在單一 Event 中累積的總分，由「每次 Scan 的基礎分」與「達成 Achievement 的獎勵分」相加而成。兩者的分值皆由 Admin 逐場設定。
> **避免用詞：** 點數, 積分, 經驗值

**Leaderboard（排行榜）**:
單一 Event 內依 Score 排序的 Participant 名次，對 Participant 可見。排序依據是 Score，不是 Collection 或 Scan 的數量。僅有個人排名，不設團體排名——Team 只影響 Achievement 的達成與否。
> **避免用詞：** 排名表, 榜單

### 研究室與選位抽籤

**Lab Room（研究室）**:
管二館內供研究生使用的實體研究空間，目前包含 209（20席）、310（27席）、313（23席）、919（9席）共四間，各自具備固定的實體格局與障礙物配置（如印表機區、牆柱、走道）。
> **避免用詞：** 實驗室房間, 教室

**Seat（座位）**:
單一 Lab Room 內具備特定編號（如 1-1, 6-2）之物理座位，具備固定之座標與蛇形走位索引。
> **避免用詞：** 位置, 桌號

**Draw Group（抽籤組別）**:
參與研究室選位抽籤的基本單位（同組/同實驗室成員），由代表人與複數成員組成。抽籤規則保證同組成員必定分配在同一 Lab Room 且依蛇形走位連續相鄰不拆散。
> **避免用詞：** 抽籤小隊, 隊伍

**Lottery Session（抽籤大會）**:
迎新現場在大螢幕上進行的研究室分配開獎流程，包含組別跑馬燈、滿座進度條、即時亮燈與灑花動畫。
> **避免用詞：** 選位會議, 抽籤活動

**Seating Map（座位地圖）**:
各 Lab Room 依擬真實體格局渲染之互動座位表，供在校生與新生隨時查閱成員資訊與搜尋座位。
> **避免用詞：** 座位圖, 座位表

### 課表與校園生活

**Course Slot（課程時段）**:
全系課表中由星期（週一至週五）與節次（1~E）定義之開課單元，包含課號、課名、授課教師、學分與教室。
> **避免用詞：** 課堂, 上課時間

**Food Spot（美食店家）**:
中大周邊（後門、宵夜街、前門、校內）之餐飲店家，包含推薦品項、營業時間、公休日與價位。
> **避免用詞：** 餐廳, 小吃攤

**Credit Calculator（學分試算器）**:
依據當屆修業規章，供學生勾選課程並自動計算必修、選修、外所抵免與畢業門檻之互動工具。
> **避免用詞：** 學分表, 算分器

