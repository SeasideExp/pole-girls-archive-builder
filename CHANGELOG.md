# 変更履歴 (Changelog)

このプロジェクトのバージョン変更履歴は本ファイルに記録します。
バージョニング方針および開発ガイドラインは [`AGENTS.md`](./AGENTS.md) に従います。

---

## [Ver.0.51b] - 2026-11-20

### バグ修正・UI/アクセシビリティ改善
- **プロフィール別窓の画像切替タブと「全身」拡大ボタンの重なりを解消 (`js/viewer.js`, `js/viewer-styles.js`)**
  - ステージ上部コントロールを `.ba-stage-top-controls` の Flex 並列配置へ変更し、スマホ幅や狭い編集ペインでも画像切替タブと「全身」拡大ボタンが重ならないよう修正
- **全身ライトボックスの画像高さ上限とヒント文タップ閉鎖を修正 (`js/viewer-styles.js`, `js/viewer.js`)**
  - `.ba-lightbox-frame` に `min-height: 0; overflow: hidden;` を追加し、`.ba-lightbox-img` の `max-height` に安全マージン（PC `calc(100dvh - 148px)` / モバイル `calc(100dvh - 132px)`）を確保して縦長画像のはみ出しを防止
  - 下部ヒント文（`.ba-lightbox-hint`）にも `data-close-lightbox="1"` を付与し、タップで閉じられるよう修正
- **全身ライトボックスの状態同期・キーボード操作時のフォーカス制御を修正 (`js/viewer.js`)**
  - `openCharacter()` 呼び出し時および `renderModal()` 内で `viewState.lightboxOpen` と DOM の `.is-open` 状態が不整合にならないよう `closeLightbox(false)` の実行条件を修正
  - ライトボックス内の `←` / `→` キーによる画像切替や再描画時にフォーカスが消失しないよう復帰処理を追加
  - 立ち絵画像（`<img>`）クリックからの閉鎖時はモーダル内の「全身」ボタン等へ確実にフォーカス復帰し、モーダル再描画時も「全身」ボタンのフォーカスを保持するよう改善
- **オフライン環境フォールバックCSSへ追加リンク2の状態バッジを追加 (`index.html`)**
  - `#badge-site-home2-link` の通常／`on`／`invalid` 状態スタイルをオフラインフォールバックCSSへ追記

## [Ver.0.51] - 2026-11-20

### 新機能・UI改修
- **スマホ表示でのキャラクター立ち絵の見切れ解消（案A-1） (`js/viewer-styles.js`)**
  - `780px` 以下のモバイル表示では `.ba-modal-art` の拡大倍率上限を `min(var(--art-scale, 1), 1)` に自動補正し、画像切替タブ・詳細解説リンクの有無に応じた `max-height` と上下パディングを最適化して、PC向け拡大設定のままでもスマホで頭頂部が切れないよう改善
- **立ち絵タップ／クリックによる全画面ライトボックス全身表示を追加（案B-1） (`js/viewer.js`, `js/viewer-styles.js`)**
  - プロフィール別窓の立ち絵画像タップ（PCはクリック）またはステージ右上の「全身」拡大ボタン（`.ba-stage-zoom-btn`）から、拡大倍率を解除した原寸比率で全身を確認できる全画面ライトボックス（`.ba-lightbox-overlay`）を追加
  - 透過立ち絵でも輪郭が見やすいライト背景フレームを採用し、画像2枚持ちキャラではライトボックス内での画像1・画像2切替（左右キー対応）と別窓側の同期、タップ／`×`／`Escape` での閉鎖＆フォーカス復帰に対応（単一HTML書き出し完全互換）

## [Ver.0.50] - 2026-11-20

### リリース準備
- **GitHub 暫定公開に向けたバージョン繰り上げ (`Ver.0.29` → `Ver.0.50`)**
  - `js/state.js`、`index.html`、`README.md`、`CHANGELOG.md` のバージョン表記を `Ver.0.50` へ同期

## [Ver.0.29] - 2026-11-20

### 新機能
- **ヘッダー装飾バッジ横のリンクを2つまで設定可能に拡張 (`js/templates.js`, `js/state.js`, `js/viewer.js`, `js/editor.js`)**
  - 「サイト設定」タブに「追加リンク2（ホームページリンク横・任意）」（`site.homeUrl2`, `site.homeLabel2`）を追加し、1つ目のホームページリンクと並べてヘッダー上に表示できるよう対応

## [Ver.0.28e] - 2026-11-20

### アクセシビリティ・キーボード操作・細部改善
- **ダイアログ・一覧並び替え操作時のフォーカス復帰を完備 (`js/state.js`, `js/main.js`, `js/editor.js`)**
  - `showExportFilenameDialog()` および「このツールについて」「ヘルプ」モーダル閉鎖時に呼び出し元へフォーカスを復帰するよう対応
  - キャラ一覧・大カテゴリ・小カテゴリの `↑` / `↓` 並び替えボタン操作後にサイドバー再描画でフォーカスが飛ばないよう、移動後のボタンへフォーカスを復帰
- **キャラ一覧カードのインタラクティブ要素入れ子を解消 (`js/editor.js`, `index.html`)**
  - `<div role="button">` 内に上下移動 `<button>` が入れ子になっていた構造を見直し、キャラ選択をネイティブ `<button type="button" data-select-char>` へ分離（インライン `onclick="event.stopPropagation()"` も撤廃・オフラインフォールバックCSS対応）
- **モーダル・モバイルサイドバー・トーストの ARIA 属性とキーボード操作を補強 (`js/viewer.js`, `js/main.js`, `js/state.js`, `index.html`)**
  - プロフィールモーダル（`.ba-modal-overlay`）へ `aria-labelledby` を付与し、見出し `<h2 class="ba-profile-name">` と関連付け
  - モバイルサイドバー開閉ボタンへ `aria-expanded` / `aria-controls` / `aria-label` を追加し、開いている状態で `Escape` キーにより閉じてボタンへフォーカス復帰するよう対応
  - トーストコンテナへ `role="status" aria-live="polite"`、エラー通知へ `role="alert"`、閉じるボタンへ `aria-label="通知を閉じる"` を追加
- **ヘルプ文言・コードコメントの細部統一 (`index.html`, `js/state.js`)**
  - ヘルプモーダル見出し `0. はじめに` の体裁と半角 `AI` 表記を統一し、`pendingImageTarget` のコメントへ `"standingUrl2"` を追記

## [Ver.0.28d] - 2026-11-20

### バグ修正・UI/UX・オフライン互換改善
- **キャラ名・テーマカラー入力時の不要な画像再読込を防止 (`js/editor.js`)**
  - `refreshImagePreviews()` で URL 未設定またはフォールバック表示中の画像のみ頭文字SVGを更新し、設定済みURL・リンク切れURL・Base64画像への不要な `img.src` 再代入を抑制
- **カスタムアクセントカラー時のハードコード青色（`#1289F6`）混入を解消 (`js/viewer-styles.js`)**
  - `.ba-header::before` と `.ba-home-link` のグラデーションを `var(--ba-accent)` / `rgba(var(--ba-accent-rgb), ...)` ベースへ統一し、任意アクセントカラー時の配色調和と文字コントラストを確保
- **完全オフライン環境のフォールバックCSSを補強 (`index.html`, `js/editor.js`)**
  - 初期表示形式切替（`[data-default-view-mode]`）の選択状態、および詳細解説リンク／ホームページリンクの状態バッジ（`data-link-state`）のオフライン用スタイルを追加
- **モバイル追従フィルターの高さ上限・`dvh` 対応・モーダル開閉時のガタつき防止 (`js/viewer-styles.js`, `index.html`, `js/io.js`)**
  - 640px以下の追従フィルター（`.ba-filter-panel.is-stuck`）に `max-height: 46dvh; overflow-y: auto;` を設定し、プロフィールモーダル／ヘルプダイアログへ `dvh` 高さを併記
  - 公開HTMLの `html` に `scrollbar-gutter: stable;` を追加し、モーダル開閉時のスクロールバー消失による横ズレを抑制
- **初期値・フォールバック・フィードバックの細部不整合を修正 (`js/editor.js`, `js/viewer.js`, `js/main.js`)**
  - 「＋ 新規キャラ」追加時の `catchphrase` 初期値を空欄（`""`）に統一
  - ホームページリンク表示テキスト空欄時の既定値をプレースホルダーと同じ `"トップページへ"` へ統一
  - キャラ名空欄時のモーダル `alt`・前後ナビボタン・削除確認ダイアログを `"名称未設定"` に統一
  - 立ち絵読込失敗時はまず `iconUrl` へフォールバックし、さらに失敗した場合のみ頭文字SVGを表示するよう改善
  - サイト設定のアクセントカラーピッカー変更時にプリセットスウォッチの選択枠も即時同期し、JSON保存トーストに保存ファイル名を表示するよう改善

## [Ver.0.28c] - 2026-11-20

### バグ修正・データ安全性強化
- **リスト表示時の「キャッチコピー / セリフ」リアルタイム反映漏れを修正 (`js/editor.js`, `js/viewer.js`)**
  - キャッチコピー編集時に `scope: "listAndModal"` を追加し、リスト表示中や検索中も即座に一覧カードへ反映されるよう修正
- **「データ読込」時の上書き確認ダイアログ追加と自動保存状態のリセット (`js/main.js`)**
  - ファイル検証後に上書き確認ダイアログを表示し、読込確定前に `CASState.cancelAutoSave()` を呼ぶことで保留中タイマーと容量超過警告フラグをリセットするよう改善
- **UTF-8 BOM 付き JSON 読込および `normalizeProjectData()` の型検証を強化 (`js/io.js`, `js/state.js`)**
  - `parseProjectFile()` で先頭 BOM（`\uFEFF`）を除去してからパースするよう修正
  - `normalizeProjectData()` で不正な型（オブジェクトや配列等）が `"[object Object]"` に文字列化されないよう型ガードを徹底
- **URLサニタイズ強化とエディタ検証ロジックの統一 (`js/state.js`, `js/viewer.js`, `js/editor.js`)**
  - バックスラッシュ始まり（`\\...`）およびホスト欠如の `http://` / `https://` を無効URLとしてブロックし、`CASState.sanitizeLinkUrl()` へ統一
- **`localStorage` 破損時の起動ステータス表示・画像MIME推定・大カテゴリ削除時の属性移行を修正 (`js/state.js`, `js/main.js`, `js/editor.js`)**
  - 自動保存データ破損時に「自動保存データ読込失敗（初期データで起動）」表示と警告トーストを出すよう修正
  - `inferImageMime()` で `.bmp` / `.avif` / `.ico` に正式な MIME タイプを返すよう修正
  - 大カテゴリ削除時の小カテゴリ移行条件に `!a.categoryId` の防御を追加

## [Ver.0.28b] - 2026-11-20

### スタイル微調整
- **ヘッダー右側の「キャラクター総数」カウンター表示を拡大 (`js/viewer-styles.js`)**
  - `.ba-counter-value` を `22px` → `clamp(28px, 3.4vw, 38px)`、`.ba-counter-label` を `11px`、`<small>` 単位表記を `clamp(13px, 1.4vw, 15px)` に引き上げ、`.ba-counter-box` の余白・最小幅（`158px`）を調整して見出しとバランスよく視認性を向上

## [Ver.0.28] - 2026-11-20

### 新機能・UI改修
- **フィルターバーのコンパクト化＆スクロール追従（Sticky）対応 (`js/viewer.js`, `js/viewer-styles.js`)**
  - `.ba-root` を `overflow-x: clip` に変更し、`.ba-filter-panel` がエディタプレビュー・公開HTMLの両環境で画面上部に追従するよう改修（`IntersectionObserver` による追従状態 `.is-stuck` の視覚強調を追加）
  - 検索窓・OR/AND・昇順/降順・表示切替・カテゴリタブの余白と高さをスリム化し、大カテゴリトレイは初期状態では閉じてクリック時のみ展開するよう変更
- **サムネイル画像の額装スタイル＆ `NO.xx` ラベル位置変更 (`js/viewer.js`, `js/viewer-styles.js`)**
  - サムネイル自体のキャラ色フレームと調和するよう、カード外枠を極細ニュートラル枠に統一し、内側余白＋フレーム枠を設けた額装スタイルへ刷新（二重になる下部カラー帯・画像上の `NO.xx` を廃止）
  - `NO.xx` ラベルを画像左上からカード本文側（キャラ名の上・サブ名横の `.ba-card-meta-row`）へ移動
- **表示密度の切替機能（標準グリッド / コンパクトアイコン / リスト表示）を追加 (`js/viewer.js`, `js/viewer-styles.js`, `js/editor.js`, `js/templates.js`, `js/state.js`)**
  - フィルターバーに表示密度切替トグル（`標準` / `アイコン` / `リスト`）を追加（コンパクトアイコン表示は額装サムネ＋キャラ名1行表示）
  - 「サイト設定」タブから公開時の初期表示形式（`site.defaultViewMode`）を設定・即時プレビューできるよう対応

## [Ver.0.27e] - 2026-11-20

### 仕様整理・微調整
- **画像設定の標準方式を `img/` フォルダ参照（推奨）へ整理 (`js/editor.js`, `index.html`)**
  - エディタの各画像設定ブロックで「画像アップロード」（Base64埋め込み）ボタンの並び順を最後尾（「仮置きに戻す」→「クリア」→「画像アップロード」）へ移動し、配色も他ボタンと同じ落ち着いたスタイルへ変更
  - パス入力欄のプレースホルダーおよびヘルプモーダル（Step 3・FAQ）の文言を、`img/` フォルダ内の画像ファイル参照をデフォルト推奨とし、Base64埋め込みをオプションとして案内する表現へ改定

## [Ver.0.27d] - 2026-11-20

### バグ修正・微調整
- **「すべて」ボタンと展開中大カテゴリタブの視覚状態を分離 (`js/viewer-styles.js`)**
  - `.ba-cat-tab.is-all.is-active`（絞り込みなし）は濃紺塗りを維持し、`.ba-cat-tab.is-open`（トレイ展開中）は白背景＋アクセント枠＆下線表示へ変更して初期表示時の二重選択見えを解消
- **モーダル表示中の左右キー操作の干渉防止と `preventDefault()` 追加 (`js/viewer.js`)**
  - 編集モードでサイドバー等モーダル外の要素にフォーカスがあるときは左右キーでモーダルを切り替えないようガードを追加し、モーダル遷移時は `e.preventDefault()` を呼ぶよう修正
- **キャラクター0件時の空状態メッセージを絞り込み不一致時と分離 (`js/viewer.js`)**
  - 登録キャラ0件のときは「キャラクターが登録されていません」および状況に応じた案内文を表示するよう改善
- **`site.title` 空欄時のフォールバック文言を統一 (`js/io.js`, `js/viewer.js`)**
  - 画面見出しと書き出しHTMLの `<title>` の既定フォールバックを `キャラクターアーカイブ` に統一
- **確認ダイアログ（`#studio-confirm-modal`）をネイティブ `<dialog>` 要素へ統一 (`index.html`, `js/state.js`, `js/viewer.js`)**
  - 自作 `div` オーバーレイから `showModal()` / `close()` / `::backdrop` ベースのネイティブ `<dialog>` へ移行し、Top Layer 表示とブラウザ標準のフォーカストラップへ統一

## [Ver.0.27c] - 2026-11-20

### バグ修正・改善
- **選択中条件バーのキーボード操作時のフォーカス喪失を修正 (`js/viewer.js`)**
  - `.ba-active-chip` / `.ba-active-clear` 操作後の再描画時に、残存チップまたは「すべて」ボタンへフォーカスを復帰するよう対応
- **カテゴリD&Dのドロップ有効領域を各一覧セクション内に限定 (`js/editor.js`)**
  - 大カテゴリ並び替えは `#cat-reorder-list` 周辺、小カテゴリ移動は `[data-attr-group-box]` 群の領域内に限定し、別セクション上で離した場合は意図せずスナップ移動せずキャンセルされるよう修正
- **データ読込・初期リセット時に新規小カテゴリ入力途中状態（`newAttrDraft`）をクリア (`js/editor.js`, `js/main.js`)**
  - `CASEditor.resetDrafts()` を追加し、別データ読込・初期データリセット時に前プロジェクトの入力途中文字列やカラーが残留しないよう修正
- **立ち絵画像の読込失敗時に表示倍率とフォールバック枠をリセット (`js/viewer.js`)**
  - `renderModal()` および `updateModalStageImage()` の `onerror` 時に `--art-scale` を `1` に戻し `.is-icon-fallback` を付与するよう修正
- **明るいアクセントカラー／キャラテーマカラー時の文字コントラスト自動切替を拡大適用 (`js/viewer.js`, `js/viewer-styles.js`)**
  - `--ba-accent-text` と `--modal-color-text` を追加し、ホームページリンク・タブ件数バッジ・空状態ボタン・編集ボタン・画像切替アクティブタブ・詳細解説リンクホバー時にも自動コントラスト文字色を適用
- **URL検証強化と `detailUrl` / `homeUrl` の相対パス遷移挙動・アイコン統一 (`js/viewer.js`, `js/editor.js`)**
  - プロトコル相対URL（`//...`）およびスラッシュなし `http:` を無効としてブロック（エディタ側バッジ判定も統一）
  - `detailUrl` も `homeUrl` と同様に、公開HTMLでは外部URLのみ別タブ・相対パスは同一タブ（エディタ内プレビューでは誤離脱防止のため別タブ）で開くよう統一し、外部リンク時のみ斜め矢印（`↗`）・相対パス時は右矢印（`→`）を表示
- **編集入力・表示サイズスライダー操作時の不要な全DOM再描画を削減 (`js/viewer.js`, `js/editor.js`, `js/main.js`)**
  - `viewer.updateData()` に `scope`（`modalScale` / `modalOnly` / `siteMeta`）を追加し、表示サイズスライダー操作時は `--art-scale` のみ即時更新、紹介文・スペック・モーダル設定・サイト文言編集時は不要なカード一覧全再構築を回避

## [Ver.0.27b] - 2026-11-20

### バグ修正
- **エディタのプレビュー内で相対パスのホームページリンクをクリックした際のページ離脱を防止 (`js/viewer.js`)**
  - エディタ内（`opts.isEditor === true`）では `site.homeUrl` が相対パスの場合も `target="_blank" rel="noopener noreferrer"` で開くよう修正し、編集画面（`index.html`）から意図せず遷移してしまう問題を解消（公開用書き出しHTMLでは従来通り相対パスを同一タブで遷移）
- **自動保存デバウンス中のデータ消失防止と容量超過トーストの連打抑制 (`js/state.js`, `js/main.js`)**
  - `CASState.flushAutoSave()` を追加し、`pagehide` およびタブ非表示（`visibilitychange`）時に保留中の自動保存タイマーを即時フラッシュするよう修正
  - `localStorage` 容量超過時の警告トーストに重複抑止フラグ（`quotaWarnShown`）を導入し、編集のたびに警告トーストが大量スタックする不具合を解消（保存成功時またはリセット時に自動解除）

## [Ver.0.27] - 2026-11-20

### 新機能・改善
- **ヘッダー装飾バッジ横に「ホームページリンク」ボタン機能を追加 (`js/templates.js`, `js/state.js`, `js/editor.js`, `js/viewer.js`, `js/viewer-styles.js`, `index.html`)**
  - 「サイト設定」の「装飾バッジ」直下に「ホームページリンク（URL・表示テキスト）」設定を追加（初期値空欄＝デフォルトOFF、URLや相対パスを入力すると自動でON）
  - 装飾バッジと同じ `-14°` 斜めシルエットのアクセントカラー塗り＋ホバー時光沢スイープ演出（`.ba-home-link`）を実装（外部URLは別タブ・サイト内相対パスは同一タブで遷移、`javascript:` 等の危険スキームは自動ブロック）
  - 装飾バッジが空欄のときもホームページリンク単体で表示でき、モバイル幅でも `.ba-badge-wrap` の折り返しに対応

## [Ver.0.26] - 2026-11-20

### 新機能・改善
- **データベースページの昇順・降順切り替えを追加（デフォルト降順） (`js/viewer.js`, `js/viewer-styles.js`)**
  - フィルターバー右側の操作群に「降順 / 昇順」トグル（`.ba-sort-toggle`、初期値 `"desc"` 降順）を追加
  - 一覧カードの表示順および別窓モーダルの前後ナビゲーション順が選択した並び順と連動（カードの登録通し番号 `NO.01`〜 は維持）
- **小カテゴリの背景色に応じた文字色の自動コントラスト切替を実装 (`js/state.js`, `js/viewer.js`, `js/viewer-styles.js`, `js/editor.js`)**
  - 相対輝度（sRGB輝度 `> 0.40`）を判定する `getContrastTextColor()` を追加し、黄色・パステルカラー・明るいオレンジなど明るい背景色の小カテゴリでは白字ではなく濃紺黒字（`#1B2B44`）で表示して視認性を向上
  - フィルターボタン（選択中）・選択中条件バーチップ・キャラカード・プロフィール別窓・エディタ内小カテゴリ選択チップのすべてに統一適用

## [Ver.0.25] - 2026-11-20

### 新機能・改善
- **カテゴリ絞り込みフィルターを「大カテゴリ・タブ切替方式」へ刷新 (`js/viewer.js`, `js/viewer-styles.js`)**
  - 「すべて」ボタンと各大カテゴリを1行のスタイリッシュなタブバー（`.ba-cat-tabs`）へ集約し、選択中タブの小カテゴリだけを直下のコンパクトトレイ（`.ba-cat-tray`）に展開する方式へ変更（同じタブの再クリックでトレイの折りたたみも可能）
  - 各大カテゴリタブに件数バッジ（未選択時は総数、選択あり時は `選択数/総数` でハイライト）を表示し、大量の小カテゴリがある場合でもフィルター領域がファーストビューを圧迫しないよう改善
  - 小カテゴリチップをスリム化し、絞り込み中は別タブへ切り替えても現在選択中の条件が一目で分かり個別解除／すべて解除できる「選択中条件バー（`.ba-active-filters`）」を常時表示

## [Ver.0.24] - 2026-11-20

### 新機能・改善
- **プロフィール別窓に「詳細解説ページへのリンク」ボタン機能を追加 (`js/templates.js`, `js/state.js`, `js/editor.js`, `js/viewer.js`, `js/viewer-styles.js`, `index.html`)**
  - 各キャラクターに `detailUrl`（初期値 `""`：デフォルトOFF）と `detailLabel`（個別ボタン文言・任意）を追加し、URLまたは相対パスを入力すると自動的にONになって表示される仕様を実装
  - 立ち絵ステージ下部中央へ上部画像切替タブと対になる半透明グラスフローティングボタン（`.ba-stage-detail-link`、キャラテーマカラー連動・光沢スイープ演出・`:has()` による立ち絵重なり防止）を配置
  - 「サイト設定」に共通ボタン文言（`site.detailLinkLabel`、初期値 `詳しい解説ページを見る`）を追加し、キャラ個別のボタン文言が空欄のときに自動継承する構成に統一
  - `javascript:` 等の危険なスキームを拒否する `sanitizeDetailUrl()` をビューア内へ自己完結で実装（公開単一HTML書き出し互換）

## [Ver.0.23b] - 2026-11-20

### 微調整
- **プロフィール別窓の大型ナンバリング表示から先頭の `//` を除去 (`js/viewer.js`)**
  - 右上の `.ba-profile-big-num` 表示ではナンバリング書式先頭の `//`（および直後の空白）を取り除き、`#01` や `01` 等の番号部分のみが大きく表示されるよう調整

## [Ver.0.23] - 2026-11-20

### 新機能・改善
- **プロフィール別窓のタイトル右上に大型ナンバリング表示を追加 (`js/viewer.js`, `js/viewer-styles.js`)**
  - `.ba-profile-head` の右上に、「サイト設定」のナンバリング書式（`site.modalNumberFormat`）に準じた大きな番号表示（`.ba-profile-big-num`）を追加（書式が空欄の場合は非表示）

## [Ver.0.22] - 2026-11-20

### 新機能・改善
- **プロフィール画像1・画像2の表示サイズ（拡大・縮小）設定を追加 (`js/templates.js`, `js/state.js`, `js/editor.js`, `js/viewer.js`, `js/viewer-styles.js`)**
  - 各キャラクターの「プロフィール画像 1」「プロフィール画像 2」設定欄に **表示サイズ** スライダー（`50%`〜`250%`、5%刻み、初期値 `100%`、ワンクリック `100%` リセットボタン付）を追加
  - 透過余白が多い立ち絵画像でも、別窓モーダル内の枠（`overflow: hidden`）からはみ出さずに画像1・画像2それぞれの表示倍率を個別に調整可能（画像切替タブ操作時も各設定倍率を即時反映）

## [Ver.0.21c] - 2026-11-20

### バグ修正
- **「キャラ編集」タブで小カテゴリチップをクリックすると左サイドバーが上部へ吹き飛んで表示崩壊する不具合を修正 (`js/editor.js`, `index.html`)**
  - 小カテゴリ選択チップの `<label>`（初期描画・`else` 分岐・トグル更新時）に `relative`（`position: relative`）を付与し、内包する `.sr-only` チェックボックス（`position: absolute`）へのフォーカス時に親 `#editor-sidebar` が強制スクロールしないよう修正（完全オフライン時のフォールバックCSSにも `position: relative` を追加）
  - あわせて `attributeCategories` 空時のフォールバック描画側にも `data-chip-color` / `.js-chip-dot` / `focus-within:ring-2` を統一
- **「カテゴリ」タブの登録済み小カテゴリ一覧で「設定中: X名」が2行に潰れる表示崩れを修正 (`js/editor.js`, `index.html`)**
  - `select[data-attr-cat]` に `w-auto max-w-[140px] min-w-0`（およびオフラインフォールバック定義）、件数ラベルに `whitespace-nowrap flex-shrink-0` を追加し、`:where(#editor-tab-body select) { width: 100%; }` による横幅圧迫を解消
  - 新規小カテゴリ追加フォームの `#inp-new-attr-name` / `#inp-new-attr-cat` に `min-w-0` を追加

## [Ver.0.21b] - 2026-11-19

### バグ修正
- **完全オフライン環境でのレスポンシブ表示・ダイアログ・トーストのフォールバックCSSを補強 (`index.html`, `js/state.js`)**
  - `sm:block`・`md:hidden`・`md:inline`・`md:inline-block`・`lg:hidden`（`#btn-mobile-sidebar` / `#mobile-sidebar-backdrop` 含む）・`xl:inline` のメディアクエリフォールバックを追加し、オフラインのPC環境でモバイル専用ボタン露出やツールバーラベル二重表示が起きないよう修正
  - `#studio-confirm-modal`・`#studio-export-dialog` 内部のアイコン・余白・ボタン配置および `#studio-toast-container` 内トースト通知（`.studio-toast` / `data-toast-type`）のオフラインフォールバックCSSを追加
- **`<button>` 要素内の非フレージング要素ネストを解消 (`js/viewer.js`, `js/viewer-styles.js`, `js/editor.js`)**
  - カードボタン（`.ba-card`）内の `<div>` / `<h2>` および背景パターン選択ボタン（`[data-bg-pattern]`）内の `<div>` をすべて `<span>`（必要に応じて `display: block;`）へ変更し、HTML Living Standard に準拠
- **ウィンドウ拡大・再縮小時のモバイルサイドバー残留バグを修正 (`js/main.js`)**
  - `resize` イベントで `window.innerWidth >= 1024` になった際に `setMobileSidebar(false)` を呼び、モバイルサイドバーと暗転背景をリセットするよう修正
- **エディタ本体の `100dvh` 対応とサイズフォールバック分離 (`index.html`)**
  - `body` に `height: 100dvh;` を追加し、`:where(.w-*)` と `:where(.h-*)` を幅専用・高さ専用に分離して不要な高さ強制を解消

## [Ver.0.21] - 2026-11-19

### 新機能・改善
- **フッターのクレジット表記を「サイト設定」から変更・非表示にできるよう対応 (`js/templates.js`, `js/state.js`, `js/editor.js`, `js/viewer.js`, `index.html`)**
  - `site.footerCredit`（初期値 `CHARACTER ARCHIVE SYSTEM（Powered by しーさいど）`）を追加し、「サイト設定」タブの「クレジット表記（右端・空欄で非表示）」から自由に変更または空欄で非表示にできるよう対応（ヘルプ記載の「クレジット表記は任意」と整合）

### バグ修正
- **ビューア＆エディタ操作時のDOM全置換によるフォーカス喪失・キー衝突を修正 (`js/viewer.js`, `js/editor.js`)**
  - 属性フィルターボタン（`.ba-attr-btn`）へ `aria-pressed` を付与し、属性構成に変更がない操作時は DOM を再構築せずクラスと `aria-pressed` のみ更新するよう修正（構成変化時も再構築後に元のボタンへフォーカス復帰）
  - プロフィールモーダルの画像切替タブ（`role="tab"`）操作時はタブボタンと画像のみ部分更新（`updateModalStageImage()`）し、前後キャラナビ・他モーダル操作時も再描画後に元の操作コントロールへフォーカス復帰するよう修正
  - モーダル内の画像切替タブ（`role="tab"`）フォーカス中の `←` / `→` / `Home` / `End` キーはモーダル全体の前後キャラ遷移ではなく画像タブ切替として処理するよう分離
  - エディタのキャラ選択一覧（`[data-select-char]`）へ `tabindex="0"` / `role="button"` / `aria-pressed` と `Enter` / `Space` キーハンドラ＋フォーカス復帰を追加し、小カテゴリチェックボックス（`.js-char-attr-toggle`）はトグル時に全体再構築せず対象チップのみ更新するよう修正
- **各種ダイアログのドラッグ選択誤閉鎖と `showExportFilenameDialog()` 二重起動エラーを修正 (`js/state.js`, `js/main.js`)**
  - 確認ダイアログ・書き出しダイアログ・このツールについて・ヘルプの全4ダイアログで背景クリック判定に `mousedown` 起点チェックを追加し、入力欄や本文のドラッグ選択で外側で離しても閉じないよう修正
  - `showExportFilenameDialog()` に二重起動ロック（`exportDialogOpen` ＋ `dialog.open` ガード）および `cancelBtn` の null チェックを追加し、`InvalidStateError` を防止

## [Ver.0.20c] - 2026-11-19

### バグ修正
- **カテゴリ混在時の小カテゴリ D&D で元位置ドロップ時に誤って再保存・強調が発火する不具合を修正 (`js/editor.js`)**
  - 全属性配列インデックスではなく同一大カテゴリ内での相対順位（`oldSlotInCat` vs `dropAttrSlot`）で移動有無を判定するよう修正
- **「＋ 新規キャラ」追加時の案内文・先頭属性自動設定を撤廃 (`js/editor.js`)**
  - 新規キャラ追加時の `bio` を `""`、`attributeIds` を `[]` に変更し、未編集のまま意図せず公開ページへ案内文や「鉄柱」等の属性が出ないよう修正
- **大カテゴリ・小カテゴリ名の空欄禁止ガードが「最後の1文字」を保存してしまう問題を修正 (`js/editor.js`)**
  - `data-prev-name` の記録を `input` 時ではなく `focus` 時点および有効値 `change` 確定時点に変更し、全削除後のフォーカス移動で編集前の元名称へ正しく戻るよう修正
- **エディタの「プロフィール画像1・2」のプレビュー表示・説明文・未設定時404を修正 (`js/editor.js`)**
  - 画像1プレビューとクリア時トースト・説明文を Ver.0.18 のビューア挙動（画像1未設定時は画像2優先、両方未設定でアイコン表示／切替タブは両方設定時のみ表示）に統一
  - 画像2未設定時のエディタプレビューを `img/char_a_standing2.webp` 直参照からインラインSVGプレースホルダー（`EMPTY_IMAGE2_PLACEHOLDER_SVG`）へ変更し、`img/` 不在環境での404リクエストを解消
- **カテゴリ D&D のゴースト値ズレ・キャンセル操作・1件カテゴリ誤ハイライト・再描画リーク対策を実装 (`js/editor.js`)**
  - ドラッグゴースト生成時に元行内の `<input>` / `<select>` の現在値をコピーするよう修正
  - `Escape` キーおよびサイドバー領域外ドロップでのキャンセルに対応
  - 要素1件のみのカテゴリ内で自身をドラッグした際の `.cas-drop-zone-active` 誤ハイライトを抑制
  - `setPointerCapture` の適用および `renderEditorSidebar()` 冒頭での `activeDragCleanup()` 呼び出しによる再描画時リスナー・ゴーストリーク防止を追加

## [Ver.0.20b] - 2026-11-19

### バグ修正
- **サロゲートペア文字先頭のキャラ名による `URIError` クラッシュを修正 (`js/templates.js`, `js/viewer.js`)**
  - `getFallbackAvatar()` で `charAt(0)`（UTF-16コード単位）の代わりに `Array.from(...)[0]`（コードポイント単位）で頭文字を切り出すよう修正し、絵文字（`🚃`等）や異体字で孤立上位サロゲートが発生しないように改善
- **`file.type` 未設定環境での Data URI MIME 破損を修正 (`js/state.js`)**
  - `optimizeUploadedImage()` 内に `fixDataUrlMime()` を追加し、`FileReader.readAsDataURL()` の結果が `data:;` や `data:application/octet-stream;` の場合は拡張子から推定した MIME（`image/svg+xml` 等）へ補正してから返却・デコードするよう修正
- **ID トリム時のカテゴリ／属性参照外れを修正 (`js/state.js`)**
  - `normalizeProjectData()` で `a.categoryId` および `c.attributeIds` の照合・格納値も `.trim()` して整合するよう修正

## [Ver.0.20] - 2026-11-19

### 新機能・改善
- **上部ツールバーへの「このツールについて」＆「ヘルプ」モーダル新設 (`index.html`, `js/main.js`)**
  - 上部左側のツール名横に小さいリンクボタンとして「このツールについて」「ヘルプ」を追加
  - 「このツールについて」モーダル（`#studio-about-dialog`）にツール名・バージョン（`CASState.APP_VERSION` 連動）・最終更新日・著作権表記 `(C)しーさいど`・ライセンス・概要を掲載
  - 「ヘルプ・ご利用ガイド」モーダル（`#studio-help-dialog`）に目次クイックジャンプ、使い方の流れ（4ステップ）、データ保存・バックアップ推奨案内、FAQ、ご利用について・動作環境・免責事項を実装（ネイティブ `<dialog>` 採用・オフライン完結CSS対応）

## [Ver.0.19] - 2026-11-19

### 新機能・改善
- **大カテゴリ・小カテゴリのドラッグ＆ドロップ順列変更と横断移動に対応 (`js/editor.js`, `index.html`)**
  - 「カテゴリ」タブの大カテゴリ設定行・登録済み小カテゴリ行の左端にドラッグ専用グリップ（`⋮⋮`）を追加し、Pointer Events ベースで直感的にドラッグ＆ドロップ並び替えができるよう実装（既存の `↑` / `↓` ボタンも微調整用に維持）
  - 小カテゴリは同一大カテゴリ内の並び替えだけでなく、別の大カテゴリグループ（空の大カテゴリ枠を含む）へ直接ドラッグ＆ドロップして所属大カテゴリ（`categoryId`）と順番を同時に変更できるよう対応
  - ドラッグ中の挿入ライン／ドロップ先ハイライト、上下端ドラッグ時の自動スクロール、ドロップ直後のハイライトアニメーションを追加（外部依存なしのオフライン完結CSS）

## [Ver.0.18b] - 2026-11-19

### バグ修正
- **完全オフライン環境でのフォールバックCSS不足を補強 (`index.html`, `js/main.js`, `js/editor.js`)**
  - モード切替ボタン・サイドバータブボタン・背景パターン選択ボタンへ `aria-pressed` / `aria-selected` を付与し、オフライン時の `:where(...)` フォールバックCSSで選択状態を視覚判別できるよう改善
  - カラースウォッチ（`w-6 h-6` / 各スウォッチボタン）およびモバイルサイドバー用バックドロップ（`#mobile-sidebar-backdrop`）のフォールバック定義を追加
- **編集画面における `<main>` 要素の二重ネストを解消 (`index.html`)**
  - `#preview-pane` を `<main>` から `<div id="preview-pane">` へ変更し、ビューア内の `<main class="ba-grid-area">` と重複ネストしないHTML構造へ修正
- **サイドバー再描画時のスクロール位置・入力途中状態・削除後選択先を改善 (`js/editor.js`)**
  - `#char-list-scroll` の内部スクロール位置および同一タブ再描画時の `#editor-tab-body` スクロール位置を保持するよう修正
  - キャラクター削除後の自動選択先を先頭 `[0]` 固定から削除位置の隣接キャラへ変更
  - 「カテゴリ」タブで新規小カテゴリ追加フォームの入力途中状態（名前・色・分類）を `newAttrDraft` として保持し、大カテゴリ編集や並び替え等の再描画で消えないよう修正

## [Ver.0.18] - 2026-11-19

### 新機能・改善
- **紹介文欄見出しのカスタマイズと空欄時非表示に対応 (`js/templates.js`, `js/state.js`, `js/editor.js`, `js/viewer.js`)**
  - 「サイト設定」に「紹介文欄見出し（別窓・空欄で非表示）」（`site.bioSectionLabel`、初期値 `PROFILE // OVERVIEW`）を追加
  - キャラクターの `bio` が空欄の場合はプレースホルダー文言を出さず紹介文ブロックごと非表示にするよう仕様を統一

### バグ修正
- **インポート検証とデータ正規化の防御を強化 (`js/io.js`, `js/state.js`, `js/viewer.js`)**
  - `parseProjectFile()` で `site` の型や配列混入をより厳密に検証し、不正JSONをエラーとして拒否するよう修正
  - `normalizeProjectData()` で `attributeCategories` / `attributes` / `characters` の空IDおよび重複IDを検出し一意IDへ再採番するよう修正（URL文字列の前後空白もトリム）
  - `viewer.js` の `iconUrl` 参照時にも `.trim()` チェックを追加
- **確認ダイアログ・プロフィールモーダルの排他制御とフォーカストラップを実装 (`js/state.js`, `js/viewer.js`, `index.html`)**
  - `showConfirmDialog()` に二重起動ロック・Tab キーのフォーカストラップ・閉じた際の呼び出し元フォーカス復帰を追加し、`#studio-confirm-modal` へ `role="dialog"` / `aria-modal="true"` を付与
  - `viewer.js` のモーダル表示中（および編集モードでモーダル内操作時）に Tab キーのフォーカストラップを追加
- **プロフィール表示の各種仕様不整合を修正 (`js/viewer.js`)**
  - プロフィール画像1が未設定で画像2のみ設定されている場合は切替タブを出さず画像2を初期表示するよう修正
  - `modalLabel` と `modalNumberFormat` が両方空欄のときに左上の四角ドット（`.ba-modal-top-dot`）を残さないよう修正
  - `modalNumberFormat` に `{01}` 等のトークンが含まれない場合に末尾へ番号を強制連結しないよう修正
  - カードとモーダルの小カテゴリタグ表示順をカテゴリ順・小カテゴリ並び順に連動させる `getOrderedCharAttrs()` を追加
- **画像アップロード最適化のエッジケースを改善 (`js/state.js`)**
  - `file.type` が空になる環境でもファイル拡張子から画像MIMEを推定できるよう `inferImageMime()` を追加
  - `maxDimension` 以下かつ軽量（350KB以下）の PNG / WebP やリサイズ不要でサイズが増える場合は `<canvas>` による非可逆再エンコードをスキップして元データを保持
  - 無変換埋め込み（SVG / GIF / アニメーションWebP）に 2MB 上限ガードを追加し、`localStorage` 容量の即時超過を防止

## [Ver.0.17c] - 2026-11-19

### バグ修正
- **スペック欄見出し（`site.specSectionLabel`）の強制大文字化を撤廃 (`js/viewer-styles.js`, `pole-girls-archive.html`)**
  - `.ba-section-label` から `text-transform: uppercase;` を削除し、小文字混じりの設定値（例: `Spec Data`）がそのまま表示されるように修正（あわせてサンプル公開HTML `pole-girls-archive.html` のCSS・ビューアコードも最新化）
- **アイコン画像クリア・読込失敗時の仮画像統一とデッドコード整理 (`js/templates.js`, `js/editor.js`)**
  - エディタのキャラ一覧サムネイル・アイコンプレビュー・プロフィール画像1プレビューの未設定時表示を、ビューア共通の頭文字1文字SVG（`CASTemplates.getFallbackAvatar()`）へ統一
  - エディタ内のプレビュー `<img>` に `error` フォールバックを付与し、リンク切れや不正パス時にも壊れた画像表示にならないよう改善
  - 未使用だった `generatePlaceholderSVG(..., "standing")` 等のデッドコードを削除し `getFallbackAvatar()` へ整理
- **日本語＋一部英数字のサイトタイトルで出力ファイル名が破片化する問題を修正 (`js/io.js`)**
  - `getDefaultBaseNameFromTitle()` を追加し、サイトタイトルに日本語等の非ASCII文字が含まれる場合は一部の英数字（`v2`・`2026` 等）だけを抽出せず既定名 `pole-girls-archive` を用いるよう改善
- **大カテゴリ名の空欄・空白保存を防止 (`js/editor.js`, `js/viewer.js`)**
  - `[data-cat-name]` 入力欄に小カテゴリと同様の空欄禁止・`change` 時直前値復元ガード（`data-prev-name`）と警告トーストを追加し、リロード時の意図しない自動改名を防止
  - ビューア側の未設定時ラベル表記を `"大カテゴリ"` に統一
- **「＋ 新規キャラ」の初期名重複・27人目ループを修正 (`js/editor.js`)**
  - 既存キャラ名との重複を避けて `キャラA`〜`キャラZ` の空きを探し、27人目以降は `キャラ27` 以降の連番を割り当てるよう修正

## [Ver.0.17b] - 2026-11-19

### バグ修正
- **共通タブ名入力時に他キャラの個別タブ名が上書きされる不具合を修正 (`js/editor.js`, `js/state.js`)**
  - `#inp-site-img-tab1` / `#inp-site-img-tab2` の `input` イベントで他キャラの `standingTab1Label` / `standingTab2Label` を空欄に書き換える副作用を削除
  - 旧バージョンデータ（`site.imageTab1Label` 等が未定義のデータ）の読込時のみ、`normalizeProjectData()` でデフォルト文字列（`"画像1"` / `"画像2"`）から継承用空欄へ一度だけ移行する方式へ変更
- **書き出しダイアログ表示中・IME変換中・入力欄フォーカス中の Escape で背面モーダルが閉じる／フォーカスが奪われる不具合を修正 (`js/viewer.js`)**
  - `onKeyDown()` で `e.isComposing || e.keyCode === 229`、開いている `<dialog open>`、および `#studio-confirm-modal` 表示中をガードし早期リターンするよう修正
  - 入力要素（`INPUT` / `TEXTAREA` / `SELECT` / `isContentEditable`）フォーカス中も `Escape` で背面モーダルを閉じないよう統一
- **初期データリセット直後に保留中の自動保存タイマーで localStorage へ再保存される競合を修正 (`js/state.js`, `js/main.js`)**
  - `CASState.cancelAutoSave()` を追加し、リセット実行時に保留中の `saveTimer` をキャンセルしてから `localStorage.removeItem()` を実行するよう修正
- **画像URL入力欄変更直後の他ボタンクリックが1回吸い込まれる不具合を修正 (`js/editor.js`)**
  - `bindImageUrlInput()` の `change` イベントでサイドバー全体を再描画せず、`hooks.syncAll(true)` ＋プレビュー画像・キャラ一覧サムネイルの部分更新のみを行うよう改善
- **非同期の画像アップロード完了前にデータ切替やキャラ削除を行った際の不整合を修正 (`js/main.js`)**
  - `optimizeUploadedImage()` 完了後に現在の `State.getProjectData()` と対象 `charId` の存在を再確認し、一致する場合のみ画像反映・トースト通知を行うよう修正

## [Ver.0.17] - 2026-11-19

### 新機能・改善
- **スペック欄見出しのカスタマイズに対応 (`js/templates.js`, `js/state.js`, `js/editor.js`, `js/viewer.js`)**
  - 「サイト設定」に「スペック欄見出し（別窓・空欄で非表示）」（`site.specSectionLabel`、初期値 `SPECIFICATION // DATA`）を追加し、任意の文字列への変更または空欄での非表示に対応
- **画像1 / 画像2 タブ表記のサイト設定に対応 (`js/templates.js`, `js/state.js`, `js/editor.js`, `js/viewer.js`)**
  - 「サイト設定」に「画像1 タブ名（共通）」（`site.imageTab1Label`、初期値 `画像1`）および「画像2 タブ名（共通）」（`site.imageTab2Label`、初期値 `画像2`）を追加
  - キャラ個別の「タブ名1 / タブ名2」（`standingTab1Label` / `standingTab2Label`）は初期値を空欄（サイト設定を継承）とし、キャラごとに個別上書きしたい場合のみ入力する挙動に整理

## [Ver.0.16b] - 2026-11-19

### バグ修正
- **スペック項目入力欄などの幅崩れ（オフラインフォールバックCSS詳細度衝突）を修正 (`index.html`, `js/editor.js`)**
  - `#editor-chrome-styles` 内の `#editor-tab-body input[type="text"] { width: 100%; }` 等のIDセレクタが Tailwind の `w-[38%]`・`flex-1`・`bg-[#00AEFF]` 等を上書きし、スペック項目の右欄（内容入力欄）が極端に狭く潰れて見えていた不具合を修正
  - オフラインフォールバックCSSを詳細度ゼロの `:where(...)` で囲み、通常時は Tailwind クラスが優先され、オフライン時のみフォールバックが効くように修正
  - スペック項目入力欄（`data-spec-key="label"` / `"value"`）に `min-w-0` を追加

---

## [Ver.0.16] - 2026-11-19

### 機能追加
- **公開用HTML書き出し時のファイル名入力ダイアログを追加 (`index.html`, `js/state.js`, `js/io.js`, `js/main.js`)**
  - ネイティブ `<dialog>`（`#studio-export-dialog`）を用いたファイル名指定モーダルを追加し、書き出し前に半角英数字のファイル名を指定・確認できるように対応
  - 初期値は半角英数字の `pole-girls-archive`（サイトタイトルに有効な英数字が含まれる場合はそのスラッグ、末尾 `.html` 入力時は自動整形）とし、入力中に出力ファイル名プレビュー（`<name>.html`）をリアルタイム表示

---

## [Ver.0.15e] - 2026-11-19

### バグ修正
- **キーワード検索の小カテゴリ名対応と複数ワード（スペース区切り）AND検索を実装 (`js/viewer.js`)**
  - `getFilteredCharacters()` の検索対象 `haystack` に小カテゴリ名（`attributeIds` から解決した名前）を追加
  - 検索クエリを空白（半角・全角スペース）で分割し、すべての語を含むキャラクターを一致させるAND検索へ改善
- **カード・モーダル番号を全キャラ配列上の登録通し番号に固定 (`js/viewer.js`)**
  - 絞り込み中もカードの `NO.01` およびモーダルヘッダの連番が `data.characters` 上の登録順に固定されるよう修正
- **公開HTML／JSON出力ファイル名を半角英小文字・記号規約に統一 (`js/io.js`, `AGENTS.md`)**
  - `sanitizeFilename()` で空白の `-` 化および非ASCII文字除外を行い、日本語タイトル時は `pole-girls-archive.html` / `pole-girls-archive-data.json` が出力されるよう修正
- **アニメーション GIF / WebP の静止画化防止と極細長画像の辺長 `0` 防止 (`js/state.js`)**
  - `image/gif` および RIFF `VP8X` アニメーションフラグ付き WebP（`isAnimatedWebPBuffer()`）を `<canvas>` 再エンコードせず元データのまま Data URI 化するよう修正
  - リサイズ時の辺長計算に `Math.max(1, ...)` を追加し、極端に細長い画像で幅・高さが `0` になるのを防止

---

## [Ver.0.15d] - 2026-11-19

### バグ修正
- **「＋ 新規キャラ」追加時の初期画像と残存プレースホルダーを修正 (`js/editor.js`)**
  - 新規キャラ追加時の初期 `iconUrl` / `standingUrl` を旧SVG生成から `img/char_a_icon.webp` / `img/char_a_standing.webp` に統一
  - スペック・キャッチコピー・画像URL入力欄の旧雛形プレースホルダー（`身長`・`160cm`・`作戦開始です！`・`.png` 等）を架線柱ちゃん向け表記へ更新
- **画像URL直接入力欄のクリア挙動統一と埋込画像誤消去を防止 (`js/editor.js`)**
  - アイコン画像にも「クリア」ボタンを追加し、URL未埋込時は全3箇所で空欄確定＝クリアに統一
  - Base64埋込画像（`data:`）設定中の空欄／空白 `change` で既存埋込画像が消去されないようガードを追加
- **「データ読込」「リセット」時のビューア状態初期化と不要な即保存を修正 (`js/viewer.js`, `js/main.js`)**
  - `viewer.updateData(data, { resetView: true })` および `resetViewState()` を追加し、読込・リセット時に検索語・カテゴリ選択・OR/AND条件・モーダル状態をリセット
  - 初回起動末尾およびリセット直後の無条件 `scheduleAutoSave()` を廃止し、未編集のまま初期データが `localStorage` に固定化されないよう修正
- **「カテゴリ」タブのUI・データ整合性を修正 (`js/editor.js`)**
  - 新規小カテゴリカラー確定時と「履歴クリア」時に `#attr-color-history-wrap` のみ部分再描画し、入力中の小カテゴリ名・分類が消えないように改善
  - 既存小カテゴリ名の空文字確定を禁止（直前の有効名へ復元＋警告表示）
  - 大カテゴリ名が空のときの `<select>` `<option>` フォールバック（`|| "大カテゴリ"`）を追加
  - 途中の大カテゴリ削除後に「＋ 大カテゴリ追加」しても既存名と重複しない空き名探索ロジックへ修正
- **不正JSON読込時の防御強化とカラーコードの大文字統一 (`js/state.js`, `js/editor.js`)**
  - `normalizeProjectData()` で `site` 各プロパティの型検証・配列内の `null` / 非オブジェクト要素除去・`attributeIds` の重複排除を実施
  - サイト設定・キャラ設定・小カテゴリ設定の色保存値をすべて大文字 `#RRGGBB` に統一

---

## [Ver.0.15c] - 2026-11-19

### バグ修正
- **少キャラ数時の背景パターン途切れを修正 (`index.html`, `js/io.js`, `js/viewer-styles.js`)**
  - プレビュー側 `#preview-pane` / `#archive-app` および書き出しHTML側 `body` / `#archive-app` に `min-height: 100dvh`・フレックス伸長を設定し、`.ba-root` が常に表示領域全高まで伸びて背景パターン・光彩が途中で切れないよう修正
- **編集モードのモーダル／モバイルサイドバーとツールバーの干渉を修正 (`index.html`, `js/main.js`)**
  - `ResizeObserver` で `#studio-toolbar` の実高さを `--studio-toolbar-h` へ同期し、デスクトップ編集モードの `.ba-modal-overlay` の `top` とモバイル `#editor-sidebar` / `#mobile-sidebar-backdrop` の `top` がツールバー直下になるよう修正
- **ナンバリング書式の大文字強制と空欄非表示不可を修正 (`js/viewer-styles.js`, `js/viewer.js`)**
  - `.ba-modal-top-label`・`.ba-card-sub`・`.ba-profile-sub`・`.ba-counter-label` の `text-transform: uppercase;` を撤廃し、`No.{1}` 等が入力通りの大文字・小文字で表示されるよう修正
  - `formatModalHeaderLabel()` と `renderHeader()` で `modalNumberFormat` や `counterLabel` が空欄（`""`）のときは番号・ラベルを表示しないよう修正
- **モーダルを開いたまま編集時のスクロール位置リセットを修正 (`js/viewer.js`)**
  - 同一キャラクターの再描画時（`lastRenderedModalCharId === ch.id`）に `.ba-modal-info` および `.ba-modal-body` の `scrollTop` を保持するよう修正
- **確認ダイアログ表示中の `Escape` キー干渉を修正 (`js/state.js`, `js/viewer.js`)**
  - `showConfirmDialog()` にキャプチャフェーズの `Escape` キーキャンセルハンドラを追加して `stopPropagation()` し、`viewer.js` の `onKeyDown` にも `e.defaultPrevented` ガードを追加
- **プロフィールモーダルのフォーカス漏れ・背面スクロール貫通・ドラッグ誤爆を修正 (`js/viewer-styles.js`, `js/viewer.js`)**
  - 閉じた状態の `.ba-modal-overlay` に `visibility: hidden` と `inert` を付与してフォーカス漏れを防止（閉じた際に元要素へフォーカス復帰）
  - `overscroll-behavior: contain` と開時の背面スクロールロックを追加し、背面ページのスクロール貫通を防止
  - `mousedown` の発生元が背景オーバーレイ自身である場合のみ背景クリックで閉じるよう修正し、モーダル内テキストのドラッグ選択時の誤閉鎖を防止
- **モバイル表示モーダルの画像フォールバック見切れ・長いタブ名溢れを修正 (`js/viewer-styles.js`)**
  - 780px以下で `.ba-modal-stage` の上限高さを調整し、`.ba-modal-art`・`.ba-modal-art.is-icon-fallback` のサイズを収まるよう調整
  - `.ba-stage-tabs` に `max-width: calc(100% - 24px)`、`.ba-stage-tab` に省略記号（`text-overflow: ellipsis`）を設定

---

## [Ver.0.15b] - 2026-11-19

### バグ修正
- **検索欄での日本語（IME）変換中断を修正 (`js/viewer.js`, `js/viewer-styles.js`)**
  - `renderFilterPanel()` で毎回 `filterEl.innerHTML` を丸ごと再構築していた処理を見直し、`<input class="ba-search-input">` を含む骨格は初回のみ生成（`ensureFilterPanelSkeleton()`）し、入力時は件数・クリアボタン表示・ボタン群のみ更新するよう変更
  - `.ba-search-clear[hidden] { display: none; }` を追加し、非表示制御が確実に効くよう修正
- **小カテゴリ追加時の日本語IME変換確定 Enter による誤登録を修正 (`js/editor.js`)**
  - `#inp-new-attr-name` の `keydown` ハンドラに `e.isComposing || e.keyCode === 229` ガードを追加
- **Tailwind CSS v3 CDN と非互換な v4 専用クラスを修正 (`index.html`, `js/editor.js`)**
  - `backdrop-blur-xs` → `backdrop-blur-sm`、`shadow-xs` / `shadow-2xs` → `shadow-sm`、`rounded-xs` → `rounded-sm` へ置き換え
- **完全オフライン環境でのレイアウト崩壊および確認モーダル露出を修正 (`index.html`)**
  - `#editor-chrome-styles` 内に `.hidden` / `.sr-only` / ツールバー・サイドバー・プレビュー・確認モーダル・トースト・アイコンサイズの基本フォールバックCSSを追加し、Tailwind CDN 読込不可時も崩れず動作するよう修正
- **絞り込み中のモーダルでキーボード `←` / `→` 移動が効かないケースを修正 (`js/viewer.js`)**
  - `renderModal()` と `onKeyDown()` が共通の `getModalNavContext()` を参照するよう統一し、表示中キャラが絞り込み結果に含まれない場合も全キャラ一覧へフォールバックして矢印キー移動が機能するよう修正

---

## [Ver.0.15] - 2026-11-19

### UI文言・表記変更
- **「属性管理」を「カテゴリ」へ、各用語を「大カテゴリ / 小カテゴリ」へ統一 (`index.html`, `js/editor.js`, `js/state.js`, `js/viewer.js`)**
  - エディタタブ「属性管理」を「カテゴリ」に改名し、キャラ編集タブの関連リンクも「小カテゴリ（複数選択可）」「+ カテゴリを管理」へ更新
  - 大カテゴリ設定のラベル・追加時初期名称規則を「大カテゴリA、B、C…」に変更
  - 「新しい属性を追加」を「新しい小カテゴリを追加」に変更し、入力プレースホルダー（`小カテゴリ名`）・一覧見出し（`登録済みの小カテゴリ`）・追加／削除ダイアログやトースト、ビューアの空状態／aria-label 表記をすべて「小カテゴリ / カテゴリ」へ統一

---

## [Ver.0.14] - 2026-11-19

### UI調整・仕様改善
- **プロフィールモーダルの画像切替タブを上側へスタイリッシュに配置 (`js/viewer-styles.js`)**
  - `.ba-stage-tabs` をステージ上部中央に配置し、`:has(.ba-stage-tabs)` によりタブ表示時は上部余白を確保して画像と重ならないよう調整
- **「仮置きに戻す」ボタン表記変更＆WebP仮置き復元に対応 (`js/editor.js`)**
  - 「仮置きSVG」「仮置きSVGに戻す」ボタン表記をすべて「仮置きに戻す」へ統一
  - 「プロフィール画像 2」プレビューの未設定時表示および「仮置きに戻す」時の復元先を WebP サンプル画像（`img/char_a_icon.webp` / `img/char_a_standing.webp` / `img/char_a_standing2.webp`）へ変更

---

## [Ver.0.13] - 2026-11-19

### 仕様変更・表示調整
- **デフォルトキャラの「画像2」にもサンプル WebP 画像を設定 (`img/char_a_standing2.webp`, `js/templates.js`)**
  - `img/char_a_standing2.webp`（600×900・人形シルエット＋`sample 2` 表記）を追加し、`createDefaultData()` の `char_a.standingUrl2` に設定
  - 初期状態からプロフィールモーダル内の「画像1 / 画像2」タブ切り替えを確認できるように改善
- **フッター最下部のシステム表記を更新 (`js/viewer.js`)**
  - `CHARACTER ARCHIVE SYSTEM` を `CHARACTER ARCHIVE SYSTEM（Powered by しーさいど）` に変更

---

## [Ver.0.12] - 2026-11-19

### 機能追加
- **プロフィールモーダルのタイトル＆ナンバリング書式を設定可能化 (`js/templates.js`, `js/editor.js`, `js/viewer.js`)**
  - 「サイト設定」タブに「プロフィール窓タイトル」（`site.modalLabel`、初期値 `CHARACTER PROFILE`）と「ナンバリング書式」（`site.modalNumberFormat`、初期値 `// {01}`）を追加
  - `{01}`（2桁）・`{001}`（3桁）・`{1}`（桁埋めなし）および任意の前置記号（`#{01}` 等）に対応
- **プロフィールモーダルのキャラクター画像を2枚設定＆タブ切替可能化 (`js/templates.js`, `js/state.js`, `js/main.js`, `js/editor.js`, `js/viewer.js`, `js/viewer-styles.js`)**
  - キャラクターデータに `standingUrl2`、`standingTab1Label`（初期値 `画像1`）、`standingTab2Label`（初期値 `画像2`）を追加
  - 「キャラ編集」タブでプロフィール画像 1・2 とそれぞれのタブ名を個別にアップロード／URL指定／編集できるように対応
  - プロフィール画像 2 が設定されている場合、モーダル内の画像ステージ下部に切替タブ（`.ba-stage-tabs`）を表示して切り替えられるように対応

---

## [Ver.0.11] - 2026-11-19

### 仕様変更（デフォルト属性の架線柱ちゃん向け刷新）
- **デフォルトの大カテゴリ・属性を「架線柱ちゃん」向けに更新 (`js/templates.js`)**
  - `材質`：`鉄柱`、`コンクリート柱`、`木柱`
  - `地域`：`関東`、`中部`、`関西`
  - `特性`：`最初から電鉄`、`汽車→電化`
  - `その他`：`鋼管柱`、`テーパー柱`、`ノーテーパー柱`
  - サンプルキャラ（`char_a`）の初期属性も新属性ID（`attr_steel` / `attr_kanto` / `attr_electric_origin`）へ更新

---

## [Ver.0.10] - 2026-11-19

### 機能追加
- **大カテゴリの追加・並び替え・削除に対応 (`js/editor.js`)**
  - 「属性管理」タブの「大カテゴリ設定」に「＋ カテゴリ追加」ボタン（`#btn-add-cat`）を追加し、属性A〜C以降も任意にカテゴリを増やせるように対応
  - 各カテゴリの並び替え（上へ・下へ）および削除ボタンを追加（削除時は所属属性を先頭カテゴリへ自動退避、最低1件は保持）

---

## [Ver.0.09] - 2026-11-19

### 機能追加・文言変更
- **検索入力欄のプレースホルダーを変更 (`js/viewer.js`)**
  - `名前・紹介文・スペックで検索...` を `検索ワードを入力` に変更
- **属性カラーでの使用履歴参照に対応 (`js/editor.js`)**
  - 「属性管理」タブの新規属性追加欄に、テーマカラーと共通の「使用履歴（最近使ったカラー）」スウォッチおよび「履歴クリア」ボタンを追加
  - 新規属性追加時および既存属性のカラーピッカー確定（`change`）時に `CASState.recordThemeColor()` で使用履歴へ自動記録されるように対応

---

## [Ver.0.08] - 2026-11-19

### 機能追加・UI整理
- **属性の大カテゴリ分類（属性A / 属性B / 属性C）とカテゴリ名編集機能を追加 (`js/templates.js`, `js/state.js`, `js/editor.js`, `js/viewer.js`, `js/viewer-styles.js`)**
  - `projectData.attributeCategories`（初期値：`属性A` / `属性B` / `属性C`）および各属性の `categoryId` を導入（既存JSON/HTML読込時の自動補完にも対応）
  - 「属性管理」タブに「大カテゴリ名の設定」欄、新規属性追加時のカテゴリ選択、登録済み属性のカテゴリ別グループ表示＆所属変更機能を追加
  - 「キャラ編集」タブの属性選択およびビューア側の絞り込みフィルターバーをカテゴリ別グループ表示に対応
- **属性名入力欄のプレースホルダー例を削除 (`js/editor.js`)**
  - `属性名（例: 振動、学園名、レア度）` を `属性名` に変更

---

## [Ver.0.07] - 2026-11-19

### 機能追加・UI改善
- **テーマカラーの履歴記録機能とデフォルトプリセット拡充 (`js/templates.js`, `js/state.js`, `js/editor.js`)**
  - `COLOR_PRESETS` を8色から16色へ拡充
  - `CASState` にテーマカラー使用履歴（最大12件・`localStorage` 永続化）の記録・取得・クリア機能を追加
  - キャラ編集のテーマカラー欄に「使用履歴（最近使ったカラー）」スウォッチと「履歴クリア」ボタンを追加
- **エディタラベルの文言調整 (`js/editor.js`)**
  - 「サブ名（英字・コードネーム等）」を「サブテキスト」に変更
  - 「画像設定（ローカル画像はBase64自動埋込）」から括弧書きを削除し「画像設定」に変更

---

## [Ver.0.06] - 2026-11-19

### 仕様変更（デフォルトプロフィール更新）
- **デフォルトのキャッチコピー・スペック・紹介文を「架線柱ちゃん」向けに更新 (`js/templates.js`, `js/editor.js`)**
  - キャッチコピー／台詞：`架線柱ちゃんです！`
  - スペック項目：`柱材質／鉄柱`、`ビーム形状／平面トラス等`、`設置時期／昭和5年（開業時）`、`所在地／本線`（4項目構成へ整理）
  - 紹介テキスト：`　開業から95年、今日も同じ場所に立ち続けている……はずなのだが、注目度が低すぎて、不明な事が多い架線柱ちゃんだ！`
  - 「＋ 新規キャラ」追加時の初期スペック項目名も `柱材質` / `ビーム形状` / `設置時期` / `所在地` に統一

---

## [Ver.0.05] - 2026-11-19

### 機能追加・文言変更
- **ヘッダーのカウンターラベルを編集可能化＆デフォルト文言変更 (`js/templates.js`, `js/viewer.js`, `js/editor.js`)**
  - サイト設定に `site.counterLabel` を追加し、デフォルト値を `REGISTERED UNITS` から `"キャラクター総数"` へ変更
  - 「サイト設定」タブの「ヘッダー＆サイト基本情報」にカウンターラベル入力欄（`#inp-site-counter-label`）を追加
  - `viewer.js` の `renderHeader()` が `site.counterLabel` を描画するように更新
- **背景パターン説明文の更新 (`js/editor.js`)**
  - 「グリッド」背景の説明文を「学園アーカイブ風の方眼ライン」から「スタイリッシュな方眼ライン」へ変更

---

## [Ver.0.04] - 2026-11-19

### 仕様変更・サンプル整理
- **仮置きのキャラB・キャラCを削除 (`js/templates.js`, `index.html`, `js/main.js`, `img/*`)**
  - `createDefaultData().characters` から `char_b`・`char_c` を削除し、サンプルは `char_a` のみに整理
  - 不要になった `img/char_b_*`・`img/char_c_*` および旧 `.svg` ファイルを削除
  - リセットボタンおよび確認ダイアログ／トーストの「キャラA〜C」表記を汎用表現へ更新
- **サンプル画像をシンプルな人形シルエット＋「sample」表記の WebP 画像へ置換 (`img/char_a_icon.webp`, `img/char_a_standing.webp`, `js/templates.js`)**
  - `img/char_a_icon.webp`（512×512）および `img/char_a_standing.webp`（600×900）を作成して格納
  - `createDefaultData()` の `char_a` 画像パスを `.webp` ファイルへ更新

---

## [Ver.0.03] - 2026-11-19

### 仕様変更・ドキュメント更新
- **`img/` フォルダ新設と初期データの画像パス参照化 (`img/*`, `js/templates.js`, `js/editor.js`)**
  - `img/` フォルダを作成し、仮置きSVGファイル（`char_a_icon.svg` / `char_a_standing.svg` 等）を格納
  - `createDefaultData()` の初期キャラクター画像参照をデータURI直接記述から `img/<id>_icon.svg` / `img/<id>_standing.svg` の相対パス参照へ変更
  - キャラ編集フォームの画像パス・URL入力欄プレースホルダーを `img/...` 相対パス指定が分かりやすい表記へ更新
- **GitHub Pages / `file://` 両対応のファイル・画像参照ルールを整備 (`AGENTS.md`)**
  - 相対パス必須（先頭 `/` 禁止）、大文字・小文字一致（半角英小文字統一）、命名規則（`img/<char_id>_icon.<ext>` / `img/<char_id>_standing.<ext>`）、書き出しHTMLの配置ルールを明記

---

## [Ver.0.02] - 2026-11-19

### 仕様変更・架線柱ちゃん向け初期対応
- **プロジェクト名を `pole-girls-archive` へ変更 (`AGENTS.md`, `CHANGELOG.md`, `js/io.js`, `js/state.js`)**
  - ディレクトリ名を `pole-girls-archive` に変更し、書き出し時のフォールバックファイル名も `pole-girls-archive` へ統一
- **サイト全体の設定・ブランディング・免責表記を「架線柱ちゃん」向けに更新 (`index.html`, `js/templates.js`, `js/editor.js`, `js/io.js`)**
  - `<title>` およびツールバータイトルを `POLE GIRLS ARCHIVE` へ変更
  - `createDefaultData().site` のタイトル・サブタイトル・装飾バッジ（`POLE GIRLS // ARCHIVE DATABASE`）・フッター（`© しーさいど (@SeasideExp) / アンバリヅカ // ※実在の鉄道会社様とは一切関係ありません。`）を更新
- **仮置きSVGプレースホルダーを架線柱モチーフへ刷新 (`js/templates.js`)**
  - `generatePlaceholderSVG()` 内の初期アバターを廃止し、アイコン用・立ち絵用ともに架線柱・ビーム（腕金）・耳付きキャップ・がいし連・架線ラインの幾何学シルエット（`POLE VISUAL // PLACEHOLDER` / `POLE // ...`）へ刷新

---

## [Ver.0.01] - 2026-11-19

### 初期構築・モジュール分離
- **オールインワンHTML雛形（`character_archive_studio.html`）から開発向けマルチファイル構成へ分離**
  - エントリーHTMLを `index.html` として整理し、インライン `<script>` 内に集約されていた各機能を単一責任ごとに `js/` 配下の7ファイルへ分割
    - `js/templates.js` (`window.CASTemplates`): 仮置きSVG生成・初期テンプレートデータ・カラープリセット
    - `js/viewer-styles.js` (`window.CASViewerStyles`): ライブプレビュー＆公開HTML共通CSS（`VIEWER_CSS`）
    - `js/viewer.js` (`window.CASViewer`): 自己完結型ビューアエンジン（`initArchiveViewer`）
    - `js/state.js` (`window.CASState`): バージョン管理・状態管理・データ正規化・`localStorage` 自動保存・トースト／確認ダイアログ／画像最適化ユーティリティ
    - `js/io.js` (`window.CASIO`): 公開用単一HTML書き出し・JSON設定保存・JSON／書き出し済みHTML再読込
    - `js/editor.js` (`window.CASEditor`): 左サイドバーUI（キャラ編集／属性管理／サイト設定タブ）
    - `js/main.js` (`window.CASMain`): アプリ初期化・ビューア／エディタ連携・モード切替・ツールバー操作統括
  - `file://` 直接実行および公開用単一HTML書き出し（`initArchiveViewer.toString()` 埋め込み）の互換性を維持
- **開発ドキュメント作成**
  - `AGENTS.md`（バージョン管理ルール、`file://` 互換規約、スタンドアロン書き出し不変条件、モジュール構成表）を新規作成
  - `CHANGELOG.md` を新規作成
