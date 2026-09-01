# NCU IM 視覺識別資產 (Brand Assets)

本目錄保存 NCUIM2026-Fresher 視覺識別系統（Visual Identity）所使用的核心品牌資產。

---

## 💡 設計理念 (Design Concept)

NCU IM 視覺識別以 **Information**、**Management**、**Connection** 與 **Central** 為核心概念：

* **「i」代表 Information（資訊）**：頂部多向節點與連線象徵來自人、組織、科技與數據等多方來源的資訊流；資訊向中央核心節點匯聚，代表系統整合、資料分析與決策支援，同時呼應國立中央大學（National Central University）的「Central」核心樞紐意象。
* **「m」代表 Management（管理）**：象徵資訊經由系統架構與專業整合後，轉化為組織管理、策略規劃與決策價值。
* **色彩語言**：整體採用深海藍（Navy Blue）與電光藍（Electric Blue）作為雙主色調，兼具學術專業、資訊科技、嚴謹可靠與創新動能。

### 🎨 品牌色彩定義 (Brand Colors)

| 色彩名稱 | 角色與意涵 | 代表色碼 (HEX) |
| :--- | :--- | :--- |
| **Navy Blue** | 學術專業、穩定深邃、主體字標與主要架構 | `#0A2540` / `#1B2A4A` |
| **Electric Blue** | 資訊科技、創新活力、放射節點與強調亮點 | `#0070F3` / `#38BDF8` |

---

## 🏛️ 響應式識別層級 (Responsive Identity Hierarchy)

四種識別並非彼此獨立的 Logo，而是同一套 NCU IM 視覺語言依不同媒介、尺寸與構圖需求所衍生的響應式版本（Responsive Identity）：

```text
[Primary Logo]        完整字標品牌識別   ──> public/ncuim-icons/banner-main.png
[Compact Logo/Avatar] 資訊節點濃縮徽章   ──> public/ncuim-icons/github-avatar.png
[Symbol Mark]         幾何化核心品牌符號 ──> public/ncuim-icons/hero-logo.svg
[Micro Mark/Favicon]  瀏覽器頁籤微型識別 ──> public/favicon.svg
```

---

## 📁 資產規格與定位對照表

| 識別層級 | 檔案路徑 | 格式規格 | 定位與最佳適用場景 |
| :--- | :--- | :---: | :--- |
| **Primary Logo** | `public/ncuim-icons/banner-main.png` | 高解析 PNG | **橫幅完整字標（Primary Brand Logo）**<br>完整 `ncu im` 主視覺標誌，透過多向資訊節點向中央核心匯聚，品牌辨識最完整。適用於網頁 Header 橫幅、活動看板、簡報封面等橫向空間充裕之場合。 |
| **Compact Logo** | `public/ncuim-icons/github-avatar.png` | 高解析 PNG | **社群與組織頭像（Social Avatar / Compact Logo）**<br>將 `im` 與多向資訊匯聚節點濃縮於緊湊構圖，適合圓形與正方形頭像容器。適用於 GitHub 組織頭像、社群帳號、圓形徽章。 |
| **Symbol Mark** | `public/ncuim-icons/hero-logo.svg` | 向量 SVG | **幾何化品牌符號（Symbol Mark）**<br>以 `im` 為核心，透過幾何外框表達系統、組織與資訊整合模組，可獨立作為網站首頁 Hero 視覺主體、互動元素與獨立幾何圖騰。 |
| **Micro Mark** | `public/favicon.svg` | 向量 SVG | **瀏覽器頁籤微型識別（Favicon / Micro Mark）**<br>專為 16–48 px 極小尺寸重新簡化輪廓與對比，避免直接縮小完整 Logo 所產生的細節模糊，於深淺色分頁列皆能清晰識別。 |

---

## 📌 使用規範 (Usage Guidelines)

1. **維持比例**：嚴禁任意拉伸、扭曲或變更 Logo 與各標誌之長寬比例。
2. **排列完整**：不得任意拆解、倒置或重新排列 `ncu im` 字樣與節點幾何結構。
3. **效果純淨**：除系統內建之互動微光外，不得在設計素材中自行疊加生硬之陰影、立體外框或雜訊濾鏡。
4. **尺寸適配原則**：
   * 橫向展示空間充足時，優先使用完整 **`banner-main.png`**。
   * 方形、圓形或社群頭貼情境，優先使用 **`github-avatar.png`** 或 **`hero-logo.svg`**。
   * 極小尺寸（< 48px）或分頁頁籤，一律使用專屬之 **`favicon.svg`**，嚴禁直接縮放主標誌。
5. **背景對比**：若展示背景色與圖標衝突導致辨識度不足時，應搭配合適之淺色/深色襯底，不得隨意竄改品牌主色。

---

> ℹ️ **聲明**：此識別系統目前作為 NCUIM2026-Fresher 專案之視覺識別使用，不取代國立中央大學既有校徽、校名標準字或其他官方 CIS 規範。
