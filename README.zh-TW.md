# Rein

**Ponytail for DeepSeek Harness，由 Chonwai 維護。** `@chonwai/dsh-rein` 是經過驗證、可反轉的
DeepSeek Harness bundle：6 個上游 Ponytail skills、一份有 scope 的 always-on 規則，加上輸入框 dock
裡一顆小小的「Ponytail」狀態膠囊；可在 Plugins 頁安裝與移除。MIT、無 runtime dependencies。
舊名 `@chonwai/dsh-ponytail`；改名原因見 [`docs/BRANDING.md`](docs/BRANDING.md)。
如果你在找 DeepSeek Harness 的 Ponytail port、或舊名 `dsh-ponytail`，就是這個專案：顯示名保留上游
名字，套件 slug 沒有。

獨立社群整合：與上游 Ponytail 專案及 DeepSeek 均無隸屬或背書關係。

Ponytail（上游：[DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)）是一套
「懶人資深工程師」指令集：用最小的改動完整解決問題、不做沒人要求的東西，但絕不省略驗證、
錯誤處理、安全與無障礙。這個 bundle 把上游 v5.3.3 的 skills 與規則打包給 DeepSeek Harness（DSH）。

## 為什麼要用 bundle，而不是散裝檔案

| | 把 `SKILL.md` 複製到 `~/.dsh/skills` | 這個 bundle |
|---|---|---|
| 出現在 **Plugins** 頁 | 不會 | **會** — bundle 卡（描述、版本、開關／移除）＋ README 詳情 |
| 開關與移除 | 手動刪檔 | Plugins 頁一鍵開關／移除 |
| Always-on 規則 | repo 的 `AGENTS.md` 區塊 | 全域 system-prompt section（`rules.md`） |
| 版本管理 | 自己記 checksum | package version + `checksums.txt` pin |
| 規則作用範圍 | 單一 repo | 此 profile 的所有 session |

如果只要 skills + 每個 repo 各自的規則，檔案版安裝仍然比較簡單。這個 bundle 是給想要插件生命週期、
Plugins 頁曝光與狀態膠囊的人。

## 提供什麼

- **6 個 skills**（runtime skill，內容與上游 v5.3.3 byte-identical）：
  `ponytail`、`ponytail-review`、`ponytail-audit`、`ponytail-debt`、`ponytail-gain`、`ponytail-help`。
- **有 scope 的 always-on 規則**：以 system-prompt section（order 700）注入 `rules.md`。
  Ponytail 規則**只約束程式碼改動**；研究、文件、審查、分析必須完整。
  `config.defaultMode: off` 會停用規則注入，但 skills 仍在。這個 section 是 3,998 B，
  profile 內每個 request 都會帶上。
- **非互動的「Ponytail」狀態膠囊**：`conversation.composer.dock`（id `ponytail`、order 2），
  使用 `--dsw-*` theme token、`pointer-events: none`。
- **Plugins 頁 metadata**：`locale/en.json`、`locale/zh.json` 的 title/description/detail，
  加上原創 `icon.svg`。bundle 卡一定會有名稱、描述與版本；本地化標題與 icon 是否顯示，
  取決於執行中的 DSH build 有沒有讀取 bundle locale metadata。
- **無 runtime dependencies、無 build step、無 telemetry**；host half 只讀自己套件內的檔案。

## 需求

- DeepSeek Harness **0.2.2-rc.1**（宣告 `engines.dsh: ">=0.2.2-rc.1 <0.3.0"`）。
- Node.js `^22.19.0 || >=24.0.0`（跟 Harness 一致）。
- 有 managed profile 的 DSH profile（Desktop app 或 CLI 管理的 profile）。
  Desktop app 的 `desktop` profile 由 app 獨佔管理：請走 Web **Plugins** 頁或 `plugin_manager`，
  不要在終端機用 `dsh plugin add`。

## 安裝

三種方式，依方便程度排序：

### 1. Plugins 頁（本機 checkout 推薦）

1. DSH → **Plugins** → **Add plugin**。
2. 選 **Install a third-party plugin**，貼這個目錄的絕對路徑（例：`/Users/you/code/dsh-rein`）。
3. 確認信任提示 → **Install**；若出現 **Enable now** 就按下。
4. 重開或新開 session。驗證與疑難排解見 [`INSTALL.md`](INSTALL.md)。

### 2. `plugin_manager`（agent 驅動，需 Full access）

```
plugin_manager(action: "install_bundle", target: "/abs/path/to/dsh-rein")
```

這個工具會對 profile 跑 pnpm——每個 `plugin_manager` action 都需要 Full access 或 approval。
本套件無 dependencies、無 install scripts，所以不會跳出 build 授權。

### 3. CLI（僅限 CLI 管理的 profile）

```bash
dsh plugin add /abs/path/to/dsh-rein
```

Desktop app 的 `desktop` profile 會拒絕 CLI 的 plugin 操作；那裡請用方式 1 或 2。

套件目前標記 `private`（避免誤發 npm）；先從本地 checkout 安裝。等正式發佈、拿掉這個旗標後，
可直接 `dsh plugin add @chonwai/dsh-rein` 或在 Plugins 頁搜尋，不必本地 checkout。

## 使用

安裝後開新 session：

- `/ponytail` — 載入核心 Ponytail skill（自然語言「用 ponytail」「精簡模式」「最簡方案」「YAGNI」
  也會觸發）。
- `/ponytail-review` — 以「出事會被叫起來的資深工程師」角度審查變更。
- `/ponytail-audit` — 整個 repo 的稽核報告。
- `/ponytail-debt` — 把所有 `shortcut:` 註解列成技術債清單。
- `/ponytail-gain`、`/ponytail-help` — 節省數據與快速參考。
- 因為規則已在 system prompt，寫程式任務不用先載入任何東西就會套用 Ponytail 模式。

實際用法（skills 是那一回合載入；always-on 規則才是常駐的部分）：

- 「用 ponytail 修這個 bug，diff 越小越好」— 最小完整改動。
- 改完 diff 後輸入 `/ponytail-review` — 用「出事會被叫起來的資深工程師」角度審。
- 「用 ponytail-audit 掃這個 repo，列出真的會爆的東西並排序」— 只出報告，不改檔。
- 「ponytail ultra，直接挑戰需求」— 最嗆的等級。
- 「ponytail debt」— 把所有 `shortcut:` 註解列成技術債清單。

`ponytail-help` 印的是上游說明卡；其中 Claude Code 專屬的部分（`/plugin`、`PONYTAIL_DEFAULT_MODE`、
band）在 DSH 不適用——DSH 的實情以下面的 v1 限制為準。

**v1 限制**：沒有 level 狀態機（`lite`/`full`/`ultra` 切換），也沒有 `/ponytail off` 指令。
等級表在 skill 內文，直接告訴模型你要哪個等級；若想停用 always-on 規則，可在 profile 層把
`config.defaultMode` 改成 `off`（做法見 `INSTALL.md`）。

## 從檔案版安裝遷移

如果 6 個 skills 已經以檔案形式安裝在 `$DSH_HOME/skills` 或 `~/.agents/skills`，請**先移除它們**
再啟用 bundle：

1. 跑檔案版卸載器（或手動刪掉 `~/.dsh/skills`、`~/.agents/skills` 下的 6 個目錄）。
2. 若某個 repo 的 `AGENTS.md` 有 Ponytail 區塊、而你想讓 bundle 接管 always-on 規則，把區塊也移除。
3. 把 bundle row off/on（或重啟 DSH），讓 duplicate detection 在乾淨的 catalog 上重跑。

host half 會偵測同名 skills 並跳過＋警告，不會靜默蓋掉檔案版。完整清單見
[`INSTALL.md`](INSTALL.md#6-migrating-from-the-file-level-install)。

## 安全與隱私

- 無 runtime dependencies、無 install scripts、無 build step。
- host half 只讀自己套件內的 `skills/*/SKILL.md` 與 `rules.md`；不開子程序、不開 socket、不寫檔、無 telemetry。
- client half 是靜態 React 裝飾；沒有 `fetch`，不碰自己 element tree 以外的 DOM。
- `checksums.txt` pin 住每個 vendored 檔案，CI 會驗證。
- 啟用前請先讀 `rules.md`：它會進入此 profile 每個 session 的 system prompt。

回報安全問題見 [`SECURITY.md`](SECURITY.md)。

## 相容性與目前狀態

以 DSH 0.2.2-rc.1 為目標。已驗證：

- 離線：package 結構、manifest、locale、icon、bundle patch 都可解析；skills 與上游 v5.3.3
  byte-for-byte 相同；`node --check`、host smoke、client smoke 全綠。
- Live（desktop profile，0.2.2-rc.1）：`plugin_manager install_bundle` 回 `application: "applied"`；
  bundle 被列為 installed／enabled／removable；6 個 skills 出現在 session catalog；`rules.md`
  以一個 system-prompt section 注入；client 在 `conversation.composer.dock` 註冊 `ponytail`
  occupant（order 2）。
- Skill 載入：1.0.1 修好後，六個 `skill("…")` 都回傳完整內容（provider `runtime`；
  獨立驗證者逐一載入並比對其中兩個 body 與 vendored 檔一致）。
- Plugins 頁：重新整理後，desktop Web UI 已可看到 Ponytail 卡（同一個 0.2.2-rc.1 desktop
  profile 實測）。未做截圖驗證：膠囊像素——slot occupant 已 live，但沒有截到實際畫面。
  疑難排解見 `INSTALL.md`。

四層驗證 protocol（含 behavioral A/B benchmark 與判定規則）見 [`docs/VERIFICATION.md`](docs/VERIFICATION.md)。

## 開發

```bash
npm test          # 驗收閘門：offline checks，最後印出 RESULT: PASS
npm run check     # node --check（lib/ 與 tests/）
npm run smoke     # offline host / client smoke
npm run test:consumer  # pack 成 tarball，驗證陌生人實際下載到的內容
```

不需要安裝步驟：這個 repo 本身就是套件，這些 scripts 也不需要任何 dependencies。
改動 vendored 檔案前請先讀 [`CONTRIBUTING.md`](CONTRIBUTING.md)。第一次發佈、上架清單與完成定義見
[`docs/RELEASE.md`](docs/RELEASE.md)。

## 回滾

- **Plugins** 頁 → 把 bundle 關掉（保留安裝），或移除。
- Agent／自動化：`plugin_manager(action: "set_bundle", ...)` / `remove_bundle`。
- 移除後若想回到舊工作方式，重裝檔案版 skills 即可。

## Repo 結構

```
lib/index.js          host half（skills + prompt section）
lib/client.js         client half（composer-dock 膠囊）
cordis.patch.yml      單一 insert row：id rein -> @chonwai/dsh-rein
skills/<6>/SKILL.md   vendored Ponytail v5.3.3 skills（byte-identical）
rules.md              注入 system prompt 的 scoped 規則
locale/{en,zh}.json   Plugins 頁 title/description/detail
icon.svg              原創 icon
checksums.txt         skills + rules 的 sha256 pin
tests/                offline-check.sh、host-smoke.mjs、client-smoke.mjs
INSTALL.md            完整安裝／遷移／回滾／疑難排解
```

## 授權與 attribution

MIT — 見 [`LICENSE`](LICENSE)。6 個 skill 檔 vendored 自
[Ponytail](https://github.com/DietrichGebert/ponytail) v5.3.3（MIT，Copyright (c) 2026
DietrichGebert）；`rules.md` 含上游 `AGENTS.md` 原文（逐字）＋繁中 scope 說明。
完整 attribution 見 [`NOTICE`](NOTICE)。
