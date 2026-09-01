# Spec: 活動卡片收集系統 (Legacy Archive)

> ⚠️ **此模組已於 2026 年 8 月正式拆分至獨立專案維護，本文件僅供歷史參考。**  
> 詞彙依循 [CONTEXT.md](../../../CONTEXT.md)。相關決策：[ADR-0001](0001-per-event-identity-without-accounts.md)、[ADR-0002](0002-achievements-are-never-revoked.md)。

## Problem Statement

新生訓練活動中，七十位彼此不認識的新生被聚在同一個場地，主辦方希望他們能主動交談、互相認識。但實際上大多數人會待在原本就認識的小圈子裡，或滑手機等活動結束——破冰只發生在少數外向的人身上。

主辦方目前沒有有效的工具解決這件事：紙本集章卡無法即時統計、容易遺失、也沒辦法設計有趣的規則；而參與者同時使用 iOS 與 Android，開發原生 App 對一場一天的活動來說完全不合比例。主辦方也無從得知活動當下互動的熱絡程度，只能憑現場感覺判斷。

## Solution

一個以手機瀏覽器開啟的網頁。參與者到場後掃描 Entry Code 建立當場活動限定的身分，填寫自己的 Profile，然後透過互相掃描 Personal Code 來收集彼此的 Card。

系統用分數與成就把「認識新朋友」變成一場遊戲：每掃一個人就得分，達成 Admin 設定的目標可獲得額外分數，排行榜顯示前幾名。Admin 可在活動中途把參與者分組，開啟「找到你的隊員」這類需要主動問人的第二階段玩法。

Admin 在後台即時掌握所有人的狀況，能發布公告、調整成就門檻、處理違規內容。活動結束後系統封存，收集成果保留十四天供大家回味，期滿刪除。

## User Stories

### 報到與身分

1. As a 參與者, I want 掃描 Entry Code 就能開始使用, so that 我不需要下載任何 App 或註冊帳號
2. As a 參與者, I want 在報到時輸入活動通關碼, so that 我知道這個活動不是誰都能加入的
3. As a 主辦方, I want 用通關碼擋住不在場的人, so that 新生的照片與社群連結不會外流給校外陌生人
4. As a 工作人員, I want 掃描專屬的工作人員版 Entry Code, so that 我的身分被自動標記，不需要 Admin 事後手動指派
5. As a 參與者, I want 填寫我的暱稱、頭像、社群連結、三個個性化圖示與一句話自我介紹, so that 別人收集到我時能看見我是什麼樣的人
6. As a 參與者, I want 填寫 email 並收到一組私密代碼, so that 我換裝置或清除瀏覽器資料後還能找回我的身分
7. As a 參與者, I want email 未驗證時看到明顯的提示, so that 我在活動當天就能發現自己打錯信箱並修正，而不是活動結束後才發現進不去
8. As a 參與者, I want 即使沒驗證 email 也能立刻開始收集, so that 報到不會被卡住
9. As a 參與者, I want 用信中的私密代碼找回身分, so that 我的手機出問題時不需要求助工作人員
10. As a 工作人員, I want 在後台協助遺失身分的參與者, so that 連信箱都收不到的人仍有救援管道
11. As a 參與者, I want 我的登入用代碼與被收集用的 Personal Code 是不同的兩組, so that 收集過我的人無法冒充我
12. As a 參與者, I want 隨時修改我的 Profile, so that 我可以換掉拍壞的照片或修正打錯的字

### 收集

13. As a 參與者, I want 在網頁裡直接開啟相機掃描, so that 我不需要離開頁面
14. As a 參與者, I want 在相機無法使用時改用手機原生相機掃描, so that 我從 LINE 或 IG 開啟網頁時也能正常收集
15. As a 參與者, I want 掃描一次就雙方互相收集, so that 我們不需要各掃一次浪費時間
16. As a 參與者, I want 看到我的 Personal Code, so that 別人可以掃描我
17. As a 參與者, I want 被別人收集時收到通知, so that 我知道剛才那次互動成功了
18. As a 參與者, I want 重複掃描同一個人時看到「你已經收集過這個人了」, so that 我不會以為系統壞掉
19. As a 參與者, I want 重複掃描不會增加分數, so that 排行榜不會被反覆互掃的人洗掉
20. As a 參與者, I want 掃描自己的 Personal Code 時被擋下, so that 我不會誤以為可以自己刷分
21. As a 參與者, I want 依收集時間倒序瀏覽我的收集清單, so that 我剛認識的人排在最前面
22. As a 參與者, I want 篩選出只看隊員, so that 我能追蹤自己還缺哪幾位隊員
23. As a 參與者, I want 點開任一張 Card 看到完整資訊, so that 我能連到對方的社群
24. As a 參與者, I want Card 顯示對方最新的 Profile, so that 對方修正錯字或換照片後我看到的是正確版本

### 分數與成就

25. As a 參與者, I want 每掃一個人就立即得到基礎分, so that 我的每一次努力都有回饋
26. As a 參與者, I want 看到我目前的總分, so that 我知道自己的狀況
27. As a 參與者, I want 看到所有公開成就與我的進度, so that 我知道還差多少就能達成
28. As a 參與者, I want 看到「還差 2 人」這種具體進度, so that 我有明確的下一步目標
29. As a 參與者, I want 隱藏成就在達成前只顯示為「隱藏成就」, so that 達成的瞬間有驚喜感
30. As a 參與者, I want 已經達成的成就永遠不會被收回, so that 我不會在活動中途莫名其妙掉分
31. As a 參與者, I want 看到排行榜前幾名, so that 我知道要衝到什麼程度才有機會
32. As a 參與者, I want 看到自己的名次, so that 我能判斷要不要再努力一下
33. As a 參與者, I want 排行榜不顯示完整的最後幾名, so that 我不會被公開標示為最不積極的人
34. As a 參與者, I want 排行榜自動定時更新, so that 我不需要一直手動重新整理
35. As a 工作人員, I want 我不被計入排行榜, so that 我不會因為被全場掃描而佔據前幾名

### 分組

36. As an Admin, I want 選擇報到時即時分隊或全員到齊後批次分隊, so that 我能依活動流程決定分組時機
37. As an Admin, I want 批次分隊時隨機打散, so that 一起來報到的朋友不會被分在同一隊
38. As an Admin, I want 遲到者自動補進人數最少的隊伍, so that 我在忙碌時不需要手動處理
39. As an Admin, I want 手動調整個別參與者的組別, so that 我能處理演算法無法預期的現場狀況
40. As an Admin, I want 調整組別時該participant的分數跟著轉移, so that 資料不會對不上
41. As a 參與者, I want 看到我的隊員收集進度（例如 3/7）, so that 我知道還差幾個人
42. As a 參與者, I want 不知道隊員是誰、必須現場問出來, so that 我被迫去跟陌生人交談
43. As a 參與者, I want 分隊公布時自動補發我早就達成的組別成就, so that 我先前的努力不會白費
44. As a 參與者, I want 集齊全隊的認定以達成當下的隊伍人數為準, so that 之後有人加入我的隊伍不會害我失去成就

### 公告

45. As a 參與者, I want 查看主辦方發布的活動訊息, so that 我不會錯過流程異動
46. As a 參與者, I want 有新公告時看到未讀標記, so that 我回到網頁時知道要去看
47. As an Admin, I want 隨時發布公告, so that 我能通知現場的流程變化或公布排名

### 後台

48. As an Admin, I want 用帳號密碼登入後台, so that 全體參與者的個資不會被隨意存取
49. As an Admin, I want 建立活動並產生各版本的 Entry Code, so that 我能為每場活動準備獨立的報到入口
50. As an Admin, I want 設定活動通關碼, so that 我能控制誰可以加入
51. As an Admin, I want 查看所有參與者的清單與狀態, so that 我掌握現場的整體狀況
52. As an Admin, I want 從固定範本設定成就並填入門檻與分值, so that 我不需要學習複雜的規則編輯器
53. As an Admin, I want 在活動進行中調整成就門檻, so that 我發現門檻訂太高時能當場補救
54. As an Admin, I want 調高門檻不會影響已達成的人, so that 我的補救不會引發現場爭議
55. As an Admin, I want 設定成就為公開或隱藏, so that 我能安排一些驚喜
56. As an Admin, I want 在設定掃描人數門檻時看到全場人數上限的提示, so that 我不會設出永遠達不成的成就
57. As an Admin, I want 移除違規的頭像或暱稱, so that 不當內容不會留在活動中
58. As an Admin, I want 移除的違規內容立即從所有人的收集清單消失, so that 我的處理是真的有效的
59. As an Admin, I want 封存活動, so that 活動結束後不會再有人繼續收集
60. As an Admin, I want 封存後仍能查看該場活動的資料, so that 我能做事後檢討

### 封存後

61. As a 參與者, I want 活動結束後仍能查看我的收集成果, so that 我可以回味並聯絡想深交的人
62. As a 參與者, I want 封存後掃描功能關閉, so that 活動的界線是清楚的
63. As a 參與者, I want 我的資料在十四天後被刪除, so that 我的照片與社群連結不會無限期留在別人的系統裡

## Implementation Decisions

### 整體架構

- 單一 HTTP API 伺服器搭配手機網頁前端。所有業務邏輯都在伺服器端，前端不做任何計分或成就判定。
- 前端需為手機瀏覽器優先設計，並在 iOS Safari、Android Chrome，以及 LINE/Instagram 內建瀏覽器中實測。

### 身分與存取

- **Entry Code 與 Personal Code 是兩種不同的東西**，不可共用同一組識別碼。Entry Code 屬於 Event 層級、用於建立身分並決定 Role；Personal Code 屬於 Participant 層級、公開供他人掃描。
- **登入用的私密代碼與 Personal Code 必須分離**。若共用，每位收集過某人的參與者都持有能冒充該人的憑證。
- 一場 Event 可有多組 Entry Code，每組對應一個 Role（一般參與者／工作人員）。Role 在報到時決定，之後不變動。
- **Team 不由 Entry Code 決定**，而是由系統或 Admin 另行指派。
- Participant 身分繫於單一 Event，不跨 Event 延續（ADR-0001）。
- 瀏覽器端保存身分憑證為主要機制，email 私密代碼為找回管道。**email 收集流程不可因為「系統沒有登入功能」而被移除**——它是對抗 iOS ITP 七天儲存清除的必要補償（ADR-0001）。
- email 驗證為非阻斷式：未驗證不影響任何功能，但介面需持續顯示未驗證提示直到完成。

### 收集模型

- 一次 Scan 產生**兩筆 Collection**（雙向持有）與**一筆 Scan 紀錄**（單向歸屬於發起者）。這個不對稱是刻意的：Collection 用於持有關係，Scan 用於衡量主動程度。
- Scan 對「同一組參與者」具冪等性：重複掃描不產生新的 Collection、不加分，但需回傳可供前端顯示的明確提示。
- Scan 自己的 Personal Code 需被拒絕。
- **Card 即時引用 Profile，不是收集當下的快照。** 快照會使 Admin 的違規內容移除無法生效於既有的 Collection。

### 計分與成就

- Score = 基礎分（每次 Scan）+ 成就獎勵分。兩者的分值皆為 Event 層級設定。
- 成就以**參數化範本**實作，不做自由條件編輯器。範本清單：
  1. 累計 Scan 達 N 人
  2. 累計被收集達 N 人
  3. Event 開始後 N 分鐘內完成第一次 Scan
  4. Scan 到具特定 Role 的人達 N 人
  5. 收集同 Team 達 N 人（N 可為特殊值「全部」）
- 每個成就有公開／隱藏旗標。隱藏成就在達成前不得透露名稱、條件或進度。
- **達成狀態必須持久化，不可每次由當前資料推導**（ADR-0002）。重算為純新增操作。
- 重算觸發時機：Scan 發生後、Team 指派或調整後、成就設定變更後。
- 範本 5 的「全部」以**達成當下的 Team 人數**認定並固定下來。
- 具工作人員 Role 者不進入 Leaderboard 排序。
- Leaderboard 回傳前 N 名與查詢者自己的名次，不回傳完整排名。

### 分組

- 兩種指派模式：報到時輪流分配（即時），或全員到齊後隨機打散（批次）。
- 批次分隊後報到者自動補進當前人數最少的 Team。
- Admin 可手動調整個別 Participant 的 Team；該 Participant 已累積的分數隨之移動。
- 隊員清單對 Participant **只回傳進度數字，不回傳成員身分**。

### 生命週期

- Event 具備進行中與已封存兩種狀態。封存後所有 Scan 相關端點需拒絕請求，查詢端點維持可用。
- 封存滿十四天後刪除該 Event 的所有 Participant、Profile、Collection、Scan 與 email 資料。

### 後台

- Admin 以預先建立的帳號密碼登入，不開放註冊，不使用共用密碼（需能辨別是哪位 Admin 執行了操作）。
- 第一階段需完成：Event 管理、Participant 清單、Achievement 設定、Team 管理、Announcement 發布。
- 第一階段暫緩：Scan/Collection 紀錄檢視介面、檢舉處理佇列。

## Testing Decisions

### 接縫

**單一接縫：HTTP API。** 所有測試都以 API 客戶端的身分驅動系統，不直接呼叫內部函式、不檢查資料庫內部結構、不斷言任何實作細節。這讓測試在重構時保持有效，並確保測到的是真實的端到端行為。

本專案為全新 repo，沒有既有測試可作為 prior art；本 spec 建立的模式即為後續的參考基準。

### 什麼是好的測試

只驗證外部可觀察的行為：呼叫 API 之後，另一次 API 呼叫看得到什麼。不驗證資料表結構、內部模組的呼叫關係、或任何使用者無法感知的中間狀態。每個測試應對應到上方的一則 user story。

### 必須涵蓋的情境

**收集模型**
- 一次 Scan 後，雙方各自的收集清單都出現對方
- 一次 Scan 後，Scan 只歸屬於發起者，被掃者的主動掃描數不增加
- 重複 Scan 同一人不增加分數，且回傳可辨識的重複狀態
- Scan 自己被拒絕

**成就永不撤銷（ADR-0002 的核心風險）**
- 成就門檻由 10 調高至 15 後，已達成者仍保有該成就與分數
- 參與者集齊當時的全部隊員後，隊伍加入新成員，該成就不被撤銷
- Team 指派後，先前已符合條件者被追溯補發成就
- 成就設定變更後的重算不移除任何既有達成

**隱藏成就**
- 未達成的隱藏成就不透露名稱、條件與進度
- 達成後正常顯示

**分組**
- 批次分隊後報到者被指派到人數最少的隊伍
- Admin 手動調整組別後，該參與者的分數隨之轉移
- 隊員進度端點只回傳數字，不回傳成員身分

**排行榜**
- 具工作人員 Role 者不出現在排名中
- 回應包含前 N 名與查詢者自身名次，不含完整排名

**生命週期**
- 封存後所有 Scan 端點被拒絕
- 封存後查詢端點仍可正常存取

**存取控制**
- Personal Code 無法用於登入或找回身分
- 未通過通關碼無法完成報到

## Out of Scope

- **聊天功能。** Profile 中的三個個性化圖示純為裝飾，系統不含任何訊息或聊天機制。
- **跨活動的身分與帳號系統。** 參與者無法沿用上一場活動的 Profile，也無法在下一屆活動找回舊資料。
- **團體排行榜。** Team 只作為 Achievement 的判定依據，不做隊伍間的分數競賽。
- **自由條件編輯器。** Admin 只能從固定範本填入參數，不能自由組合條件。
- **瀏覽器推播通知。** 公告僅以頁面內未讀標記呈現。
- **原生 App。**
- **Scan/Collection 紀錄檢視介面與檢舉處理佇列**（第一階段暫緩，非永久排除）。
- **Card 的稀有度、卡面樣式等卡牌遊戲元素。**

## Further Notes

### 技術棧（暫定，待 ADR 確認）

初步選定 **Ionic React + TypeScript + Vite** 為前端框架，**Firebase** 為後端服務（Authentication、Cloud Firestore、Cloud Storage、Cloud Functions、Firebase Hosting）。此決定尚未正式記錄為 ADR，實作前應確認並補建 ADR。

選型考量：需要伺服器端邏輯與資料庫、需要寄送 email、需要一個 Admin 後台、以手機瀏覽器為唯一前端、規模僅約七十人。

### 規模

單場活動約七十人，每組五至八人。這個量級代表**沒有任何效能或擴展性顧慮**——重算全體成就、即時查詢排行榜、寄送全體 email 都在毫秒到秒級完成。不需要為擴展性增加任何複雜度。

一個直接的後果：「累計 Scan 達 N 人」的 N 最大只能是 69。後台需在設定時提示這個上限。

### 承襲自設計討論的假設

以下四點在設計討論中被明確提出但未經反駁，實作時如與預期不符請提出：

1. 三個個性化圖示從系統預設的圖示庫中挑選，非使用者上傳
2. 掃描自己的 Personal Code 會被擋下並提示
3. Entry Code 的散布方式：一般版由工作人員現場出示或投影，工作人員版私下發給幹部
4. 後台設定掃描人數門檻時顯示全場人數上限提示

### 發布狀態

`docs/agents/issue-tracker.md` 設定的追蹤位置為 GitHub Issues，但本機未安裝 `gh` CLI。本 spec 暫存為檔案，待 `gh` 可用後應以 `ready-for-agent` 標籤發布至 `Youchenjiang/NCUIM2026-Fresher`。
