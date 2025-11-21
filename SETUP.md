# TWStock 設定指南

這份文件提供詳細的設定步驟，幫助您快速啟動 TWStock 應用程式。

## 目錄

1. [環境需求](#環境需求)
2. [本地開發設定](#本地開發設定)
3. [資料庫設定](#資料庫設定)
4. [郵件服務設定](#郵件服務設定)
5. [Python 環境設定](#python-環境設定)
6. [Railway 部署設定](#railway-部署設定)
7. [常見問題](#常見問題)

## 環境需求

### 必需軟體

- **Node.js**: 版本 18.x 或更高
- **Python**: 版本 3.8 或更高
- **PostgreSQL**: 版本 14.x 或更高（本地開發）
- **npm** 或 **yarn**: 套件管理工具

### 檢查版本

```bash
node --version   # 應該顯示 v18.x 或更高
python3 --version # 應該顯示 3.8.x 或更高
psql --version   # 應該顯示 14.x 或更高
```

## 本地開發設定

### 1. Clone 專案

```bash
git clone <your-repository-url>
cd TWStock
```

### 2. 安裝 Node.js 依賴

```bash
npm install
```

如果遇到錯誤，請嘗試：

```bash
rm -rf node_modules package-lock.json
npm install
```

### 3. 安裝 Python 依賴

```bash
pip3 install -r requirements.txt
```

或使用虛擬環境：

```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. 設定環境變數

複製範例環境變數文件：

```bash
cp .env.example .env
```

編輯 `.env` 文件，填入您的配置。

## 資料庫設定

### 選項 1: 使用本地 PostgreSQL

1. **安裝 PostgreSQL**

   - macOS: `brew install postgresql`
   - Ubuntu: `sudo apt-get install postgresql`
   - Windows: 從 [官網](https://www.postgresql.org/download/) 下載安裝

2. **建立資料庫**

```bash
psql postgres
CREATE DATABASE twstock;
CREATE USER twstock_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE twstock TO twstock_user;
\q
```

3. **更新 .env 中的 DATABASE_URL**

```env
DATABASE_URL="postgresql://twstock_user:your_password@localhost:5432/twstock?schema=public"
```

### 選項 2: 使用 Railway PostgreSQL

1. 前往 [Railway](https://railway.app)
2. 建立新的 PostgreSQL 資料庫
3. 複製連接字串到 `.env` 的 `DATABASE_URL`

### 執行資料庫遷移

```bash
# 生成 Prisma Client
npx prisma generate

# 執行遷移
npx prisma migrate dev --name init

# (可選) 打開 Prisma Studio 查看資料庫
npx prisma studio
```

## 郵件服務設定

### 使用 Gmail

1. **啟用兩步驟驗證**
   - 前往 https://myaccount.google.com/security
   - 啟用「兩步驟驗證」

2. **生成應用程式密碼**
   - 前往 https://myaccount.google.com/apppasswords
   - 選擇「郵件」和「其他（自訂名稱）」
   - 輸入「TWStock」
   - 複製生成的 16 位密碼

3. **更新 .env**

```env
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-16-digit-app-password"
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_FROM="your-email@gmail.com"
```

### 使用其他郵件服務

#### Outlook/Hotmail

```env
EMAIL_SERVER_HOST="smtp-mail.outlook.com"
EMAIL_SERVER_PORT="587"
```

#### Yahoo

```env
EMAIL_SERVER_HOST="smtp.mail.yahoo.com"
EMAIL_SERVER_PORT="587"
```

#### 自訂 SMTP

```env
EMAIL_SERVER_HOST="your-smtp-host.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-username"
EMAIL_SERVER_PASSWORD="your-password"
```

## Python 環境設定

### 測試 Python 腳本

1. **測試獲取股價**

```bash
python3 scripts/fetch_stock_data.py stock 2330.TW
```

預期輸出：包含台積電股價的 JSON 數據

2. **測試獲取三大法人**

```bash
python3 scripts/fetch_institutional_trades.py stock 2330
```

### 疑難排解

如果遇到 `yfinance` 錯誤：

```bash
pip3 install --upgrade yfinance
```

如果遇到 `pandas` 錯誤：

```bash
pip3 install --upgrade pandas
```

## NextAuth 設定

生成安全的 SECRET：

```bash
openssl rand -base64 32
```

將結果填入 `.env`：

```env
NEXTAUTH_SECRET="your-generated-secret"
```

## 啟動應用程式

### 開發模式

```bash
npm run dev
```

應用程式將在 http://localhost:3000 啟動

### 建置生產版本

```bash
npm run build
npm start
```

## Railway 部署設定

### 1. 準備專案

確保所有變更已提交到 Git：

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. 建立 Railway 專案

1. 前往 https://railway.app
2. 點擊 "New Project"
3. 選擇 "Deploy from GitHub repo"
4. 選擇您的儲存庫

### 3. 新增 PostgreSQL

1. 在專案中點擊 "New"
2. 選擇 "Database" → "Add PostgreSQL"
3. Railway 會自動設定 `DATABASE_URL`

### 4. 設定環境變數

在 Railway 專案的 Variables 標籤中加入：

```
NEXTAUTH_URL=https://your-app.railway.app
NEXTAUTH_SECRET=<your-secret>
EMAIL_SERVER_USER=<your-email>
EMAIL_SERVER_PASSWORD=<your-password>
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_FROM=<your-email>
CRON_SECRET=<random-secret>
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
```

### 5. 部署

Railway 會自動偵測並部署。等待建置完成後，訪問您的應用程式 URL。

### 6. 設定 Cron Jobs

使用 [cron-job.org](https://cron-job.org) 或 Railway 的 Cron Jobs：

**更新三大法人（每天 14:00）：**
```
URL: https://your-app.railway.app/api/cron/update-institutional
Method: GET
Headers: Authorization: Bearer <your-cron-secret>
Schedule: 0 14 * * *
```

**發送每日郵件（每天 16:00）：**
```
URL: https://your-app.railway.app/api/cron/send-daily-emails
Method: GET
Headers: Authorization: Bearer <your-cron-secret>
Schedule: 0 16 * * *
```

## 常見問題

### Q: 無法連接到資料庫

**A:** 檢查：
1. PostgreSQL 服務是否正在運行
2. `DATABASE_URL` 格式是否正確
3. 使用者權限是否足夠

### Q: Python 腳本執行失敗

**A:** 確保：
1. Python 3.8+ 已安裝
2. 所有 Python 依賴已安裝：`pip3 install -r requirements.txt`
3. 腳本有執行權限：`chmod +x scripts/*.py`

### Q: 郵件無法發送

**A:** 檢查：
1. Gmail 應用程式密碼是否正確（不是 Gmail 密碼）
2. 兩步驟驗證是否已啟用
3. SMTP 設定是否正確

### Q: 登入後被重定向到登入頁

**A:** 檢查：
1. `NEXTAUTH_SECRET` 是否已設定
2. `NEXTAUTH_URL` 是否正確
3. Cookie 是否被瀏覽器阻擋

### Q: Railway 部署失敗

**A:** 檢查：
1. 所有環境變數是否已設定
2. `DATABASE_URL` 是否來自 Railway PostgreSQL
3. 建置日誌中的錯誤訊息

### Q: 股價數據無法更新

**A:**
1. 檢查網路連接
2. yfinance 可能暫時無法訪問，稍後再試
3. 確認股票代碼格式正確（台股需加 .TW 後綴）

## 獲取幫助

如果您遇到其他問題：

1. 查看 [GitHub Issues](https://github.com/your-repo/issues)
2. 查閱 [README.md](./README.md)
3. 開啟新的 Issue 描述您的問題

## 下一步

- 閱讀 [README.md](./README.md) 了解功能詳情
- 查看 [API 文檔](./docs/API.md)（如果有）
- 開始使用應用程式！

---

祝您使用愉快！ 🚀
