# AGENTS.md — 開発・保守ガイドライン

本ファイルは、このリポジトリ（**`pole-girls-archive`** / 「架線柱ちゃん」アーカイブページ制作ツール **POLE GIRLS ARCHIVE**）における開発ルール・アーキテクチャ方針・準拠ガイドラインを定義します。今後の追加方針もここに追記します。

---

## バージョン管理ルール

### 1. 機能の追加や仕様変更・改修があった場合
- **バージョンを一つずつ繰り上げます。**
  - 例：`Ver.0.10` → `Ver.0.11` → `Ver.0.12` → `Ver.0.13`
- 対象となるケース：
  - 新機能の追加（新タブ、新出力形式、新規エディタ項目、新レイアウト等）
  - 仕様変更（デフォルト値の大幅な見直し、UIレイアウトの変更、対応項目の変更等）
  - モジュール構成の変更

### 2. 軽微な修正・バグフィックスに留まる場合
- **メジャー/マイナーバージョン番号は上げず、末尾にアルファベットを付与して区別します。**
  - 例：`Ver.0.11` → `Ver.0.11b` → `Ver.0.11c`
- 対象となるケース：
  - 文言の微細な修正・タイポ修正
  - スタイル（CSS）の微調整
  - 既存機能の軽微なバグ修正

### 3. バージョン更新時に必ず同期すべき箇所
バージョンを更新する際は、以下の箇所を**必ず同時に更新して整合性を保つ**こと：
1. `js/state.js` の `APP_VERSION` 定数（`const APP_VERSION = "Ver.0.xx";`）および `APP_UPDATED_AT` 定数（`const APP_UPDATED_AT = "YYYY-MM-DD";`）
2. `CHANGELOG.md` の最上部に最新バージョンの見出し・日付・変更内容を追加
3. （将来的に `index.html` のタイトル・ヘッダーバッジや `README.md` にバージョン表記を追加した場合は、それらも同時に更新すること）

---

## 基本開発ガイドライン

### 1. ローカル直接実行（`file://`）の互換性を維持すること
- 本ツールはオフライン環境やローカルPCで `index.html` をダブルクリックするだけで即座に編集・プレビュー・公開用HTML書き出しができることを最優先としています。
- **ES Modules（`type="module"`, `import / export`）は使用しないでください。** ローカルの `file://` プロトコルではブラウザのCORS制限によりエラーとなるためです。
- 各スクリプトは `index.html` 末尾で通常の `<script src="js/xxx.js" defer></script>` により**依存順**に読み込み、グローバル名前空間（`window.CASTemplates`, `window.CASViewerStyles`, `window.CASViewer`, `window.CASState`, `window.CASIO`, `window.CASEditor`, `window.CASMain`）を介して連携するアーキテクチャを維持してください。
- 書き出される公開用単一HTMLには、外部CDNや外部ファイルへのランタイム依存を持ち込まないこと（ブラウザ標準機能とインライン埋め込みのみで完結して動作させること）。

### 2. モジュールの単一責任の原則を守ること
コードを追加・修正する際は、責務に応じて適切なモジュールファイルに記述してください：

| 読込順 | ファイル | 名前空間 | 責務 |
| --- | --- | --- | --- |
| 1 | `js/templates.js` | `window.CASTemplates` | カラープリセット定数、XMLエスケープ、仮置きSVGデータURI生成、初期テンプレートデータ（`createDefaultData`） |
| 2 | `js/viewer-styles.js` | `window.CASViewerStyles` | ライブプレビューおよび公開用単一HTMLで共有するビューアCSS文字列（`VIEWER_CSS`） |
| 3 | `js/viewer.js` | `window.CASViewer` | 公開ページ・ライブプレビュー共通ビューアエンジン（`initArchiveViewer`：検索・OR/AND属性絞り込み・プロフィールモーダル・キーボード操作） |
| 4 | `js/state.js` | `window.CASState` | バージョン定数 `APP_VERSION` / `APP_UPDATED_AT`、プロジェクトデータ／エディタUI状態管理、データ正規化、`localStorage` 自動保存、トースト通知・確認ダイアログ・画像リサイズ/Base64最適化 |
| 5 | `js/io.js` | `window.CASIO` | JSONエスケープ、公開用単一HTMLの組み立て・書き出し、JSON設定保存、JSON／書き出し済みHTML（`#char-archive-data`）の再読込パース |
| 6 | `js/editor.js` | `window.CASEditor` | 左サイドバーのエディタUI描画・イベント処理（キャラ編集・属性管理・サイト設定タブ） |
| 7 | `js/main.js` | `window.CASMain` | 各モジュールの結合、共通CSS注入、ビューア初期化、編集／プレビューモード切替、DOMイベントリスナー登録、初期化（`boot`） |
| — | `index.html` | — | エディタ骨格HTML、エディタ専用スタイル、確認モーダル／トースト容器、スクリプト順次読み込み |

#### 公開用単一HTML書き出しに関する不変条件
- **`js/viewer.js` の `initArchiveViewer()` は完全に自己完結させること**：`CASIO.buildStandaloneExportHtml()` が `CASViewer.initArchiveViewer.toString()` を文字列化して公開HTMLへそのまま埋め込むため、外部変数や他の `window.CAS*` 名前空間を一切参照させず、名前付き関数宣言 `function initArchiveViewer(mountEl, initialData, options)` を維持してください。
- **`js/viewer-styles.js` の `VIEWER_CSS` はJS文字列として保持すること**：`file://` 環境から外部 `.css` ファイルを `fetch()` せずに公開HTMLへインライン埋め込みできるようにするためです。
- **プロジェクトデータの参照**：`CASState.getProjectData()` が返す参照はインポート・リセット時に差し替わるため、各モジュールはトップレベルに `projectData` をキャッシュせず、関数内で都度 `CASState.getProjectData()` を参照してください。

### 3. Modern Web Guidance 準拠方針
本プロジェクトは **[GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance)** に準拠し、レガシーなJSハックを避けてブラウザ標準（Baseline）プラットフォーム機能を優先採用します：
- **モーダルUI**：新規モーダルを追加・改修する際は、自作 `div` オーバーレイや `z-index` ハックを避け、HTMLネイティブの **`<dialog>` 要素**（`showModal()` / `close()` / `::backdrop` / `overlay`・`display` に対する `@starting-style` トランジション）の使用を優先検討する。
- **ポップオーバー／簡易UI**：将来ポップオーバーやツールチップ的オーバーレイを追加する場合は、ネイティブ **Popover API（`popover` 属性）** を優先検討する。
- **モダンCSS**：状態に応じた親・兄弟要素のスタイリングには `:has()`、レイアウトには CSS Grid / Flexbox、スクロール閉じ込めには `overscroll-behavior: contain` 等の Baseline 機能を活用する。
- **ネイティブAPIとフォールバック**：`crypto.randomUUID()` 等を使用する際も、`file://`（非セキュアコンテキスト扱いとなる場合を含む）で動作が破綻しないフォールバックを必ず備える。
- **セキュリティ**：すべてのユーザー入力文字列をテンプレート文字列へ埋め込む際は、エディタ／IO側では `CASState.escapeHtmlText()`、ビューア内では `escHtml()`、SVG生成内では `CASTemplates.escapeXml()` で必ずエスケープする。また、公開HTMLの `<script id="char-archive-data">` へJSONを埋め込む際は `CASIO.serializeJsonForHtmlScript()` を必ず使用する。

### 4. ファイル・画像参照ルール（ローカル / GitHub Pages 両対応）
- **配置ディレクトリ**：キャラクター画像や仮置き画像はすべてリポジトリ直下の `img/` フォルダへ格納してください。
- **相対パス必須（先頭 `/` 禁止）**：画像パスは必ず先頭スラッシュなしの相対パス（例：`img/char_a_icon.svg`）で指定してください。`/img/...` と先頭 `/` を付けると、ローカル直接実行（`file://`）および GitHub Pages のプロジェクト公開URL（`https://<user>.github.io/<repo>/`）でリンク切れ（404）になります。
- **パス区切りと文字種・大文字小文字**：
  - 区切り文字は必ずフォワードスラッシュ `/` を使用し、Windows の `\` は使わないこと。
  - GitHub Pages（Linux 環境）は大文字・小文字を厳密に区別するため、ファイル名・拡張子は**半角英小文字・数字・アンダースコア（`_`）・ハイフン（`-`）のみ**に統一し、スペースや全角文字を含めないでください。
- **推奨命名規則**：
  - アイコン画像（一覧カード用・1:1・512×512px以上推奨）：`img/<char_id>_icon.<ext>`
  - 立ち絵画像（詳細モーダル用・縦長・長辺1200px程度推奨）：`img/<char_id>_standing.<ext>`
- **公開用HTML書き出し時の注意**：`img/...` の相対パスを参照した状態で「公開用HTMLを書き出す」を実行した場合、GitHub Pages 等で公開する際は書き出したHTMLファイルを `img/` フォルダと同じ階層（リポジトリルート）に配置してください。画像ごと1ファイルで配布したい場合はエディタの「画像アップロード」（Base64自動埋込）を使用してください。
- **HTML／JSON 出力ファイル名**：リポジトリ規約に合わせ、半角英小文字・数字・アンダースコア（`_`）・ハイフン（`-`）のみを使用してください（`CASIO.sanitizeFilename()` は空白を `-` に置換し非ASCII文字を除外するため、日本語タイトル時は既定の `pole-girls-archive.html` / `pole-girls-archive-data.json` として出力されます）。

---

## 変更履歴 (Changelog)
各バージョンの詳細な変更履歴は、すべて **[`CHANGELOG.md`](./CHANGELOG.md)** に分離・集約して記録しています。
機能追加やバグ修正を行った際は、`AGENTS.md` ではなく **`CHANGELOG.md`** に最新バージョンの変更内容を追記してください。
