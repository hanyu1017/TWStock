# TWStock - 台灣股票投資組合追蹤系統

一個功能完整的台灣股票投資組合追蹤系統，使用 Next.js、React、PostgreSQL 建構，整合 yfinance 獲取即時股價數據。

![TWStock Dashboard](https://via.placeholder.com/800x400?text=TWStock+Dashboard)

## 📋 主要功能

### 核心功能
- ✅ **用戶認證系統** - 使用 NextAuth.js 實現安全的登入/註冊功能
- 📊 **投資組合管理** - 記錄持股、計算成本、追蹤損益
- ⭐ **關注名單** - 追蹤您感興趣的股票
- 💹 **即時股價更新** - 每 5 秒自動更新股價
- 🌏 **國際市場指數** - 顯示台灣、美國、日本、韓國主要股市指數
- 🏦 **三大法人數據** - 查看外資、投信、自營商的買賣超資訊
- 📧 **每日郵件通知** - 每天下午 4 點自動發送持股狀況報告
- 📱 **響應式設計** - 完美支援手機、平板、桌面電腦

### 額外功能
- 📈 **損益計算** - 自動計算每支股票和整體投資組合的損益
- 💰 **成本平均價** - 支援多次買入，自動計算平均成本
- 📝 **交易歷史** - 完整記錄所有買賣交易
- 🌓 **深色模式** - 支援淺色/深色主題切換
- 🔄 **自動快取** - 智慧快取機制減少 API 調用

## 🛠 技術棧

### 前端
- **框架**: Next.js 15 (App Router)
- **UI 函式庫**: React 18
- **樣式**: Tailwind CSS 3
- **狀態管理**: SWR
- **圖表**: Recharts
- **認證**: NextAuth.js

### 後端
- **API**: Next.js API Routes
- **資料庫**: PostgreSQL
- **ORM**: Prisma 5
- **密碼加密**: bcryptjs
- **郵件服務**: Nodemailer 7

### 數據來源
- **股價數據**: yfinance (Python)
- **三大法人**: 台灣證券交易所 API

### 部署
- **平台**: Railway
- **資料庫**: Railway PostgreSQL

## 🚀 快速開始

### 前置需求

確保您的系統已安裝：
- Node.js 18+
- Python 3.8+
- PostgreSQL (或使用 Railway PostgreSQL)
- npm 或 yarn

### 安裝步驟

1. **Clone 專案**
```bash
git clone <repository-url>
cd TWStock
```

2. **安裝 Node.js 依賴**
```bash
npm install
```

3. **安裝 Python 依賴**
```bash
pip install -r requirements.txt
```

4. **設定環境變數**
```bash
cp .env.example .env
```

編輯 `.env` 文件，填入您的配置：

```env
# 資料庫連接字串
DATABASE_URL="postgresql://user:password@localhost:5432/twstock?schema=public"

# NextAuth 設定
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# 郵件設定 (使用 Gmail 為例)
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_FROM="your-email@gmail.com"

# Cron 任務密鑰
CRON_SECRET="your-cron-secret"

# 應用程式 URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

5. **設定資料庫**
```bash
# 生成 Prisma Client
npx prisma generate

# 執行資料庫遷移
npx prisma migrate dev

# (可選) 使用 Prisma Studio 查看資料庫
npx prisma studio
```

6. **啟動開發伺服器**
```bash
npm run dev
```

開啟瀏覽器訪問 [http://localhost:3000](http://localhost:3000)

## 📧 郵件設定說明

### 使用 Gmail

1. 前往 [Google Account Security](https://myaccount.google.com/security)
2. 啟用「兩步驟驗證」
3. 生成「應用程式密碼」
4. 將密碼填入 `.env` 的 `EMAIL_SERVER_PASSWORD`

### 使用其他郵件服務

修改 `.env` 中的 SMTP 設定即可。

## 🚢 部署到 Railway

### 步驟

1. **建立 Railway 帳號**
   - 前往 [railway.app](https://railway.app)
   - 使用 GitHub 帳號登入

2. **建立新專案**
   - 點擊 "New Project"
   - 選擇 "Deploy from GitHub repo"
   - 選擇您的專案儲存庫

3. **新增 PostgreSQL**
   - 點擊 "New" → "Database" → "Add PostgreSQL"
   - Railway 會自動設定 `DATABASE_URL`

4. **設定環境變數**

   在 Railway 專案設定中加入以下環境變數：

   ```
   NEXTAUTH_URL=https://your-app.railway.app
   NEXTAUTH_SECRET=your-production-secret
   EMAIL_SERVER_USER=your-email@gmail.com
   EMAIL_SERVER_PASSWORD=your-app-password
   EMAIL_SERVER_HOST=smtp.gmail.com
   EMAIL_SERVER_PORT=587
   EMAIL_FROM=your-email@gmail.com
   CRON_SECRET=your-cron-secret
   NEXT_PUBLIC_APP_URL=https://your-app.railway.app
   ```

5. **部署**
   - Railway 會自動偵測並部署您的應用程式
   - 等待建置完成

6. **設定 Cron Jobs**

   使用 Railway 的 Cron Jobs 或外部服務（如 cron-job.org）來觸發定時任務：

   **每天更新三大法人資料（下午 2 點）：**
   ```
   URL: https://your-app.railway.app/api/cron/update-institutional
   Method: GET
   Headers: Authorization: Bearer your-cron-secret
   Schedule: 0 14 * * * (每天 14:00)
   ```

   **每天發送郵件（下午 4 點）：**
   ```
   URL: https://your-app.railway.app/api/cron/send-daily-emails
   Method: GET
   Headers: Authorization: Bearer your-cron-secret
   Schedule: 0 16 * * * (每天 16:00)
   ```

## 📖 使用說明

### 註冊和登入

1. 首次訪問時，點擊「註冊」建立帳號
2. 輸入您的電子郵件和密碼
3. 完成註冊後，使用電子郵件和密碼登入

### 新增持股

1. 點擊右上角的「新增股票」按鈕
2. 選擇「加入持股」
3. 輸入股票代碼（例如：2330）
4. 輸入股票名稱（例如：台積電）
5. 輸入購買股數和價格
6. 可選填手續費和稅金
7. 點擊「確認新增」

### 新增關注名單

1. 點擊「新增股票」按鈕
2. 選擇「加入關注」
3. 輸入股票代碼和名稱
4. 點擊「確認新增」

### 查看損益

- 儀表板會自動顯示：
  - 總成本
  - 總市值
  - 總損益（金額和百分比）
  - 每支股票的詳細損益

### 查看三大法人數據

（功能預留，可在持股明細頁面查看）

## 🔧 開發說明

### 專案結構

```
TWStock/
├── app/                      # Next.js App Router
│   ├── api/                 # API Routes
│   │   ├── auth/           # 認證相關 API
│   │   ├── stocks/         # 股票數據 API
│   │   ├── portfolio/      # 投資組合 API
│   │   ├── watchlist/      # 關注名單 API
│   │   ├── institutional/  # 三大法人 API
│   │   ├── indices/        # 市場指數 API
│   │   └── cron/           # 定時任務 API
│   ├── dashboard/          # 儀表板頁面
│   ├── login/              # 登入頁面
│   └── register/           # 註冊頁面
├── components/              # React 組件
│   ├── ui/                 # 基礎 UI 組件
│   ├── portfolio/          # 投資組合組件
│   ├── watchlist/          # 關注名單組件
│   ├── dashboard/          # 儀表板組件
│   └── modals/             # Modal 組件
├── lib/                     # 工具函數和服務
│   ├── prisma.ts           # Prisma Client
│   ├── auth.ts             # 認證配置
│   ├── stock-service.ts    # 股票服務
│   ├── institutional-service.ts # 三大法人服務
│   ├── email-service.ts    # 郵件服務
│   └── utils.ts            # 工具函數
├── prisma/                  # Prisma 配置
│   └── schema.prisma       # 資料庫 Schema
├── scripts/                 # Python 腳本
│   ├── fetch_stock_data.py # 獲取股價
│   └── fetch_institutional_trades.py # 獲取三大法人
└── public/                  # 靜態資源
```

### 資料庫 Schema

主要資料表：
- `users` - 用戶資料
- `user_settings` - 用戶設定
- `portfolios` - 投資組合
- `transactions` - 交易記錄
- `watchlists` - 關注名單
- `stock_prices` - 股價快取
- `institutional_trades` - 三大法人數據
- `market_indices` - 市場指數
- `dividends` - 股息記錄
- `alerts` - 價格警示

### API 端點

#### 認證
- `POST /api/auth/register` - 註冊
- `POST /api/auth/[...nextauth]` - NextAuth.js 認證

#### 股票數據
- `GET /api/stocks/[symbol]` - 獲取單支股票數據
- `POST /api/stocks/batch` - 批量獲取股票數據
- `GET /api/stocks/search?q={query}` - 搜尋股票

#### 投資組合
- `GET /api/portfolio` - 獲取所有持股
- `POST /api/portfolio` - 新增交易
- `GET /api/portfolio/[id]` - 獲取單一持股詳情
- `DELETE /api/portfolio/[id]` - 刪除持股
- `GET /api/portfolio/summary` - 獲取投資組合摘要

#### 關注名單
- `GET /api/watchlist` - 獲取關注名單
- `POST /api/watchlist` - 新增至關注名單
- `DELETE /api/watchlist/[id]` - 從關注名單移除

#### 三大法人
- `GET /api/institutional/[symbol]?days={days}` - 獲取三大法人數據

#### 市場指數
- `GET /api/indices` - 獲取主要市場指數

#### Cron Jobs
- `GET /api/cron/update-institutional` - 更新三大法人數據
- `GET /api/cron/send-daily-emails` - 發送每日郵件

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📝 授權

MIT License

## 🙏 致謝

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/)
- [yfinance](https://github.com/ranaroussi/yfinance)
- [Railway](https://railway.app/)

## 📞 聯絡方式

如有問題或建議，歡迎開 Issue 或 Pull Request。

---

Made with ❤️ for Taiwan Stock Investors
