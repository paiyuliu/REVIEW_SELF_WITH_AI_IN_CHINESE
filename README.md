# 命盤資料整理器

在瀏覽器裡計算八字與紫微斗數命盤，連同人生事件整理成 Markdown／JSON，方便貼給 Gemini、Copilot 等 AI 做論命與陪伴式對話。

- 純靜態網站（HTML + ES modules），**沒有後端、沒有建置步驟**。
- 所有計算都在使用者的瀏覽器內完成；不儲存、不上傳、不呼叫任何 AI。頁面設有 CSP，只允許載入同源檔案。
- 內建提示詞範本（療癒陪伴／中性分析／不附提示詞），並提供一鍵複製與下載。

## 本機使用

任何靜態伺服器都可以，例如：

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

然後開啟 http://127.0.0.1:8000。不要直接用 `file://` 開啟（瀏覽器會擋載入範例檔）。

## 目錄

```
  index.html, css/style.css
  js/ziwei.js    紫微排盤（包裝 iztro）
  js/report.js   八字（lunar-typescript）與報告組裝、年份擷取
  js/format.js   AI 用 Markdown／JSON 格式
  js/prompts.js  提示詞範本
  js/main.js     UI
  vendor/        iztro 2.6.3 與 lunar-typescript 1.8.6（MIT，附授權檔）
  example_history.txt  預設的範例人生事件
  tests/parity.test.mjs   對照測試
  tests/golden/           黃金資料（見下）
  tests/e2e_playwright.py 瀏覽器端對端檢查
```

## 測試

```bash
npm test                       # 對照測試，需要 Node 20+
pip install playwright && playwright install chromium
uv run --no-project --with playwright python tests/e2e_playwright.py # 端對端：結果內容、複製、無對外請求、無瀏覽器錯誤
```

`tests/golden/*.json` 是改寫前 Python 版（Streamlit + lunar-python + iztro 子程序，原專案 commit `cc5bc92`，本 repo 不含）對 8 組輸入產生的輸出，包含早子／晚子、立春交界、閏月、性別未提供、無年份等情況。對照測試要求新版的報告物件、Markdown 與 JSON 與這些資料完全一致。

## 計算說明與限制

- 八字依輸入的台灣民用時間計算，**未校正真太陽時**。
- 流年以每年 7 月 1 日取值，代表立春後的干支，不是事件日期的精確節氣換年判斷。
- 紫微使用 iztro 的預設設定（陽曆、天盤、繁體中文）；不同流派可能有差異。
- 已知差異：1983-08-08 的月柱，本程式（lunar-typescript 與 iztro）為「己未」，部分其他排盤工具為「庚申」；出生日接近節氣時請自行核對各工具的節氣換月規則。
- 命理內容僅供文化與自我反思，不構成醫療、財務或其他專業建議。

## 更新 vendor 檔

`vendor/iztro.min.js` 來自 npm 套件 `iztro@2.6.3` 的 `dist/iztro-v2.6.3.min.js`；`vendor/lunar-typescript.mjs` 來自 `lunar-typescript@1.8.6` 的 `dist/index.mjs`。升級時重新複製，並以 `npm test` 確認輸出沒有改變（若有差異，需要有意識地決定是否更新黃金資料）。

## 隱私

`history.txt`、`*.png` 已列入 `.gitignore`。範例事件 `example_history.txt` 為虛構內容。
