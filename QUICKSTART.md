# 🚀 快速啟動指南

這份文件提供最快速的方式讓 TWStock 在您的環境中運行。

## 📋 前置檢查

```bash
# 檢查 Node.js 版本（需要 18.18+）
node --version

# 檢查 Python 版本（需要 3.8+）
python3 --version

# 檢查 PostgreSQL（如果使用本地資料庫）
psql --version
```

## ⚡ 5 分鐘快速啟動

### 1. Clone 並安裝

```bash
git clone <your-repo-url>
cd TWStock

# 安裝 Node.js 依賴
npm install --ignore-scripts

# 安裝 Python 依賴
pip3 install -r requirements.txt
```

### 2. 設定環境變數

```bash
# 複製環境變數範例
cp .env.example .env

# 編輯 .env（最少需要設定以下項目）
# - DATABASE_URL (PostgreSQL 連接字串)
# - NEXTAUTH_SECRET (執行: openssl rand -base64 32)
# - EMAIL_SERVER_* (Gmail 設定)
```

### 3. 設定資料庫

```bash
# 生成 Prisma Client
npx prisma generate

# 執行資料庫遷移
npx prisma migrate dev --name init
```

### 4. 啟動開發伺服器

```bash
npm run dev
```

訪問 http://localhost:3000 🎉

## 🌐 Railway 部署（3 分鐘）

### 方法一：透過 GitHub

1. 推送代碼到 GitHub
2. 前往 [Railway](https://railway.app)
3. 點擊 "New Project" → "Deploy from GitHub repo"
4. 選擇您的儲存庫
5. 新增 PostgreSQL：點擊 "New" → "Database" → "Add PostgreSQL"
6. 設定環境變數（見下方）
7. 部署完成！

### 方法二：使用 Railway CLI

```bash
# 安裝 Railway CLI
npm i -g @railway/cli

# 登入
railway login

# 初始化專案
railway init

# 新增 PostgreSQL
railway add

# 部署
railway up
```

### 必需的環境變數

在 Railway 專案設定中加入：

```env
NEXTAUTH_URL=https://your-app.railway.app
NEXTAUTH_SECRET=<生成的密鑰>
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=<Gmail 應用程式密碼>
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_FROM=your-email@gmail.com
CRON_SECRET=<隨機密鑰>
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
```

## 📧 Gmail 設定（2 分鐘）

1. 前往 https://myaccount.google.com/security
2. 啟用「兩步驟驗證」
3. 前往 https://myaccount.google.com/apppasswords
4. 生成新的應用程式密碼（選擇「郵件」和「其他」）
5. 複製 16 位密碼到 `.env` 的 `EMAIL_SERVER_PASSWORD`

## 🔄 設定 Cron Jobs（可選）

使用 [cron-job.org](https://cron-job.org) 免費服務：

### 每日更新三大法人（14:00）

- URL: `https://your-app.railway.app/api/cron/update-institutional`
- Method: GET
- Headers: `Authorization: Bearer <your-cron-secret>`
- Schedule: `0 14 * * *`

### 每日郵件通知（16:00）

- URL: `https://your-app.railway.app/api/cron/send-daily-emails`
- Method: GET
- Headers: `Authorization: Bearer <your-cron-secret>`
- Schedule: `0 16 * * *`

## 🧪 測試 Python 腳本

```bash
# 測試獲取台積電股價
python3 scripts/fetch_stock_data.py stock 2330.TW

# 測試獲取三大法人
python3 scripts/fetch_institutional_trades.py stock 2330

# 測試獲取市場指數
python3 scripts/fetch_stock_data.py indices
```

## 🐛 常見問題快速解決

### Prisma 生成失敗

```bash
# 跳過 checksum 驗證
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
```

### Node.js 版本太舊

```bash
# 使用 nvm 安裝 Node.js 18
nvm install 18
nvm use 18
```

### 資料庫連接失敗

```bash
# 檢查 PostgreSQL 是否運行
sudo systemctl status postgresql  # Linux
brew services list                 # macOS

# 測試連接
psql $DATABASE_URL
```

### 郵件發送失敗

- 確認已啟用兩步驟驗證
- 使用應用程式密碼（不是 Gmail 密碼）
- 檢查 SMTP 設定是否正確

### Railway 建置失敗

檢查建置日誌中的錯誤：
- 環境變數是否都已設定
- DATABASE_URL 是否來自 Railway PostgreSQL
- Node.js 版本是否符合要求

## 📱 開始使用

1. 訪問您的應用程式 URL
2. 點擊「註冊」建立帳號
3. 登入後點擊「新增股票」
4. 選擇「加入持股」或「加入關注」
5. 輸入股票代碼（例如：2330）和資訊
6. 開始追蹤您的投資組合！

## 🎯 下一步

- 閱讀 [README.md](./README.md) 了解完整功能
- 查看 [SETUP.md](./SETUP.md) 了解詳細設定
- 探索 API 端點（`/api/*`）

## 💡 提示

- 股票代碼格式：台股使用純數字（如 `2330`），系統會自動加上 `.TW` 後綴
- 每日郵件會在您設定的時間自動發送（預設 16:00）
- 股價每 5 秒自動更新，無需手動重新整理
- 支援深色模式，會自動跟隨系統設定

## 🆘 需要幫助？

- 查看 [GitHub Issues](https://github.com/your-repo/issues)
- 閱讀完整文檔：[SETUP.md](./SETUP.md)
- 檢查環境變數是否正確設定

---

祝您投資順利！📈
