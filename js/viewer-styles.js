/**
 * viewer-styles.js
 * 公開用HTML・ライブプレビュー共通CSS（外部依存ゼロ・完全完結）
 * ※ file:// 環境から単一HTML書き出しへそのまま埋め込めるよう文字列定数として保持
 * 名前空間: window.CASViewerStyles
 */
(function (global) {
  "use strict";

  const VIEWER_CSS = `
/* ===== Base & Theme Tokens ===== */
.ba-root {
  --ba-accent: #00AEFF;
  --ba-accent-rgb: 0, 174, 255;
  --ba-accent-text: #FFFFFF;
  --ba-navy: #1B2B44;
  --ba-navy-sub: #3A506B;
  --ba-muted: #64748B;
  --ba-surface: #FFFFFF;
  --ba-bg: #F4F7FB;
  --ba-border: #DCE6F2;
  position: relative;
  flex: 1 0 auto;
  min-height: 100%;
  color: var(--ba-navy);
  background-color: var(--ba-bg);
  font-family: "Inter", "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;
  line-height: 1.6;
  overflow-x: clip;
  -webkit-font-smoothing: antialiased;
}

.ba-root *, .ba-root *::before, .ba-root *::after {
  box-sizing: border-box;
}

/* 背景レイヤー（パターン切替 + 光彩グラデーション） */
.ba-bg-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    radial-gradient(circle at 88% 8%, rgba(var(--ba-accent-rgb), 0.14) 0%, transparent 42%),
    radial-gradient(circle at 8% 85%, rgba(var(--ba-accent-rgb), 0.10) 0%, transparent 44%);
}

.ba-root[data-pattern="grid"] .ba-bg-pattern {
  background-image:
    linear-gradient(to right, rgba(27, 43, 68, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(27, 43, 68, 0.05) 1px, transparent 1px);
  background-size: 32px 32px;
}

.ba-root[data-pattern="dots"] .ba-bg-pattern {
  background-image: radial-gradient(rgba(27, 43, 68, 0.12) 1.4px, transparent 1.4px);
  background-size: 22px 22px;
}

.ba-root[data-pattern="stripes"] .ba-bg-pattern {
  background-image: repeating-linear-gradient(
    -45deg,
    rgba(27, 43, 68, 0.035) 0px,
    rgba(27, 43, 68, 0.035) 2px,
    transparent 2px,
    transparent 16px
  );
}

.ba-bg-pattern {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.ba-container {
  position: relative;
  z-index: 1;
  max-width: 1220px;
  margin: 0 auto;
  padding: 28px 20px 64px;
}

/* ===== Header (B Archive Style) ===== */
.ba-header {
  position: relative;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border: 1px solid var(--ba-border);
  border-radius: 18px;
  padding: 26px 30px;
  margin-bottom: 24px;
  box-shadow: 0 10px 30px -12px rgba(27, 43, 68, 0.10);
  overflow: hidden;
}

.ba-header::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--ba-accent), rgba(var(--ba-accent-rgb), 0.72) 60%, transparent 100%);
}

.ba-header::after {
  content: "";
  position: absolute;
  top: -30px;
  right: -40px;
  width: 240px;
  height: 180%;
  background: linear-gradient(135deg, rgba(var(--ba-accent-rgb), 0.11), rgba(var(--ba-accent-rgb), 0.02));
  transform: skewX(-20deg);
  pointer-events: none;
}

.ba-header-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
}

.ba-badge-wrap {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  margin-bottom: 10px;
}

.ba-badge {
  display: inline-flex;
  align-items: center;
  background: var(--ba-navy);
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  padding: 4px 14px;
  transform: skewX(-14deg);
  border-left: 4px solid var(--ba-accent);
  box-shadow: 0 3px 10px rgba(27, 43, 68, 0.16);
}

.ba-badge span {
  display: inline-block;
  transform: skewX(14deg);
}

/* 装飾バッジ横のホームページリンク（案4：アクセント塗り・斜めスラッシュ＋光沢スイープ） */
.ba-home-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  background-color: var(--ba-accent);
  background-image: linear-gradient(95deg, rgba(255, 255, 255, 0.14), rgba(0, 0, 0, 0.08));
  color: var(--ba-accent-text, #FFFFFF);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  padding: 4px 13px;
  text-decoration: none;
  transform: skewX(-14deg);
  overflow: hidden;
  box-shadow: 0 4px 12px -2px rgba(var(--ba-accent-rgb), 0.45);
  transition: transform 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease;
}

.ba-home-link::after {
  content: "";
  position: absolute;
  top: 0;
  left: -130%;
  width: 60%;
  height: 100%;
  background: linear-gradient(105deg, transparent 18%, rgba(255, 255, 255, 0.46) 50%, transparent 82%);
  transition: left 0.48s ease;
  pointer-events: none;
}

.ba-home-link:hover {
  transform: skewX(-14deg) translateY(-1px);
  filter: brightness(1.06);
  box-shadow: 0 7px 16px -3px rgba(var(--ba-accent-rgb), 0.55);
}

.ba-home-link:hover::after {
  left: 150%;
}

.ba-home-link:focus-visible {
  outline: 3px solid var(--ba-navy);
  outline-offset: 2px;
}

.ba-home-link-inner {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transform: skewX(14deg);
}

.ba-home-link-icon,
.ba-home-link-arrow {
  flex-shrink: 0;
}

.ba-home-link-arrow {
  transition: transform 0.18s ease;
}

.ba-home-link:hover .ba-home-link-arrow {
  transform: translate(1.5px, -1.5px);
}

.ba-title {
  margin: 0;
  font-size: clamp(24px, 3.6vw, 36px);
  font-weight: 900;
  letter-spacing: 0.02em;
  color: var(--ba-navy);
  line-height: 1.2;
}

.ba-subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--ba-muted);
  font-weight: 500;
}

.ba-header-meta {
  display: flex;
  align-items: center;
  gap: 14px;
}

.ba-counter-box {
  background: #F4F7FB;
  border: 1px solid var(--ba-border);
  border-radius: 14px;
  padding: 12px 22px;
  text-align: right;
  min-width: 158px;
}

.ba-counter-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: var(--ba-accent);
  margin-bottom: 2px;
}

.ba-counter-value {
  font-size: clamp(28px, 3.4vw, 38px);
  font-weight: 900;
  color: var(--ba-navy);
  line-height: 1.08;
  font-variant-numeric: tabular-nums;
}

.ba-counter-value small {
  font-size: clamp(13px, 1.4vw, 15px);
  font-weight: 700;
  color: var(--ba-muted);
  margin-left: 4px;
}

/* ===== Filter & Search Panel (Compact & Sticky) ===== */
.ba-filter-sentinel {
  height: 1px;
  margin-bottom: -1px;
  pointer-events: none;
}

.ba-filter-panel {
  position: sticky;
  top: 8px;
  z-index: 40;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(10px);
  border: 1px solid var(--ba-border);
  border-radius: 14px;
  padding: 12px 16px;
  margin-bottom: 20px;
  box-shadow: 0 6px 20px -10px rgba(27, 43, 68, 0.08);
  transition: padding 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease;
}

.ba-filter-panel.is-stuck {
  padding: 9px 14px;
  background: rgba(255, 255, 255, 0.97);
  border-color: rgba(27, 43, 68, 0.14);
  box-shadow: 0 10px 28px -10px rgba(27, 43, 68, 0.18);
}

.ba-filter-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 10px;
  margin-bottom: 8px;
}

.ba-search-wrap {
  position: relative;
  flex: 1 1 200px;
  max-width: 340px;
}

.ba-search-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 15px;
  color: #94A3B8;
  pointer-events: none;
}

.ba-search-input {
  width: 100%;
  padding: 7px 32px 7px 34px;
  border-radius: 9px;
  border: 1.5px solid var(--ba-border);
  background: #F8FAFC;
  color: var(--ba-navy);
  font-size: 13px;
  font-weight: 600;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.ba-search-input:focus {
  border-color: var(--ba-accent);
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(var(--ba-accent-rgb), 0.16);
}

.ba-search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: none;
  background: #E2E8F0;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.ba-search-clear:hover {
  background: #CBD5E1;
}

.ba-search-clear[hidden] {
  display: none;
}

.ba-filter-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

/* OR / AND・昇順 / 降順・表示密度 切替ピル */
.ba-logic-toggle,
.ba-sort-toggle,
.ba-view-toggle {
  display: inline-flex;
  align-items: center;
  background: #EDF2F8;
  padding: 2.5px;
  border-radius: 9px;
  border: 1px solid var(--ba-border);
}

.ba-logic-btn,
.ba-sort-btn,
.ba-view-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  color: var(--ba-muted);
  font-size: 11px;
  font-weight: 800;
  padding: 4.5px 9px;
  border-radius: 6.5px;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.ba-view-btn svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.ba-logic-btn.is-active,
.ba-sort-btn.is-active,
.ba-view-btn.is-active {
  background: var(--ba-navy);
  color: #FFFFFF;
  box-shadow: 0 2px 6px rgba(27, 43, 68, 0.2);
}

.ba-result-count {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--ba-muted);
  padding: 0 3px;
  white-space: nowrap;
}

.ba-result-count strong {
  color: var(--ba-navy);
  font-size: 13px;
}

/* 属性フィルター（大カテゴリタブ切替＋コンパクトトレイ＋選択中バー） */
.ba-attr-bar {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.ba-cat-tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
}

.ba-cat-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4.5px 10px;
  border-radius: 8px;
  border: 1.5px solid var(--ba-border);
  background: #F4F7FB;
  color: var(--ba-navy-sub);
  font-size: 11.5px;
  font-weight: 800;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition: transform 0.14s ease, border-color 0.14s ease, background 0.14s ease, color 0.14s ease, box-shadow 0.14s ease;
}

.ba-cat-tab:hover {
  border-color: var(--ba-accent);
  color: var(--ba-navy);
  background: #FFFFFF;
}

.ba-cat-tab.has-selected:not(.is-open) {
  background: rgba(var(--ba-accent-rgb), 0.10);
  border-color: var(--ba-accent);
  color: var(--ba-navy);
}

.ba-cat-tab.is-all.is-active {
  background: var(--ba-navy);
  border-color: var(--ba-navy);
  color: #FFFFFF;
  box-shadow: 0 4px 12px -3px rgba(27, 43, 68, 0.28);
}

.ba-cat-tab.is-open {
  background: #FFFFFF;
  border-color: var(--ba-accent);
  color: var(--ba-navy);
  box-shadow: 0 3px 10px -2px rgba(var(--ba-accent-rgb), 0.22);
}

.ba-cat-tab.is-open::after {
  content: "";
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: -1.5px;
  height: 2.5px;
  border-radius: 999px;
  background: var(--ba-accent);
}

.ba-cat-tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.3;
  background: rgba(27, 43, 68, 0.08);
  color: var(--ba-muted);
  font-variant-numeric: tabular-nums;
}

.ba-cat-tab.has-selected:not(.is-open) .ba-cat-tab-badge {
  background: var(--ba-accent);
  color: var(--ba-accent-text, #FFFFFF);
}

.ba-cat-tab.is-open .ba-cat-tab-badge {
  background: rgba(27, 43, 68, 0.09);
  color: var(--ba-navy-sub);
}

.ba-cat-tab.is-open.has-selected .ba-cat-tab-badge {
  background: var(--ba-accent);
  color: var(--ba-accent-text, #FFFFFF);
}

.ba-cat-tab-chevron {
  font-size: 9px;
  opacity: 0.65;
  transition: transform 0.16s ease;
}

.ba-cat-tab.is-open .ba-cat-tab-chevron {
  transform: rotate(180deg);
  opacity: 0.9;
}

.ba-cat-tray {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #F4F7FB;
  border: 1px solid var(--ba-border);
  max-height: 36vh;
  overflow-y: auto;
}

.ba-attr-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 7px;
  border: 1.5px solid var(--ba-border);
  background: #FFFFFF;
  color: var(--ba-navy);
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  user-select: none;
}

.ba-attr-btn:hover {
  transform: translateY(-1px);
  border-color: var(--btn-color, var(--ba-accent));
  box-shadow: 0 3px 10px rgba(27, 43, 68, 0.08);
}

.ba-attr-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  transform: rotate(45deg);
  background: var(--btn-color, var(--ba-accent));
  flex-shrink: 0;
  transition: background 0.15s;
}

.ba-attr-btn.is-active {
  background: var(--btn-color, var(--ba-accent));
  border-color: var(--btn-color, var(--ba-accent));
  color: var(--btn-text, #FFFFFF);
  box-shadow: 0 4px 12px -3px rgba(27, 43, 68, 0.28);
}

.ba-attr-btn.is-active .ba-attr-dot {
  background: var(--btn-text, #FFFFFF);
}

.ba-attr-btn.is-all.is-active {
  background: var(--ba-navy);
  border-color: var(--ba-navy);
  color: #FFFFFF;
}

.ba-active-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid #EDF2F7;
}

.ba-active-filters-label {
  font-size: 11px;
  font-weight: 800;
  color: var(--ba-muted);
  white-space: nowrap;
}

.ba-active-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 7px;
  border: none;
  background: var(--chip-color, var(--ba-accent));
  color: var(--chip-text, #FFFFFF);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.15s ease;
}

.ba-active-chip:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.ba-active-chip-x {
  font-size: 12px;
  line-height: 1;
  opacity: 0.8;
}

.ba-active-clear {
  margin-left: auto;
  border: none;
  background: transparent;
  color: var(--ba-accent);
  font-size: 11.5px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease;
}

.ba-active-clear:hover {
  background: rgba(var(--ba-accent-rgb), 0.10);
}

@media (max-width: 640px) {
  .ba-filter-panel {
    top: 4px;
    padding: 9px 11px;
    margin-bottom: 16px;
    border-radius: 12px;
  }
  .ba-filter-panel.is-stuck {
    padding: 8px 10px;
    max-height: 46vh;
    max-height: 46dvh;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .ba-search-wrap {
    flex: 1 1 100%;
    max-width: none;
  }
  .ba-filter-controls {
    width: 100%;
    justify-content: space-between;
    gap: 5px;
  }
}

@media (max-width: 460px) {
  .ba-view-btn-label {
    display: none;
  }
}

/* ===== Character Icon Grid & View Modes ===== */
.ba-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 18px;
}

.ba-grid.is-view-compact {
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
}

.ba-grid.is-view-list {
  grid-template-columns: 1fr;
  gap: 10px;
}

@media (max-width: 520px) {
  .ba-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 11px;
  }
  .ba-grid.is-view-compact {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .ba-grid.is-view-list {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

/* 額装スタイルカード（極細ニュートラル外枠＋内側マット余白） */
.ba-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  border: 1px solid rgba(27, 43, 68, 0.12);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  padding: 0;
  box-shadow: 0 4px 14px -8px rgba(27, 43, 68, 0.09);
  transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.22s ease, border-color 0.22s ease;
}

.ba-card:hover {
  transform: translateY(-4px);
  border-color: rgba(27, 43, 68, 0.25);
  box-shadow: 0 14px 26px -12px rgba(27, 43, 68, 0.18);
}

.ba-card:focus-visible {
  outline: 3px solid var(--ba-accent);
  outline-offset: 2px;
}

/* 光沢スイープエフェクト */
.ba-card::after {
  content: "";
  position: absolute;
  top: 0;
  left: -130%;
  width: 65%;
  height: 100%;
  background: linear-gradient(105deg, transparent 20%, rgba(255, 255, 255, 0.5) 50%, transparent 80%);
  transform: skewX(-18deg);
  transition: left 0.55s ease;
  pointer-events: none;
  z-index: 3;
}

.ba-card:hover::after {
  left: 150%;
}

.ba-card-thumb {
  display: block;
  position: relative;
  width: 100%;
  padding: 8px 8px 6px;
  background: #FAFBFD;
  border-bottom: 1px solid rgba(27, 43, 68, 0.05);
}

.ba-card-thumb-frame {
  display: block;
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #FFFFFF;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(27, 43, 68, 0.08);
}

.ba-card-thumb-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.ba-card:hover .ba-card-thumb-frame img {
  transform: scale(1.045);
}

.ba-card-body {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
  background: #FFFFFF;
}

.ba-card-list-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.ba-card-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.ba-card-no {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--ba-navy-sub);
  background: #F1F5F9;
  border-left: 2.5px solid var(--char-color, var(--ba-accent));
  padding: 1px 5px;
  border-radius: 3px;
  font-variant-numeric: tabular-nums;
  line-height: 1.35;
}

.ba-card-sub {
  display: block;
  flex: 1;
  min-width: 0;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--char-color, var(--ba-accent));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ba-card-name {
  display: block;
  margin: 0;
  font-size: 15.5px;
  font-weight: 900;
  color: var(--ba-navy);
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ba-card-catch {
  display: block;
  font-size: 11.5px;
  color: var(--ba-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ba-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.ba-tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 5px;
  font-size: 10.5px;
  font-weight: 700;
  color: var(--tag-text, #FFFFFF);
  background: var(--tag-color, #64748B);
  letter-spacing: 0.02em;
}

/* コンパクトアイコン表示 */
.ba-grid.is-view-compact .ba-card {
  border-radius: 11px;
}

.ba-grid.is-view-compact .ba-card:hover {
  transform: translateY(-3px);
}

.ba-grid.is-view-compact .ba-card-thumb {
  padding: 5px 5px 4px;
  border-bottom: none;
  background: #FFFFFF;
}

.ba-grid.is-view-compact .ba-card-thumb-frame {
  border-radius: 5px;
}

.ba-grid.is-view-compact .ba-card-body {
  padding: 2px 6px 7px;
  gap: 0;
}

.ba-grid.is-view-compact .ba-card-name {
  font-size: 11.5px;
  font-weight: 800;
  text-align: center;
  line-height: 1.25;
}

/* リスト表示 */
.ba-grid.is-view-list .ba-card {
  flex-direction: row;
  align-items: center;
  padding: 7px 14px 7px 7px;
  gap: 12px;
  border-radius: 12px;
}

.ba-grid.is-view-list .ba-card:hover {
  transform: translateY(-2px);
}

.ba-grid.is-view-list .ba-card-thumb {
  width: 68px;
  height: 68px;
  flex-shrink: 0;
  padding: 4px;
  border-bottom: none;
  border-radius: 8px;
  background: #FAFBFD;
  border: 1px solid rgba(27, 43, 68, 0.06);
}

.ba-grid.is-view-list .ba-card-thumb-frame {
  border-radius: 5px;
}

.ba-grid.is-view-list .ba-card-body {
  padding: 1px 0;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 14px;
}

.ba-grid.is-view-list .ba-card-list-main {
  flex: 1 1 210px;
  gap: 2px;
}

.ba-grid.is-view-list .ba-card-name {
  font-size: 15px;
}

.ba-grid.is-view-list .ba-card-tags {
  margin-top: 0;
  justify-content: flex-end;
  flex: 0 1 auto;
}

@media (max-width: 520px) {
  .ba-grid.is-view-list .ba-card {
    padding: 6px 10px 6px 6px;
    gap: 10px;
  }
  .ba-grid.is-view-list .ba-card-thumb {
    width: 56px;
    height: 56px;
  }
  .ba-grid.is-view-list .ba-card-body {
    gap: 5px;
  }
  .ba-grid.is-view-list .ba-card-tags {
    justify-content: flex-start;
  }
}

/* 空状態 */
.ba-empty {
  text-align: center;
  padding: 58px 20px;
  background: rgba(255, 255, 255, 0.9);
  border: 1.5px dashed var(--ba-border);
  border-radius: 18px;
  color: var(--ba-muted);
}

.ba-empty-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 800;
  color: var(--ba-navy);
}

.ba-empty-btn {
  margin-top: 14px;
  padding: 8px 18px;
  border-radius: 9px;
  border: none;
  background: var(--ba-accent);
  color: var(--ba-accent-text, #FFFFFF);
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
}

/* ===== Footer ===== */
.ba-footer {
  margin-top: 48px;
  padding-top: 20px;
  border-top: 1px solid var(--ba-border);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  color: var(--ba-muted);
  font-weight: 600;
}

.ba-footer-accent {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--ba-navy-sub);
}

.ba-footer-accent::before {
  content: "";
  width: 14px;
  height: 4px;
  background: var(--ba-accent);
  transform: skewX(-20deg);
}

/* ===== Profile Modal Window (別窓プロフィール表示) ===== */
.ba-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(14, 25, 43, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  overscroll-behavior: contain;
  transition: opacity 0.22s ease, visibility 0.22s ease;
}

.ba-modal-overlay.is-open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.ba-modal-window {
  position: relative;
  width: 100%;
  max-width: 960px;
  max-height: min(88vh, 760px);
  max-height: min(88dvh, 760px);
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 28px 65px -16px rgba(10, 22, 42, 0.48);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: translateY(16px) scale(0.97);
  transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1);
}

.ba-modal-overlay.is-open .ba-modal-window {
  transform: translateY(0) scale(1);
}

.ba-modal-topbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  background: var(--ba-navy);
  color: #FFFFFF;
  border-bottom: 3px solid var(--modal-color, var(--ba-accent));
}

.ba-modal-top-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  min-width: 0;
}

.ba-modal-top-dot {
  width: 10px;
  height: 10px;
  background: var(--modal-color, var(--ba-accent));
  transform: skewX(-14deg);
  flex-shrink: 0;
}

.ba-modal-top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ba-modal-edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: var(--ba-accent);
  color: var(--ba-accent-text, #FFFFFF);
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: filter 0.15s;
}

.ba-modal-edit-btn:hover {
  filter: brightness(1.08);
}

.ba-modal-close {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, transform 0.15s;
}

.ba-modal-close:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: rotate(90deg);
}

/* モーダル本体 2カラム */
.ba-modal-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 41% 59%;
  overflow: hidden;
  overscroll-behavior: contain;
}

/* 左エリア：立ち絵ステージ */
.ba-modal-stage {
  position: relative;
  background: #EDF4FC;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 20px;
  border-right: 1px solid var(--ba-border);
}

.ba-modal-stage-bg {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(125deg, rgba(255,255,255,0.92) 0%, rgba(240,247,255,0.85) 55%, var(--modal-color, #00AEFF) 180%);
  pointer-events: none;
}

.ba-modal-stage-slash {
  position: absolute;
  top: -20%;
  left: -18%;
  width: 72%;
  height: 140%;
  background: var(--modal-color, var(--ba-accent));
  opacity: 0.13;
  transform: skewX(-16deg);
  pointer-events: none;
}

.ba-modal-stage-line {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 26%;
  width: 2px;
  background: var(--modal-color, var(--ba-accent));
  opacity: 0.24;
  transform: skewX(-16deg);
  pointer-events: none;
}

.ba-modal-art {
  position: relative;
  z-index: 2;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 12px;
  filter: drop-shadow(0 16px 26px rgba(27, 43, 68, 0.22));
  transform: scale(var(--art-scale, 1));
  transform-origin: center center;
  cursor: zoom-in;
}

.ba-stage-top-controls {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  pointer-events: none;
}

.ba-stage-zoom-btn {
  position: relative;
  flex-shrink: 0;
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 9px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(20, 34, 56, 0.72);
  backdrop-filter: blur(8px);
  color: #FFFFFF;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.03em;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(10, 22, 42, 0.22);
  transition: background 0.16s ease, transform 0.16s ease;
}

.ba-stage-zoom-btn:hover {
  background: rgba(20, 34, 56, 0.92);
  transform: scale(1.04);
}

.ba-stage-zoom-btn:focus-visible {
  outline: 3px solid var(--modal-color, var(--ba-accent));
  outline-offset: 2px;
}

.ba-stage-zoom-btn svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.ba-modal-art.is-icon-fallback {
  width: min(260px, 85%);
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border: 4px solid #FFFFFF;
  border-radius: 20px;
  box-shadow: 0 18px 34px rgba(27, 43, 68, 0.22);
}

/* ステージ画像切替タブ（上部配置） */
.ba-modal-stage:has(.ba-stage-tabs) {
  padding-top: 58px;
}

.ba-stage-tabs {
  position: relative;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  margin: 0 auto;
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px;
  border-radius: 10px;
  background: rgba(20, 34, 56, 0.90);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 6px 18px rgba(10, 22, 42, 0.22);
}

.ba-stage-tab {
  position: relative;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.78);
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.04em;
  padding: 5px 14px;
  border-radius: 7px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
}

.ba-stage-tab:hover {
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.10);
}

.ba-stage-tab.is-active {
  background: var(--modal-color, var(--ba-accent));
  color: var(--modal-color-text, #FFFFFF);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
}

/* ステージ下部・詳細解説リンクボタン（案3：上部タブと対になるグラスフローティング配置） */
.ba-modal-stage:has(.ba-stage-detail-link) {
  padding-bottom: 62px;
}

.ba-stage-detail-link {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
  max-width: calc(100% - 24px);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 15px 8px 13px;
  border-radius: 11px;
  background: rgba(20, 34, 56, 0.92);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-left: 3.5px solid var(--modal-color, var(--ba-accent));
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-decoration: none;
  box-shadow: 0 8px 22px rgba(10, 22, 42, 0.34);
  overflow: hidden;
  transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.ba-stage-detail-link::after {
  content: "";
  position: absolute;
  top: 0;
  left: -130%;
  width: 58%;
  height: 100%;
  background: linear-gradient(105deg, transparent 18%, rgba(255, 255, 255, 0.34) 50%, transparent 82%);
  transform: skewX(-18deg);
  transition: left 0.52s ease;
  pointer-events: none;
}

.ba-stage-detail-link:hover {
  transform: translateX(-50%) translateY(-2px);
  background: var(--modal-color, var(--ba-accent));
  color: var(--modal-color-text, #FFFFFF);
  border-color: rgba(255, 255, 255, 0.55);
  border-left-color: var(--modal-color-text, #FFFFFF);
  box-shadow: 0 12px 26px -4px rgba(10, 22, 42, 0.42);
}

.ba-stage-detail-link:hover::after {
  left: 150%;
}

.ba-stage-detail-link:focus-visible {
  outline: 3px solid var(--modal-color, var(--ba-accent));
  outline-offset: 2px;
}

.ba-stage-detail-dot {
  width: 7px;
  height: 7px;
  border-radius: 1.5px;
  transform: rotate(45deg);
  background: var(--modal-color, var(--ba-accent));
  flex-shrink: 0;
  transition: background 0.2s ease;
}

.ba-stage-detail-link:hover .ba-stage-detail-dot {
  background: var(--modal-color-text, #FFFFFF);
}

.ba-stage-detail-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ba-stage-detail-icon {
  flex-shrink: 0;
  opacity: 0.92;
  transition: transform 0.2s ease;
}

.ba-stage-detail-link:hover .ba-stage-detail-icon {
  transform: translate(2px, -2px);
}

/* 右エリア：プロフィール情報 */
.ba-modal-info {
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 26px 28px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: #FFFFFF;
}

.ba-profile-head {
  border-bottom: 1.5px solid #EDF2F7;
  padding-bottom: 14px;
}

.ba-profile-head-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.ba-profile-title-col {
  min-width: 0;
  flex: 1;
}

.ba-profile-big-num {
  flex-shrink: 0;
  font-size: clamp(28px, 3.8vw, 44px);
  font-weight: 900;
  font-style: italic;
  line-height: 0.95;
  letter-spacing: -0.02em;
  color: var(--modal-color, var(--ba-accent));
  opacity: 0.38;
  white-space: nowrap;
  user-select: none;
  padding-top: 2px;
}

.ba-profile-sub {
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: var(--modal-color, var(--ba-accent));
  margin-bottom: 4px;
}

.ba-profile-name {
  margin: 0;
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 900;
  color: var(--ba-navy);
  line-height: 1.2;
}

.ba-profile-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
}

.ba-profile-tags .ba-tag-pill {
  font-size: 12px;
  padding: 4px 11px;
  border-radius: 7px;
}

/* キャッチコピー/セリフ枠 */
.ba-quote-box {
  position: relative;
  background: #F4F8FD;
  border-left: 4px solid var(--modal-color, var(--ba-accent));
  border-radius: 0 12px 12px 0;
  padding: 13px 16px;
  font-size: 14.5px;
  font-weight: 700;
  color: var(--ba-navy);
  line-height: 1.55;
}

/* スペック一覧 */
.ba-section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: var(--ba-muted);
  margin-bottom: 8px;
}

.ba-section-label::before {
  content: "";
  width: 10px;
  height: 10px;
  background: var(--modal-color, var(--ba-accent));
  transform: skewX(-16deg);
}

.ba-specs-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.ba-spec-item {
  background: #F8FAFD;
  border: 1px solid #E5EDF6;
  border-radius: 10px;
  padding: 9px 12px;
}

.ba-spec-key {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--ba-muted);
  margin-bottom: 2px;
}

.ba-spec-val {
  font-size: 13.5px;
  font-weight: 800;
  color: var(--ba-navy);
  word-break: break-word;
}

/* 紹介文 */
.ba-bio-text {
  margin: 0;
  font-size: 14px;
  color: #334155;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

/* モーダル下部ナビゲーション（前へ / 次へ） */
.ba-modal-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 18px;
  background: #F4F7FB;
  border-top: 1px solid var(--ba-border);
}

.ba-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1.5px solid var(--ba-border);
  background: #FFFFFF;
  color: var(--ba-navy);
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  max-width: 42%;
  transition: border-color 0.15s, background 0.15s, transform 0.15s;
}

.ba-nav-btn:hover:not(:disabled) {
  border-color: var(--ba-accent);
  color: var(--ba-accent);
  transform: translateY(-1px);
}

.ba-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ba-nav-btn-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ba-nav-pos {
  font-size: 12px;
  font-weight: 800;
  color: var(--ba-muted);
  font-variant-numeric: tabular-nums;
}

/* ===== Full-Body Image Lightbox (全身拡大ビュー) ===== */
.ba-lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 9500;
  background: rgba(10, 18, 32, 0.88);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 16px;
  gap: 10px;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  overscroll-behavior: contain;
  transition: opacity 0.2s ease, visibility 0.2s ease;
}

.ba-lightbox-overlay.is-open {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.ba-lightbox-topbar {
  width: 100%;
  max-width: 960px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-shrink: 0;
  color: #FFFFFF;
}

.ba-lightbox-title {
  min-width: 0;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(255, 255, 255, 0.94);
}

.ba-lightbox-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ba-lightbox-tabs {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.ba-lightbox-tab {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.78);
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.15s ease, color 0.15s ease;
}

.ba-lightbox-tab.is-active {
  background: var(--lb-color, var(--ba-accent));
  color: var(--lb-color-text, #FFFFFF);
}

.ba-lightbox-close {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.14);
  color: #FFFFFF;
  font-size: 21px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s ease, transform 0.15s ease;
}

.ba-lightbox-close:hover {
  background: rgba(255, 255, 255, 0.26);
  transform: rotate(90deg);
}

.ba-lightbox-stage {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
}

.ba-lightbox-frame {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: min(94vw, 880px);
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 14px;
  border-radius: 16px;
  background: radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.96) 0%, rgba(236, 244, 252, 0.94) 100%);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
  transform: scale(0.95);
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.ba-lightbox-overlay.is-open .ba-lightbox-frame {
  transform: scale(1);
}

.ba-lightbox-img {
  display: block;
  max-width: 100%;
  max-height: calc(100vh - 148px);
  max-height: calc(100dvh - 148px);
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 10px;
}

.ba-lightbox-hint {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.72);
  letter-spacing: 0.04em;
  user-select: none;
}

/* モバイル・タブレット向けモーダル調整 */
@media (max-width: 780px) {
  .ba-container {
    padding: 16px 14px 48px;
  }
  .ba-header {
    padding: 20px 18px;
  }
  .ba-modal-overlay {
    padding: 10px;
  }
  .ba-modal-window {
    max-height: 92vh;
    max-height: 92dvh;
  }
  .ba-modal-body {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
  .ba-modal-stage {
    min-height: 232px;
    max-height: 360px;
    padding: 16px 16px 18px;
    border-right: none;
    border-bottom: 1px solid var(--ba-border);
  }
  .ba-modal-stage:has(.ba-stage-tabs) {
    min-height: 290px;
    padding-top: 54px;
  }
  .ba-modal-stage:has(.ba-stage-detail-link) {
    min-height: 296px;
    padding-bottom: 60px;
  }
  .ba-modal-stage:has(.ba-stage-tabs):has(.ba-stage-detail-link) {
    min-height: 336px;
  }
  .ba-modal-art {
    max-height: 248px;
    transform: scale(min(var(--art-scale, 1), 1));
  }
  .ba-modal-stage:has(.ba-stage-detail-link) .ba-modal-art {
    max-height: 216px;
  }
  .ba-modal-stage:has(.ba-stage-tabs) .ba-modal-art {
    max-height: 212px;
  }
  .ba-modal-stage:has(.ba-stage-tabs):has(.ba-stage-detail-link) .ba-modal-art {
    max-height: 196px;
  }
  .ba-modal-art.is-icon-fallback {
    width: min(200px, 65vw);
    max-height: 200px;
  }
  .ba-stage-zoom-btn {
    padding: 4px 8px;
    font-size: 10px;
  }
  .ba-stage-tab {
    max-width: 120px;
    padding: 5px 10px;
  }
  .ba-stage-detail-link {
    padding: 7px 12px 7px 10px;
    font-size: 11.5px;
    gap: 6px;
  }
  .ba-modal-info {
    overflow-y: visible;
    padding: 20px 18px;
  }
  .ba-specs-grid {
    grid-template-columns: 1fr;
  }
  .ba-lightbox-overlay {
    padding: 10px 10px 14px;
  }
  .ba-lightbox-frame {
    padding: 10px;
    border-radius: 14px;
  }
  .ba-lightbox-img {
    max-height: calc(100vh - 132px);
    max-height: calc(100dvh - 132px);
  }
}
`.trim();

  global.CASViewerStyles = {
    VIEWER_CSS: VIEWER_CSS
  };
})(window);
