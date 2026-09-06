# 中大美食地圖 (Food Map) 規劃規格書

## 1. 目標概述
為中央大學資管所新生及在校生提供校園周邊飲食指南，支援依區域分類瀏覽、關鍵字快搜、標籤篩選與「今天吃什麼？」隨機抽選功能。

## 2. 核心資料結構設計 (`src/data/food-resources.json`)

```typescript
export interface FoodItem {
  readonly id: string;
  readonly name: string;
  readonly area: "後門" | "宵夜街" | "前門" | "校內";
  readonly category: "便當快餐" | "麵食餃類" | "飲品點心" | "早午餐" | "異國料理" | "其他";
  readonly priceRange: "$" | "$$" | "$$$"; // $ (<100), $$ (100-200), $$$ (>200)
  readonly rating?: number; // 1.0 - 5.0
  readonly description?: string;
  readonly recommendedDishes?: readonly string[]; // 推薦招牌餐點
  readonly openingHours?: string;
  readonly googleMapUrl?: string;
  readonly tags?: readonly string[]; // 例: ["冷氣開放", "可刷卡/LinePay", "內用座位多"]
}
```

## 3. 功能規劃

### 3.1 區域分類篩選 (Area Filter)
- 後門（中央大學後門餐廳街）
- 宵夜街（生醫理工學院/男九舍下方商圈）
- 前門（正門中大路商圈）
- 校內（松苑餐廳、據德樓、各學院輕食咖啡）

### 3.2 「今天吃什麼？」隨機抽選器 (Random Picker)
- 支援「依當前選定區域」進行隨機抽選，增加趣味性。
- 點擊後以動畫或滾輪效果抽出推薦店家與推薦菜色。
- 提供「再來一次」與「直接前往 Google Map」快捷按鈕。

### 3.3 快速搜尋與標籤 (Search & Tags)
- 支援店名、招牌菜與標籤的即時文字搜尋。
- 標籤快速篩選（如：可 Line Pay、平價、宵夜首選）。

## 4. 階段執行計劃
- **階段一**：完成規格書確認（當前階段，不改動現有代碼）。
- **階段二**：蒐集整理第一批精選中大美食清單 JSON。
- **階段三**：串接 `FoodPage.tsx` 介面與隨機推薦互動邏輯。
