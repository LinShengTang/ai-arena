# AI Arena — 完整執行 Spec v1.1
> 交給 Claude Code 執行。請依本文件從零建立專案，不參考任何既有程式碼。

---

## 一、專案定位

一個純前端工具，讓使用者輸入一個 prompt（可附 PDF），Claude / GPT / Gemini 三家 AI 同時回答，結果並排顯示於三欄。支援多輪對話、模型選擇、API Key 自管。部署至 GitHub Pages。

---

## 二、技術規格

| 項目 | 規格 |
|------|------|
| 檔案結構 | `index.html` + `app.js` + `style.css`（三檔分離） |
| 框架 | 原生 HTML / CSS / JavaScript，無任何框架 |
| 外部依賴 | PDF.js（CDN，解析 PDF）、無其他依賴 |
| CSP | 禁止 `unsafe-inline`，所有事件綁定在 `app.js` 內以 `addEventListener` 實作 |
| API Key 儲存 | 僅用 `sessionStorage`，關閉分頁即自動清除，絕對不寫入 `localStorage` |
| 部署目標 | GitHub Pages（靜態，無後端） |

---

## 三、設計系統（DESIGN.md Token）

```yaml
name: AI Arena
colors:
  background-deep: "#07091A"
  background-mid: "#0D1130"
  glass-surface: "rgba(255, 255, 255, 0.06)"
  glass-border: "rgba(255, 255, 255, 0.12)"
  glass-hover: "rgba(255, 255, 255, 0.10)"
  claude-primary: "#E8916A"
  claude-glow: "rgba(232, 145, 106, 0.20)"
  gpt-primary: "#10A37F"
  gpt-glow: "rgba(16, 163, 127, 0.20)"
  gemini-primary: "#4A90D9"
  gemini-glow: "rgba(74, 144, 217, 0.20)"
  text-primary: "rgba(255, 255, 255, 0.92)"
  text-secondary: "rgba(255, 255, 255, 0.55)"
  text-muted: "rgba(255, 255, 255, 0.30)"
  success: "#34D399"
  error: "#F87171"
  neutral: "rgba(255, 255, 255, 0.08)"
typography:
  body: { fontFamily: "Inter, system-ui, sans-serif", fontSize: 14px, lineHeight: 1.7 }
  heading: { fontSize: 14px, fontWeight: 600, letterSpacing: "0.04em" }
  label: { fontSize: 12px, fontWeight: 500, letterSpacing: "0.06em" }
rounded:
  sm: 6px
  md: 12px
  lg: 16px
  full: 9999px
```

**視覺語言**：Cosmic Glassmorphism。深宇宙背景（雙層深藍）+ 三塊半透明玻璃面板浮動其上。每個面板頂部有 2px 品牌色光條（Claude 橙 / GPT 綠 / Gemini 藍），懸停時背景擴散品牌 glow 光暈。全站 `backdrop-filter: blur(20px)`。

---

## 四、版面結構

```
┌─────────────────────────────────────────────────────┐
│  HEADER：AI Arena 標題 ／ Loading 指示器 ／ 設定按鈕  │
├─────────────────────────────────────────────────────┤
│  CONTROLS：                                          │
│  [☑ Claude  模型▼]  [☑ GPT  模型▼]  [☑ Gemini 模型▼]│
│  [📎 上傳 PDF]  [已上傳：filename.pdf ✕]             │
│  [摘要] [關鍵字] [目錄] [FAQ]  ← 快速 Prompt 按鈕    │
├──────────────┬──────────────┬───────────────────────┤
│  CLAUDE 欄   │   GPT 欄     │   GEMINI 欄           │
│  （橙色光條） │  （綠色光條） │  （藍色光條）          │
│              │              │                       │
│  對話歷史    │  對話歷史     │  對話歷史              │
│  （多輪）    │  （多輪）     │  （多輪）              │
│              │              │                       │
│  [複製此欄]  │  [複製此欄]  │  [複製此欄]            │
├──────────────┴──────────────┴───────────────────────┤
│  INPUT：                                             │
│  ┌─────────────────────────────────┐ [發送] [下載全部]│
│  │ 輸入訊息…                        │                 │
│  └─────────────────────────────────┘                 │
└─────────────────────────────────────────────────────┘
```

---

## 五、功能需求

### 5.1 API Key 管理

- 介面右上角「設定」按鈕，點擊展開 Modal
- Modal 內三個輸入欄（Claude / GPT / Gemini），各自為 `type="password"`
- 每欄右側有獨立「驗證」按鈕
- 驗證方式：送出最小測試請求至各家 API，成功顯示 ✓（綠），失敗顯示 ✗（紅）+ 錯誤原因
- Key 儲存於 `sessionStorage`，關閉分頁自動消失
- 無 Key 的欄位自動跳過，不參與這次對話

### 5.2 模型選擇

每家 AI 獨立的下拉選單，可選項如下：

**Claude**（預設 `claude-sonnet-4-6`）：
- Claude Opus 4.8 → `claude-opus-4-8`
- Claude Sonnet 4.6 → `claude-sonnet-4-6`
- Claude Haiku 4.5 → `claude-haiku-4-5-20251001`

**GPT**（動態抓取，預設優先選 `gpt-5.4`）：
- GPT Key 驗證成功後，自動呼叫 `GET https://api.openai.com/v1/models`（帶 Bearer Token）
- 過濾回傳清單中 `id` 包含 `gpt` 且不包含 `instruct`、`audio`、`realtime`、`image` 的項目
- 依 `id` 字母排序後動態填入下拉選單
- 預設選中 `gpt-5.4`，若不存在則選清單第一項
- 若 Key 尚未驗證，下拉顯示「請先驗證 API Key」並禁用

**Gemini**（預設 `gemini-3.5-flash`）：
- Gemini 3.5 Flash → `gemini-3.5-flash`
- Gemini 3.1 Pro → `gemini-3.1-pro`
- Gemini 2.5 Flash → `gemini-2.5-flash`
- Gemini 2.5 Flash-Lite → `gemini-2.5-flash-lite`

### 5.3 欄位啟用控制

每家欄位頂部有 Checkbox，可勾選哪幾家參與本次對話。未勾選的欄位顯示為暗色停用狀態，不送出請求。

### 5.4 PDF 上傳

- 點擊或拖放上傳，接受 `.pdf` 格式
- 使用 PDF.js 提取文字內容
- 上傳成功後顯示檔名標籤（附 ✕ 移除按鈕）
- 同一份 PDF 內容送給所有勾選的家
- PDF 內容作為 system message 的一部分注入

### 5.5 快速 Prompt 按鈕

Controls 區有四個快速按鈕，點擊後自動填入輸入框並送出：

| 按鈕 | 注入的 Prompt |
|------|--------------|
| 摘要 | 請針對上述文件或對話內容，提供簡潔的重點摘要。 |
| 關鍵字 | 請萃取上述內容的關鍵字或核心概念，以條列方式呈現。 |
| 目錄 | 請根據上述內容，生成結構化目錄（含主題與子主題）。 |
| FAQ | 請針對上述內容，生成 5 個常見問題及對應解答。 |

### 5.6 多輪對話

- 對話歷史在 session 內持續累積（JS 陣列維護）
- 每次發送時，將完整歷史傳入 API（messages 陣列）
- 三家各自維護獨立的對話歷史
- 每欄頂部有「清除對話」按鈕

### 5.7 Loading 狀態

- 發送後，三欄（有勾選者）同步顯示 Loading 動畫
- 動畫形式：品牌色脈衝光條 + 灰色骨架文字塊（3 行）
- Header 中央顯示「正在等待回應…」文字
- **全部跑完後才同時顯示三欄結果**（使用 `Promise.all`）
- 若其中一家失敗，該欄顯示錯誤訊息（紅色），其他欄正常顯示

### 5.8 回答操作

- 每條 AI 回答右下角有「複製」按鈕（複製該條回答文字）
- 每欄底部有「複製此欄全部」按鈕
- Header 右側有「下載全部」按鈕 → 生成 `.txt` 檔，格式為：

```
=== AI Arena 對話記錄 ===
日期：YYYY-MM-DD HH:MM

=== Claude（Sonnet 4.6）===
[使用者] ...
[Claude] ...

=== GPT（GPT-5.4）===
[使用者] ...
[GPT] ...

=== Gemini（3.5 Flash）===
[使用者] ...
[Gemini] ...
```

### 5.9 引用來源標記

System prompt 內加入指令：

```
當你的回答參考了使用者上傳的文件內容時，請在相關段落後標注【文件參考】。
如有多份文件，請標注【來源：{文件名}】。
```

---

## 六、API 串接規格

### Claude API
```
POST https://api.anthropic.com/v1/messages
Headers:
  x-api-key: {CLAUDE_KEY}
  anthropic-version: 2023-06-01
  content-type: application/json
Body:
  model: {selected_model}
  max_tokens: 4096
  system: {system_prompt}
  messages: [{role, content}...]
```

### GPT API
```
POST https://api.openai.com/v1/chat/completions
Headers:
  Authorization: Bearer {GPT_KEY}
  content-type: application/json
Body:
  model: {selected_model}
  max_tokens: 4096
  messages: [{role, content}...]
```

### Gemini API
```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_KEY}
Headers:
  content-type: application/json
Body:
  contents: [{role, parts: [{text}]}...]
  systemInstruction: {system_prompt}
```

---

## 七、CSP 規則

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://cdnjs.cloudflare.com;
  style-src 'self' https://fonts.googleapis.com;
  font-src https://fonts.gstatic.com;
  connect-src 'self'
    https://api.anthropic.com
    https://api.openai.com
    https://generativelanguage.googleapis.com;
  img-src 'self' data:;
  object-src 'none';
">
```

---

## 八、免責聲明（顯示於介面底部）

> 本工具直接從您的瀏覽器呼叫各家 AI API。您的 API Key 僅儲存於當前瀏覽器 Session，關閉分頁後自動清除，不經過任何第三方伺服器。上傳的文件內容會依據各家 API 政策處理，請勿上傳機密或個人敏感資料。

---

## 九、執行指令

請依以下順序建立專案：

1. 建立 `index.html`、`app.js`、`style.css` 三個檔案
2. `index.html` 不含任何 inline script 或 inline style，所有互動邏輯在 `app.js`，所有樣式在 `style.css`
3. 依 DESIGN.md Token 實作視覺系統（CSS Custom Properties）
4. 依本 Spec 第四至八節實作所有功能
5. 完成後逐一確認：
   - CSP 規則無 `unsafe-inline`
   - `sessionStorage` 使用正確（非 `localStorage`）
   - `Promise.all` 同步顯示三欄結果
   - 無任何 `onclick=` 等 inline event handler 殘留
6. 最後說明每個檔案修改了哪些區塊
