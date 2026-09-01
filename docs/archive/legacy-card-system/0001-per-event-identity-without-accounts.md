---
status: accepted
---

# 身分繫於單場活動，不建立帳號系統

參與者是當天現場才第一次接觸系統的新生，報到人潮集中且時間極短，任何登入流程都會直接卡住現場動線。因此我們決定不做帳號系統：Participant 掃描 Event QR Code 後當場建立身分，該身分繫於這一場 Event，不跨 Event 延續，也無法在下一屆活動沿用。

## Considered Options

- **手機簡訊 OTP 驗證**：能跨裝置找回身分，但報到當下要等簡訊，現場動線成本過高。
- **Sign in with Google**：一鍵登入、免打字、無寄信風險，但等同引入正式帳號系統，且把身分與外部服務綁定。
- **註冊時顯示代碼請使用者自行截圖**：完全不碰個資，但可用性完全取決於使用者當下有無截圖，風險過高。
- **限量實體 QR Code 名牌**：實體名牌可作為隨身的身分錨點，但本活動使用數位 QR Code，沒有實體派發管道，此方案不成立。

## Consequences

**必須另外收集 email 作為找回身分的管道，即使我們並不做帳號系統。** 這看似矛盾，原因是一個無法迴避的平台限制：Apple 的 ITP 政策會在使用者連續 7 天未與網站互動後，刪除該站所有 script-writable storage（含 localStorage、IndexedDB、SessionStorage），而 iOS 上所有瀏覽器都必須使用 WebKit，因此無法繞過。由於我們決定 Event 封存後仍保留 14 天供查看，第 8 至 14 天之間所有 iPhone 使用者的瀏覽器身分都會失效。若僅依賴瀏覽器儲存，這段期間的查看功能等同不存在。

因此：Participant 在報到時填寫 email，系統寄送一組私密代碼供日後找回身分。**不要因為「這個系統沒有登入功能」就移除 email 收集流程** —— 它不是帳號機制，而是對抗 ITP 的必要補償。

另一個後果是：公開的收集用 QR Code 與私密的找回用代碼必須是兩組不同的憑證。兩者若共用同一組碼，每一位收集過你的人都會同時持有能冒充你的憑證。

參考：[WebKit — Full Third-Party Cookie Blocking and More](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
