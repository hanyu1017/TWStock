# 即時股價系統說明

## 📊 系統架構

TWStock 使用雙重股價獲取系統，確保在任何環境下都能可靠運行：

### 主要方法：Python + yfinance
- 使用 Python 腳本調用 yfinance 庫
- 優點：數據完整、準確、支援全球股市
- 適用：本地開發、有 Python 環境的部署

### 備用方法：Node.js + Yahoo Finance API
- 直接通過 HTTP 請求 Yahoo Finance API
- 優點：無需 Python、快速、可靠
- 適用：無 Python 環境、Python 失敗時自動切換

## 🔄 自動切換機制

系統會自動處理故障切換：

```
1. 嘗試 Python 腳本
   ↓ (失敗)
2. 自動切換到 Node.js fallback
   ↓ (成功)
3. 返回股價數據
```

## ⚙️ 配置選項

### 環境變數

在 `.env` 或 Railway 環境變數中設定：

```env
# 強制使用 Node.js 方法（不嘗試 Python）
USE_STOCK_FALLBACK=true

# 或保持預設（自動 fallback）
USE_STOCK_FALLBACK=false
```

### Railway 部署建議

**方法 1：使用 Python（推薦）**
```bash
# 在 Railway 中確保安裝 Python 依賴
# requirements.txt 會自動安裝 yfinance
```

**方法 2：純 Node.js（簡單）**
```bash
# 設定環境變數
USE_STOCK_FALLBACK=true
```

## 📡 API 端點

### 1. 單一股票價格
```http
GET /api/stocks/[symbol]
```

**範例：**
```bash
GET /api/stocks/2330.TW
```

**回應：**
```json
{
  "symbol": "2330.TW",
  "name": "台積電",
  "currentPrice": 580.00,
  "previousClose": 575.00,
  "change": 5.00,
  "changePercent": 0.87,
  "open": 576.00,
  "high": 582.00,
  "low": 575.00,
  "volume": 25000000,
  "marketCap": 15000000000000,
  "lastUpdated": "2025-11-21T10:30:00.000Z"
}
```

### 2. 批量股票價格
```http
POST /api/stocks/batch
Content-Type: application/json

{
  "symbols": ["2330.TW", "2317.TW", "2454.TW"]
}
```

### 3. 投資組合摘要（含即時價格）
```http
GET /api/portfolio/summary
```

### 4. 關注名單價格
```http
GET /api/watchlist/prices
```

## 🕐 更新頻率

### 前端自動更新
- **投資組合**：每 5 秒更新
- **關注名單**：每 5 秒更新
- **市場指數**：每 60 秒更新

### 後端快取
- **股價快取**：5 秒內重複請求返回快取
- **市場指數**：1 分鐘快取

## 🔧 Python 腳本

### fetch_stock_data.py

**功能：**
- 獲取單一股票：`python3 fetch_stock_data.py stock 2330.TW`
- 批量獲取：`python3 fetch_stock_data.py stocks 2330.TW 2317.TW`
- 市場指數：`python3 fetch_stock_data.py indices`

**依賴：**
```txt
yfinance==0.2.33
pandas==2.1.4
requests==2.31.0
```

### 測試腳本

```bash
# 測試單一股票
python3 scripts/fetch_stock_data.py stock 2330.TW

# 預期輸出：JSON 格式的股價數據
```

## 🌐 Node.js Fallback

### lib/stock-fallback.ts

**特點：**
- 直接調用 Yahoo Finance Chart API
- 支援所有 Yahoo Finance 上市股票
- 包含台灣證交所 API 作為次要備用

**台灣股市特別支援：**
```typescript
// 使用 TWSE API 獲取台股即時報價
fetchTaiwanStockInfo('2330')
```

## 📈 資料來源

### Yahoo Finance
- **涵蓋**：全球股市（美、日、韓、台灣等）
- **延遲**：約 15 分鐘（一般股票）
- **台股**：即時報價（盤中）

### 台灣證交所（TWSE）
- **涵蓋**：台灣上市股票
- **延遲**：5 秒延遲（盤中即時）
- **使用場景**：Yahoo Finance 失敗時的備用

## 🚀 性能優化

### 1. 批量請求
```typescript
// ✅ 好：批量獲取
fetchMultipleStocks(['2330.TW', '2317.TW', '2454.TW'])

// ❌ 差：逐一獲取
await fetchStockData('2330.TW')
await fetchStockData('2317.TW')
await fetchStockData('2454.TW')
```

### 2. 快取策略
- 資料庫快取（Prisma）
- 5 秒內相同請求返回快取
- 減少外部 API 調用

### 3. 超時保護
- Python 腳本：10 秒超時
- HTTP 請求：10 秒超時
- 防止長時間等待

## 🐛 故障排除

### Python 腳本失敗

**症狀：**
```
Error fetching stock data: Command failed: python3 ...
```

**解決：**
1. 檢查 Python 是否安裝：`python3 --version`
2. 檢查 yfinance 是否安裝：`pip3 list | grep yfinance`
3. 設定使用 fallback：`USE_STOCK_FALLBACK=true`

### Yahoo Finance API 限制

**症狀：**
```
403 Forbidden 或 429 Too Many Requests
```

**解決：**
1. 減少請求頻率
2. 使用批量請求
3. 等待幾分鐘後重試

### 台股數據不準確

**可能原因：**
- 非交易時段（顯示前一交易日收盤價）
- API 延遲（約 15 分鐘）
- 股票代碼格式錯誤（應為 `2330.TW`）

**驗證：**
```bash
# 測試股票數據
curl https://query1.finance.yahoo.com/v8/finance/chart/2330.TW
```

## 📊 監控和日誌

### 開發環境
```bash
# 啟動開發伺服器並查看日誌
npm run dev

# 觀察以下日誌：
# - "Error fetching stock data" - Python 失敗
# - "Trying fallback method" - 切換到 Node.js
# - "Fallback fetch failed" - 所有方法都失敗
```

### 生產環境（Railway）
1. 進入 Railway 儀表板
2. 查看 Deployments → Logs
3. 搜尋 "stock" 或 "fallback"

## ✅ 測試清單

### 本地測試
- [ ] Python 腳本正常工作
- [ ] Fallback 方法正常工作
- [ ] 前端每 5 秒更新
- [ ] 價格變動有動畫效果
- [ ] 損益計算正確

### Railway 部署測試
- [ ] 環境變數已設定
- [ ] 股價能正常顯示
- [ ] 更新機制運作
- [ ] 無錯誤日誌

## 🔗 相關文件

- [Yahoo Finance API](https://www.yahoofinanceapi.com/)
- [yfinance 文檔](https://pypi.org/project/yfinance/)
- [台灣證交所 API](https://www.twse.com.tw/)

## 💡 最佳實踐

1. **在 Railway 使用 Fallback**
   ```env
   USE_STOCK_FALLBACK=true
   ```
   原因：簡單、可靠、無需 Python 配置

2. **本地開發使用 Python**
   ```env
   USE_STOCK_FALLBACK=false
   ```
   原因：數據更完整、測試真實環境

3. **批量請求**
   ```typescript
   // 一次獲取所有需要的股票
   const stocks = await fetchMultipleStocks(symbols);
   ```

4. **錯誤處理**
   ```typescript
   try {
     const data = await fetchStockData(symbol);
     if (!data) {
       // 使用預設值或顯示錯誤
     }
   } catch (error) {
     console.error('Stock fetch error:', error);
   }
   ```

## 📞 需要幫助？

如果即時股價功能仍有問題：

1. 查看 Railway 日誌
2. 檢查環境變數設定
3. 嘗試設定 `USE_STOCK_FALLBACK=true`
4. 查看本文檔的故障排除部分

---

更新日期：2025-11-21
版本：1.0
