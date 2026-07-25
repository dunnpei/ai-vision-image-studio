# AI Vision & Image Studio - GitHub 上傳與版本控管完整操作指南

本指南提供本專案上傳至 GitHub 儲存庫的完整步驟說明，包含**建立庫名**、**首次發布**、**日常程式碼更新**以及**與 Vercel 一鍵自動部署銜接**。

---

## 📌 目錄
1. [第一階段：在 GitHub 建立新儲存庫 (Repository)](#1-第一階段在-github-建立新儲存庫-repository)
2. [第二階段：首次發布程式碼至 GitHub (First Push)](#2-第二階段首次發布程式碼至-github-first-push)
3. [第三階段：日常更新與維護流程 (Daily Commit & Push)](#3-第三階段日常更新與維護流程-daily-commit--push)
4. [第四階段：銜接 Vercel 自動部署 (Vercel Integration)](#4-第四階段銜接-vercel-自動部署-vercel-integration)
5. [⚠️ 安全防護與注意事項 (Security Notice)](#5-⚠️-安全防護與注意事項-security-notice)

---

## 1. 第一階段：在 GitHub 建立新儲存庫 (Repository)

### 步驟說明：
1. 開啟瀏覽器並登入您的 [GitHub 帳號](https://github.com)。
2. 點擊頁面右上角的 **`+`** 圖示，選擇 **`New repository`**。
3. 填寫儲存庫資訊：
   * **Repository name (庫名建議)**：
     - `ai-vision-image-studio` 或 `ai-image-generator-nextjs`
   * **Description (簡介)**：
     - `基於 Next.js App Router + OpenAI GPT-4o Vision & DALL-E 3 / Replicate API 的多模態圖像生成應用程式`
   * **Public / Private (公開/私有)**：
     - 建議選擇 **Private** (私有庫) 或 **Public** (公開庫)。
   * **重要提示 (Initialize this repository with)**：
     - ❌ **請勿勾選** `Add a README file`
     - ❌ **請勿勾選** `Add .gitignore`
     - ❌ **請勿選擇** `Choose a license`
     *(因為我們本地專案目錄中已經建立好了這些檔案，建立空庫可避免後續 Git 衝突。)*
4. 點擊 **`Create repository`** 按鈕建立儲存庫。
5. 複製 GitHub 畫面上顯示的 SSH 或 HTTPS 儲存庫網址，格式如下：
   `https://github.com/您的帳號/ai-vision-image-studio.git`

---

## 2. 第二階段：首次發布程式碼至 GitHub (First Push)

請打開 PowerShell 或 CMD，確保工作目錄位於本專案根目錄 (`D:\Space_Antigravity\20260725_大模型串接`)。

### 步驟 1：初始化本地 Git 儲存庫
若您的目錄尚未初始化 Git，請執行：
```bash
git init
```

### 步驟 2：設定預設分支名稱為 main
```bash
git branch -M main
```

### 步驟 3：檢查與追蹤檔案
將所有專案檔案加入 Git 追蹤區域：
```bash
git add .
```

*（可執行 `git status` 確認追蹤狀態，確保 `.env.local` 與 `node_modules` 已被 `.gitignore` 自動忽略，不會被提交）*

### 步驟 4：進行第一次本地提交 (Initial Commit)
```bash
git commit -m "feat: 首次發布 AI Vision & Image Studio 專案程式碼"
```

### 步驟 5：關聯至遠端 GitHub 儲存庫
將剛才在 GitHub 複製的網址替換進下方的 `<YOUR_GITHUB_URL>`：
```bash
git remote add origin https://github.com/您的帳號/ai-vision-image-studio.git
```

### 步驟 6：將程式碼推送至 GitHub
```bash
git push -u origin main
```
*(推送到 GitHub 後，刷新 GitHub 網頁即可看到完整的專案程式碼！)*

---

## 3. 第三階段：日常更新與維護流程 (Daily Commit & Push)

當您未來對專案進行修改、新增功能或調整 UI 樣式時，請依照下列 3 步驟將更新同步至 GitHub：

### 步驟 1：查看修改狀態
```bash
git status
```

### 步驟 2：將修改過的檔案加入追蹤與暫存
```bash
git add .
```

### 步驟 3：提交變更紀錄 (Commit)
請寫下明確的 commit 訊息說明本次更新重點，例如：
```bash
# 新增功能範例
git commit -m "feat: 增加 A4 解析度預設生圖比例與自訂 API Base URL 功能"

# 修正 Bug 範例
git commit -m "fix: 修復控制面板動態模型標籤顯示問題"
```

### 步驟 4：推送更新至 GitHub (Push)
```bash
git push
```

---

## 4. 第四階段：銜接 Vercel 自動部署 (Vercel Integration)

將專案推送至 GitHub 後，您可以輕鬆與 Vercel 實現 CI/CD 一鍵自動部署：

1. 登入 [Vercel 官網](https://vercel.com)。
2. 點擊 **`Add New...`** -> **`Project`**。
3. 選擇連結您的 **GitHub 帳號**，並找到剛才建立的儲存庫 `ai-vision-image-studio`，點擊 **`Import`**。
### 步驟與欄位填寫說明：
1. 點擊畫面右上角的黑色按鈕 **`Add Environment Variable`**。
2. 在彈出的輸入視窗中填入以下欄位：
   * **Key (變數名稱)**：`OPENAI_API_KEY`
   * **Value (變數值)**：填入您的真實 API 金鑰（例如：`sk-proj-...` 或中轉站金鑰 `sk-...`）
   * **Environment (環境選取)**：勾選 Production, Preview, Development (預設已全選)
3. 點擊 **`Save`** 儲存。

#### 💡 進階環境變數 (若您使用第三方中轉主機，如 yunwu.ai)：
您可再次點擊 **`Add Environment Variable`** 新增：
   * **Key**：`OPENAI_BASE_URL`
   * **Value**：`https://yunwu.ai`

> **備註 (選填說明)**：
> 如果您希望網站部署後，由使用者自己在網頁右上角的「API Key 設定」按鈕中輸入個人金鑰，那麼 Vercel 這裡的環境變數**完全不需要填寫，保持空白即可**！系統會自動使用使用者在前端輸入的自訂 Key。
5. 點擊 **`Deploy`**。
6. **自動持續部署 (Continuous Deployment)**：
   未來您只要在本地端執行 `git push` 推送程式碼至 GitHub，Vercel 就會**自動觸發構建並實時更新上線網站**！

---

## 5. ⚠️ 安全防護與注意事項 (Security Notice)

1. **嚴禁提交 API Key 至 GitHub**：
   * 本專案已建立 `.gitignore` 檔案，自動排除 `.env` 與 `.env.local`。
   * 請絕對不要在前端 `.tsx` 或公用程式碼中寫死 (Hardcode) 任何真實的 API 金鑰！
2. **複製環境變數範本**：
   * 在 GitHub 上他人只需參考 `.env.example` 即可了解需要設定哪些環境變數。
3. **版本分支管理（進階）**：
   * 若未來開發大版本功能，建議可建立分支進行開發：
     ```bash
     git checkout -b feature/new-ui
     ```
