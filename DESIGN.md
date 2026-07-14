---
name: AI Arena
description: 三家 AI 並排比對工具的設計系統。玻璃擬態風格（Glassmorphism），深宇宙背景搭配三家 AI 品牌色浮動面板，強調清晰、沉浸、高質感。
version: "1.0"

colors:
  # 背景層
  background-deep: "#07091A"
  background-mid: "#0D1130"
  background-glow: "rgba(99, 102, 241, 0.15)"

  # 玻璃面板
  glass-surface: "rgba(255, 255, 255, 0.06)"
  glass-border: "rgba(255, 255, 255, 0.12)"
  glass-hover: "rgba(255, 255, 255, 0.10)"

  # 三家 AI 品牌色（欄位 accent）
  claude-primary: "#E8916A"
  claude-glow: "rgba(232, 145, 106, 0.20)"
  gpt-primary: "#10A37F"
  gpt-glow: "rgba(16, 163, 127, 0.20)"
  gemini-primary: "#4A90D9"
  gemini-glow: "rgba(74, 144, 217, 0.20)"

  # 文字
  text-primary: "rgba(255, 255, 255, 0.92)"
  text-secondary: "rgba(255, 255, 255, 0.55)"
  text-muted: "rgba(255, 255, 255, 0.30)"

  # 功能色
  success: "#34D399"
  error: "#F87171"
  warning: "#FBBF24"
  neutral: "rgba(255, 255, 255, 0.08)"

typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.04em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.06em"
  code:
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.6

rounded:
  sm: 6px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px

components:
  glass-panel:
    backgroundColor: "{colors.glass-surface}"
    borderColor: "{colors.glass-border}"
    rounded: "{rounded.lg}"
    padding: "24px"

  button-primary:
    backgroundColor: "rgba(255, 255, 255, 0.12)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"

  button-send:
    backgroundColor: "{colors.claude-primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 24px"

  input-field:
    backgroundColor: "rgba(255, 255, 255, 0.05)"
    borderColor: "{colors.glass-border}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "12px 16px"

  api-key-input:
    backgroundColor: "rgba(255, 255, 255, 0.04)"
    borderColor: "{colors.glass-border}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"

  model-badge:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.full}"
    padding: "4px 10px"

  column-claude:
    accentColor: "{colors.claude-primary}"
    glowColor: "{colors.claude-glow}"
    borderTopColor: "{colors.claude-primary}"

  column-gpt:
    accentColor: "{colors.gpt-primary}"
    glowColor: "{colors.gpt-glow}"
    borderTopColor: "{colors.gpt-primary}"

  column-gemini:
    accentColor: "{colors.gemini-primary}"
    glowColor: "{colors.gemini-glow}"
    borderTopColor: "{colors.gemini-primary}"
---

## Overview

**AI Arena** 是一個三家 AI 並排比對工具。設計核心概念是「競技場中的指揮台」——使用者是裁判，三家 AI 是選手，各自在自己的半透明玻璃艙中同步作答。

視覺風格採用 **Cosmic Glassmorphism**：深宇宙色背景提供沉浸感，三個玻璃面板以各自 AI 的品牌色作為頂部邊框與 glow 光暈區分身份，讓使用者一眼就能辨識「這欄是誰的回答」。情緒基調是冷靜、專注、高科技感，適合需要仔細比對內容的分析型使用者。

## Colors

背景使用雙層深宇宙色：`background-deep` (#07091A) 作為最底層，`background-mid` (#0D1130) 作為輕微漸層過渡，中央加入一圈 `background-glow` 紫色暈光製造深度感。

三家 AI 品牌色系統：
- **Claude（橙）**：`claude-primary` #E8916A，頂部邊框 + 標題 accent + 按鈕高亮
- **GPT（綠）**：`gpt-primary` #10A37F，同上
- **Gemini（藍）**：`gemini-primary` #4A90D9，同上

每個品牌色對應一個低透明度 glow 色（20% 透明度），用於面板懸停時的背景光暈，強化「每家欄位有自己生命力」的視覺感。

文字分三層：`text-primary`（92% 白）用於 AI 回答正文，`text-secondary`（55% 白）用於標籤和說明，`text-muted`（30% 白）用於佔位符和輔助資訊。

## Typography

全站使用 **Inter**，它在深色背景下渲染清晰，中文字元支援良好。等寬字體用 JetBrains Mono 處理程式碼區塊。

字級策略：頂部工具名稱用 display（24px Bold），欄位標題（Claude / GPT / Gemini）用 heading（14px Semibold + 寬字距），AI 回答內文用 body（14px / 1.7 行高確保閱讀舒適），API Key 輸入欄標籤、模型選單標籤用 label（12px）。

## Elevation & Depth

深度透過三層玻璃擬態實現，不使用傳統陰影：

- **Layer 0（背景）**：深宇宙漸層 + 中央紫色暈光
- **Layer 1（主面板）**：`glass-surface`（6% 白透明度）+ `glass-border`（12% 白邊框）+ 20px `backdrop-filter: blur`
- **Layer 2（互動元素）**：懸停時 `glass-hover`（10% 白）+ 品牌色 glow 光暈擴散

三個 AI 欄位頂部有 2px 品牌色實線邊框，視覺上像「彩色光條」從面板頂端射出，強化欄位辨識。

## Shapes

形狀語言是「柔性科技」。所有面板、卡片使用 `rounded.lg`（16px），輸入框使用 `rounded.md`（12px），小型徽章、標籤使用 `rounded.full`（膠囊形）。避免尖角（0px）和過大圓角（32px+），維持精密儀器的質感。

## Layout

整體採用三欄固定比例佈局，最大寬度 1400px，水平置中。

**頂部區域（Header）**：
- 左：工具名稱 AI Arena
- 中：全域 Loading 狀態指示器
- 右：設定入口（API Key 管理）

**中間區域（Controls）**：
- 模型選擇列（三家各自獨立的下拉選單 + 啟用 Checkbox）
- PDF 上傳區（拖放或點擊，附已上傳文件標籤）

**主體區域（Three Columns）**：
- 三欄等寬並排，各欄頂部有品牌色光條 + AI 名稱 + 當前模型徽章
- 欄內為對話歷史（使用者訊息 / AI 回答交替顯示）
- 每條 AI 回答右下角有「複製」按鈕

**底部區域（Input）**：
- 跨三欄共用的訊息輸入框（全寬）
- 右側：發送按鈕、下載全部按鈕
- 輸入框上方：內容轉換快速按鈕列（摘要 / 關鍵字 / 目錄 / FAQ）

**Loading 狀態**：
三欄各自顯示品牌色脈衝動畫（骨架屏 + 光條掃描效果），明確傳達「正在等待，尚未當機」。

## Components

**glass-panel**：主要內容容器，backdrop-blur 20px，6% 白透明背景，12% 白邊框，16px 圓角。

**AI 欄位**：繼承 glass-panel，頂部增加 2px 品牌色實線。懸停時背景改為品牌 glow 色（20% 透明度）。

**button-send**：使用當前主 accent 色（預設 Claude 橙）作為背景，白色文字，確保視覺重心在發送動作上。

**input-field**：5% 白透明背景，聚焦時邊框改為 `glass-hover`（10% 白）+ 微弱品牌色外發光。

**model-badge**：膠囊形小標籤，8% 白背景，顯示當前選擇的模型名稱（如「Sonnet 4.6」）。

**api-key-input**：密碼輸入框樣式，右側有「驗證」按鈕，驗證成功顯示綠色 ✓，失敗顯示紅色 ✗。

**loading-pulse**：品牌色（依欄位不同）的水平掃描光條動畫，疊加在灰色骨架文字塊上，每 1.5 秒一個週期。
