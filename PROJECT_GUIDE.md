# 小鈴鐺小學資訊整合維護指南

正式維護目錄為本 repository（lanbell-elementary-pages）。使用原生 HTML、CSS、ES modules 與繁體中文；原私人專案的協作指南及歷史記憶位於 ../lanbell-elementary。不要將修改推回國中 repository。

本站為家長整理的非官方資訊網站。名稱、導覽、標誌與分享文字不加入學校名稱、校徽或「薇中」。保留頁首下方與頁尾的非官方聲明。

## 本地檢查與發布

執行 `node --check src/app.js`、`node --check src/data.js`。本公開 repository 沒有 build.mjs；GitHub Actions 直接將 index.html、og.png、.nojekyll、src/*.js、src/*.css 與 assets 打包至 _site。維護文件與 outputs 不會發布。

推送 main 會觸發發布，僅在使用者要求發布時執行。修改共用 CSS／JS 後更新 index.html 的快取版本；資料有變更時才更新資料 updatedAt。

## 2026-10-05：全站切換學段

- src/app.js 共用 render 在頁首下方、非官方提醒上方加入獨立 div + role="navigation"，避免全域 nav 樣式與手機選單程式誤選。
- 小學以非連結 span、aria-current="true"、實心天空藍及「目前網站」文字標示。國中為 https://eilleenlan.github.io/lanbell/#/ 的同分頁連結。高中尚無網址，暫不顯示。
- src/styles.css 加入 school-level 樣式，沿用本站配色，入口至少 44px、可換行、有明確 focus-visible。切換列不固定，原 sticky 頁首高度不變。
- index.html 的 styles.css 與 app.js 快取版本更新為 20261005-school-level。
- 名稱、分享資訊、非官方聲明保留；src/data.js、活動、年級、分類、來源與 updatedAt 均未變更。

驗證：JS 語法檢查通過。以 Edge／Playwright 檢查首頁、學期總覽、篩選查詢／月曆、書套尺寸共四頁，在 320、375、1280px 下切換列及全頁皆無水平溢出，入口高度均為 44px；手機選單開關正常，切換列持續顯示；Tab 可聚焦國中連結且有實線焦點外框，目前學段為非互動 span。桌機與手機截圖已人工檢視。

實際點擊本地小學入口前往正式國中網址，瀏覽器上一頁返回本地小學通過。檢查正式兩站，目前都沒有已發布的切換入口，故正式小學／國中雙向切換待兩站發布後再驗收。本次未 commit、push 或發布。

驗證報告與預覽：outputs/school-level/verification.json、320.png、375.png、1280.png；verify.cjs 為本機重現檢查程式（使用此電腦的 Playwright 套件及 Edge）。

## 2026-10-05：使用者確認的可愛版

切換列標題更新為「逛逛小鈴鐺」，順序固定為「🔔 小學鈴噹」、「🔔 國中鈴鐺」。目前小學下方顯示「你在這裡」，仍使用非連結 span 與 aria-current；鈴鐺裝飾使用 aria-hidden。入口至少 52px，600px 以下標題獨立一行，膠囊按內容寬度顯示。維持原主色與非固定切換列。

依使用者提出的命名一致性調整，頁首、頁面 title 與分享文字更新為「小鈴鐺資訊整合（小學）」。320px 頁首字體調小以容納完整名稱。既有 og.png 圖片內的舊名稱尚未重製。

快取版本為 20261005-school-level-cute。重新檢查四頁 × 320／375／1280px：無水平溢出、入口至少 52px、手機選單與 Tab 焦點通過，截圖已更新；連結網址及同分頁行為未變。實際國中跳轉與上一頁沿用前次通過結果，本輪未重複遠端檢查。資料及 updatedAt 未變；未 commit、push 或發布。本地預覽仍為 http://127.0.0.1:8174/#/。

## 2026-10-05：英文單字練習入口

共用主要導覽新增「🔤 英文單字練習」，網址 https://eilleenlan.github.io/word-club/，使用一般同分頁連結；手機在既有選單顯示，學段切換列保留原用途。僅本地預覽，未 commit、push 或發布。快取版本更新為 20261005-word-club。JS 語法與四頁三種寬度檢查通過。網頁讀取工具無法開啟練習站，網址採用使用者提供的完整網址。

使用者確認本地預覽後，已授權 commit 並 push 至 main，推送將觸發 GitHub Pages 自動發布。

2026-10-05：依使用者要求，英文單字練習改為另開新分頁（target=_blank、rel=noopener noreferrer），輔助閱讀標籤說明另開新分頁；快取版本更新為 20261005-word-club-new-tab。
