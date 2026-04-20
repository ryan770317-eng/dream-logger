# Dream Logger — 程式總覽

## 專案定位

**夢境記錄器**，一個 PWA（Progressive Web App），讓使用者用語音說出剛醒來的夢，自動轉文字、AI 分析、存入資料庫，之後可瀏覽和搜尋。部署在 Vercel：`dream-logger.vercel.app`。

---

## 技術堆疊

| 層級 | 技術 |
|------|------|
| 框架 | Next.js 16.2.2（App Router，Turbopack） |
| 語言 | TypeScript + React 19 |
| 樣式 | Tailwind CSS v4 |
| 語音辨識 | 瀏覽器原生 Web Speech API（`zh-TW`） |
| AI 分析 | Anthropic Claude (`claude-sonnet-4-6`) |
| 資料庫 | Firebase Firestore |
| 認證 | 無密碼，僅用暱稱 + localStorage |
| PWA | Service Worker + Web Manifest |

---

## 檔案結構

```
app/
  page.tsx                 # 登入頁（輸入暱稱）
  record/page.tsx          # 主錄音頁
  dreams/page.tsx          # 夢境清單 + 搜尋
  dreams/[id]/page.tsx     # 單則夢境詳情
  api/
    analyze/route.ts       # Claude AI 分析（唯一使用中的 API）
    transcribe/route.ts    # OpenAI Whisper（舊版，目前未使用）
components/
  RecordButton.tsx         # 麥克風按鈕，呼叫 Web Speech API
  PreviewModal.tsx         # 分析結果預覽 + 編輯
  DreamCard.tsx            # 清單卡片
  DreamDetail.tsx          # 詳情顯示
lib/
  types.ts                 # Dream / DreamAnalysis / User 介面
  firebase.ts              # Firestore 初始化
  auth.ts                  # localStorage 暱稱讀寫
```

---

## 使用者流程

```
輸入暱稱 → 登入
    ↓
點擊麥克風，說出夢境（Web Speech API 即時轉文字）
    ↓
停止錄音，文字存入「待分析」列表
    ↓
點擊「分析」→ POST /api/analyze（Claude）
    ↓
Claude 回傳結構化 JSON，顯示於 PreviewModal
    ↓
使用者可編輯後儲存 → 寫入 Firestore
    ↓
跳轉至「我的夢境」清單
```

---

## 資料模型（Firestore `dreams` collection）

```typescript
interface Dream {
  userId: string;                  // 暱稱
  createdAt: Timestamp;
  transcript: string;              // 原始語音轉文字
  summary: string;                 // 一句話摘要
  characters: string[];            // 出現的人物
  locations: string[];             // 地點
  emotion: string;                 // 整體情緒
  symbols: string[];               // 符號 / 意象
  numbers: { value, context }[];   // 夢中數字及上下文
  lucidity: string;                // 清醒度
  tags: string[];                  // 自動生成，用於篩選
}
```

---

## API 端點

### `POST /api/analyze`
- 輸入：`{ transcript: string }`
- 動作：呼叫 Claude `claude-sonnet-4-6`，以繁體中文解析夢境結構
- 輸出：`DreamAnalysis` JSON
- 環境變數：`ANTHROPIC_API_KEY`

### `POST /api/transcribe`（保留但未使用）
- 輸入：音訊 FormData
- 動作：呼叫 OpenAI Whisper `whisper-1`
- 環境變數：`OPENAI_API_KEY`

---

## 已知問題 & 本次修正

| 問題 | 根因 | 狀態 |
|------|------|------|
| 分析永遠失敗 | `analyze/route.ts` 使用了不存在的 model ID `claude-sonnet-4-20250514` | ✅ 已修正為 `claude-sonnet-4-6` |
| Vercel 一直跑舊版 | `RecordButton.tsx` 有 TypeScript build 錯誤（`SpeechRecognition` 型別在 build 環境找不到），導致每次 Vercel 部署失敗 | ✅ 已修正，用 `any` 替代 |
| JSON parse 脆弱 | Claude 若回傳 markdown code block 包住的 JSON 會直接 crash | ✅ 已加 strip + try-catch |

---

## 待評估面向

1. **認證安全性**：僅用暱稱登入，沒有任何密碼或 token，任何人知道暱稱即可存取他人資料
2. **Firestore 安全規則**：目前只靠前端 `userId` 欄位過濾，未看到 server-side 規則設定
3. **Web Speech API 相容性**：僅支援 Chrome 和 Safari，不支援 Firefox
4. **無錯誤重試機制**：API 失敗只能手動按「重試」
