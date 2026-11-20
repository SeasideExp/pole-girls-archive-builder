/**
 * editor.js
 * 左サイドバー・ビジュアルエディタUI（キャラ編集 / カテゴリ / サイト設定）
 * 名前空間: window.CASEditor
 */
(function (global) {
  "use strict";

  let hooks = {
    syncAll: function () {},
    openCharacterModal: function () {},
    setMobileSidebar: function () {}
  };

  const newAttrDraft = {
    name: "",
    color: "#00AEFF",
    categoryId: ""
  };

  function resetDrafts() {
    newAttrDraft.name = "";
    newAttrDraft.color = "#00AEFF";
    newAttrDraft.categoryId = "";
  }

  let recentDropHighlight = null; // { type: "cat" | "attr", id: string } | null
  let activeDragCleanup = null;

  const EMPTY_IMAGE2_PLACEHOLDER_SVG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160">' +
      '<rect width="120" height="160" fill="#F1F5F9"/>' +
      '<rect x="8" y="8" width="104" height="144" rx="8" fill="none" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="6 4"/>' +
      '<text x="60" y="75" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="700" fill="#94A3B8">NO</text>' +
      '<text x="60" y="92" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="700" fill="#94A3B8">IMAGE 2</text>' +
    '</svg>'
  );

  function init(callbacks) {
    hooks = Object.assign(hooks, callbacks || {});
  }

  function getTabBodyEl() {
    return document.getElementById("editor-tab-body");
  }

  function getSelectedCharacter() {
    const projectData = global.CASState.getProjectData();
    const studioState = global.CASState.studioState;
    if (!projectData.characters.length) return null;
    let ch = projectData.characters.find(function (c) { return c.id === studioState.selectedCharId; });
    if (!ch) {
      ch = projectData.characters[0];
      studioState.selectedCharId = ch.id;
    }
    return ch;
  }

  function updateTabButtons() {
    const studioState = global.CASState.studioState;
    document.querySelectorAll(".editor-tab-btn").forEach(function (btn) {
      const isActive = btn.getAttribute("data-tab") === studioState.activeTab;
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
      if (isActive) {
        btn.className = "editor-tab-btn py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 bg-white text-[#1289F6] shadow-sm border border-sky-200/80";
      } else {
        btn.className = "editor-tab-btn py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 text-slate-600 hover:bg-white/70 border border-transparent";
      }
    });
  }

  function renderEditorSidebar() {
    if (typeof activeDragCleanup === "function") {
      activeDragCleanup();
    }
    const activeTab = global.CASState.studioState.activeTab;
    if (activeTab === "characters") {
      renderCharactersTab();
    } else if (activeTab === "attributes") {
      renderAttributesTab();
    } else {
      renderSiteTab();
    }
  }

  /* --- タブ1：キャラ編集 --- */
  function renderCharactersTab() {
    const projectData = global.CASState.getProjectData();
    const escapeHtmlText = global.CASState.escapeHtmlText;
    const getFallbackAvatar = global.CASTemplates.getFallbackAvatar;
    const COLOR_PRESETS = global.CASTemplates.COLOR_PRESETS;
    const tabBodyEl = getTabBodyEl();
    if (!tabBodyEl) return;

    const isSameTab = tabBodyEl.getAttribute("data-rendered-tab") === "characters";
    const prevCharListEl = document.getElementById("char-list-scroll");
    const prevCharListScrollTop = (isSameTab && prevCharListEl) ? prevCharListEl.scrollTop : 0;
    const prevBodyScrollTop = isSameTab ? tabBodyEl.scrollTop : 0;

    const chars = projectData.characters;
    const selected = getSelectedCharacter();

    const listHtml = chars.map(function (c, idx) {
      const active = selected && c.id === selected.id;
      const fallbackAvatar = getFallbackAvatar(c.name, c.themeColor);
      return `
        <div data-char-item="${escapeHtmlText(c.id)}" class="group flex items-center gap-1.5 p-1.5 rounded-xl border transition ${active ? "bg-sky-50/90 border-[#00AEFF] shadow-sm" : "bg-white border-slate-200 hover:border-sky-300"}">
          <button type="button" data-select-char="${escapeHtmlText(c.id)}" aria-pressed="${active ? "true" : "false"}" class="flex items-center gap-2 min-w-0 flex-1 text-left rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00AEFF]">
            <img src="${escapeHtmlText(c.iconUrl || fallbackAvatar)}" data-fallback-src="${escapeHtmlText(fallbackAvatar)}" alt="" class="js-fallback-img w-9 h-9 rounded-lg object-cover border border-slate-200 flex-shrink-0 bg-slate-100" />
            <span class="block min-w-0 flex-1">
              <span class="block text-xs font-extrabold text-[#1B2B44] truncate">${escapeHtmlText(c.name || "名称未設定")}</span>
              <span class="block text-[10px] text-slate-400 truncate">${escapeHtmlText(c.subName || "NO SUBNAME")}</span>
            </span>
          </button>
          <div class="flex items-center gap-0.5 flex-shrink-0">
            <button type="button" data-move-char="${escapeHtmlText(c.id)}" data-dir="-1" ${idx === 0 ? "disabled" : ""} class="p-1 rounded hover:bg-slate-200/80 text-slate-500 disabled:opacity-25" title="上へ移動" aria-label="上へ移動">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/></svg>
            </button>
            <button type="button" data-move-char="${escapeHtmlText(c.id)}" data-dir="1" ${idx === chars.length - 1 ? "disabled" : ""} class="p-1 rounded hover:bg-slate-200/80 text-slate-500 disabled:opacity-25" title="下へ移動" aria-label="下へ移動">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join("");

    let formHtml = "";
    if (!selected) {
      formHtml = `<div class="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">キャラクターがいません。「＋ 新規キャラ」から追加してください。</div>`;
    } else {
      const categories = projectData.attributeCategories || [];
      let attrChipsHtml = "";
      if (projectData.attributes.length === 0) {
        attrChipsHtml = `<p class="text-[11px] text-slate-400">小カテゴリが未登録です。「カテゴリ」タブから追加できます。</p>`;
      } else if (categories.length > 0) {
        const fallbackCatId = categories[0].id;
        attrChipsHtml = categories.map(function (cat) {
          const catAttrs = projectData.attributes.filter(function (a) {
            return (a.categoryId || fallbackCatId) === cat.id;
          });
          if (!catAttrs.length) return "";
          const chips = catAttrs.map(function (attr) {
            const checked = selected.attributeIds.indexOf(attr.id) !== -1;
            const contrastText = global.CASState.getContrastTextColor(attr.color);
            return `
              <label data-chip-color="${escapeHtmlText(attr.color)}" class="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer select-none transition focus-within:ring-2 focus-within:ring-[#00AEFF] ${checked ? "shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}" style="${checked ? "background:" + attr.color + ";border-color:" + attr.color + ";color:" + contrastText : ""}">
                <input type="checkbox" class="sr-only js-char-attr-toggle" data-attr-id="${escapeHtmlText(attr.id)}" ${checked ? "checked" : ""} />
                <span class="js-chip-dot w-2 h-2 rounded-sm transform rotate-45" style="background:${checked ? contrastText : attr.color}"></span>
                <span>${escapeHtmlText(attr.name)}</span>
              </label>
            `;
          }).join("");
          return `
            <div>
              <div class="text-[10px] font-bold text-slate-500 mb-1">${escapeHtmlText(cat.name || "カテゴリ")}</div>
              <div class="flex flex-wrap gap-1.5">${chips}</div>
            </div>
          `;
        }).join("");
      } else {
        attrChipsHtml = `<div class="flex flex-wrap gap-1.5">` + projectData.attributes.map(function (attr) {
          const checked = selected.attributeIds.indexOf(attr.id) !== -1;
          const contrastText = global.CASState.getContrastTextColor(attr.color);
          return `
            <label data-chip-color="${escapeHtmlText(attr.color)}" class="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer select-none transition focus-within:ring-2 focus-within:ring-[#00AEFF] ${checked ? "shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}" style="${checked ? "background:" + attr.color + ";border-color:" + attr.color + ";color:" + contrastText : ""}">
              <input type="checkbox" class="sr-only js-char-attr-toggle" data-attr-id="${escapeHtmlText(attr.id)}" ${checked ? "checked" : ""} />
              <span class="js-chip-dot w-2 h-2 rounded-sm transform rotate-45" style="background:${checked ? contrastText : attr.color}"></span>
              <span>${escapeHtmlText(attr.name)}</span>
            </label>
          `;
        }).join("") + `</div>`;
      }

      const specsHtml = selected.specs.map(function (sp, idx) {
        return `
          <div class="flex items-center gap-1.5" data-spec-row="${idx}">
            <input type="text" data-spec-idx="${idx}" data-spec-key="label" value="${escapeHtmlText(sp.label)}" placeholder="項目名（例: 柱材質）" class="js-spec-input w-[38%] min-w-0 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
            <input type="text" data-spec-idx="${idx}" data-spec-key="value" value="${escapeHtmlText(sp.value)}" placeholder="内容（例: 鉄柱）" class="js-spec-input flex-1 min-w-0 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
            <button type="button" data-del-spec="${idx}" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="この項目を削除">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        `;
      }).join("");

      const swatchesHtml = COLOR_PRESETS.map(function (col) {
        const active = selected.themeColor.toUpperCase() === col.toUpperCase();
        return `<button type="button" data-color-preset="${col}" class="w-6 h-6 rounded-md border-2 transition transform hover:scale-110 ${active ? "border-[#1B2B44] scale-110" : "border-white shadow-sm"}" style="background:${col}" title="${col}"></button>`;
      }).join("");

      const colorHistory = global.CASState.getColorHistory();
      const historySwatchesHtml = colorHistory.map(function (col) {
        const active = selected.themeColor.toUpperCase() === col.toUpperCase();
        return `<button type="button" data-color-history="${col}" class="w-6 h-6 rounded-md border-2 transition transform hover:scale-110 ${active ? "border-[#1B2B44] scale-110" : "border-white shadow-sm"}" style="background:${col}" title="履歴: ${col}"></button>`;
      }).join("");

      formHtml = `
        <!-- 選択中キャラのアクションバー -->
        <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
          <span class="text-[11px] font-extrabold tracking-wider text-sky-600 uppercase">EDITING // PROFILE</span>
          <div class="flex items-center gap-1">
            <button type="button" id="btn-open-char-modal" class="px-2 py-1 rounded-md bg-sky-50 hover:bg-sky-100 text-[11px] font-bold text-[#1289F6] transition" title="このキャラの別窓プロフィールを開く">詳細を表示</button>
            <button type="button" id="btn-dup-char" class="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 transition">複製</button>
            <button type="button" id="btn-del-char" class="px-2 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-[11px] font-bold text-rose-600 transition">削除</button>
          </div>
        </div>

        <!-- 基本情報 -->
        <div class="space-y-3 bg-[#F8FAFD] p-3 rounded-xl border border-slate-200/80">
          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1">キャラクター名</label>
            <input id="inp-char-name" type="text" value="${escapeHtmlText(selected.name)}" placeholder="例: キャラA" class="w-full px-3 py-2 text-sm font-bold text-[#1B2B44] rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:ring-2 focus:ring-sky-200/60 focus:outline-none" />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1">サブテキスト</label>
            <input id="inp-char-subname" type="text" value="${escapeHtmlText(selected.subName)}" placeholder="例: CHARA-A // ALPHA" class="w-full px-3 py-1.5 text-xs font-semibold text-[#1B2B44] rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1">キャッチコピー / セリフ</label>
            <input id="inp-char-catchphrase" type="text" value="${escapeHtmlText(selected.catchphrase)}" placeholder="例: 架線柱ちゃんです！" class="w-full px-3 py-1.5 text-xs text-[#1B2B44] rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1.5">テーマカラー</label>
            <div class="flex items-center gap-2 flex-wrap">
              <input id="inp-char-color" type="color" value="${escapeHtmlText(selected.themeColor)}" class="w-9 h-8 rounded cursor-pointer border border-slate-200 bg-white p-0.5" />
              <span id="txt-char-color" class="text-xs font-mono font-bold text-slate-600 mr-1">${escapeHtmlText(selected.themeColor.toUpperCase())}</span>
            </div>
            <div class="mt-2 flex items-center gap-1.5 flex-wrap">${swatchesHtml}</div>
            <div class="mt-2.5 pt-2 border-t border-slate-200/70">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] font-bold text-slate-500">使用履歴（最近使ったカラー）</span>
                ${colorHistory.length > 0 ? '<button type="button" id="btn-clear-color-history" class="text-[10px] font-bold text-slate-400 hover:text-rose-600 transition">履歴クリア</button>' : ''}
              </div>
              <div class="flex items-center gap-1.5 flex-wrap">
                ${historySwatchesHtml || '<span class="text-[10px] text-slate-400">選択したカラーがここに記録されます</span>'}
              </div>
            </div>
          </div>
        </div>

        <!-- 画像設定（アイコン＆立ち絵） -->
        <div class="space-y-3 bg-[#F8FAFD] p-3 rounded-xl border border-slate-200/80">
          <div class="text-[11px] font-extrabold text-slate-700 tracking-wide">画像設定</div>

          <!-- アイコン画像 -->
          <div class="p-2.5 rounded-lg bg-white border border-slate-200 space-y-2">
            <div class="flex items-center gap-2.5">
              <img id="prev-char-icon" src="${escapeHtmlText(selected.iconUrl || getFallbackAvatar(selected.name, selected.themeColor))}" data-fallback-src="${escapeHtmlText(getFallbackAvatar(selected.name, selected.themeColor))}" alt="icon" class="js-fallback-img w-12 h-12 rounded-lg object-cover border border-slate-200 bg-slate-100 flex-shrink-0" />
              <div class="min-w-0 flex-1">
                <div class="text-xs font-bold text-[#1B2B44]">アイコン画像（一覧カード用）</div>
                <div class="mt-1.5 flex flex-wrap gap-1.5">
                  <button type="button" data-reset-svg="iconUrl" class="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition">仮置きに戻す</button>
                  <button type="button" data-clear-img="iconUrl" class="px-2 py-1 rounded-md bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 text-[11px] font-bold transition">クリア</button>
                  <button type="button" data-upload-img="iconUrl" class="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition">画像アップロード</button>
                </div>
              </div>
            </div>
            <input id="inp-char-icon-url" type="text" value="${selected.iconUrl.startsWith("data:") ? "" : escapeHtmlText(selected.iconUrl)}" placeholder="${selected.iconUrl.startsWith("data:") ? "埋込画像を設定中（パス・URL指定で上書き可能）" : "画像パス・URLを入力（推奨: img/char_a_icon.webp 等）"}" class="w-full px-2.5 py-1.5 text-[11px] rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00AEFF] focus:outline-none" />
          </div>

          <!-- プロフィール画像 1 -->
          <div class="p-2.5 rounded-lg bg-white border border-slate-200 space-y-2">
            <div class="flex items-center gap-2.5">
              <img id="prev-char-standing" src="${escapeHtmlText(selected.standingUrl || selected.standingUrl2 || selected.iconUrl || getFallbackAvatar(selected.name, selected.themeColor))}" data-fallback-src="${escapeHtmlText(getFallbackAvatar(selected.name, selected.themeColor))}" alt="standing" class="js-fallback-img w-12 h-16 rounded-lg object-cover border border-slate-200 bg-slate-100 flex-shrink-0" />
              <div class="min-w-0 flex-1">
                <div class="text-xs font-bold text-[#1B2B44]">プロフィール画像 1（別窓表示用）</div>
                <div class="text-[10px] text-slate-400">未設定時は画像2、またはアイコン画像を表示</div>
                <div class="mt-1.5 flex flex-wrap gap-1.5">
                  <button type="button" data-reset-svg="standingUrl" class="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition">仮置きに戻す</button>
                  <button type="button" data-clear-img="standingUrl" class="px-2 py-1 rounded-md bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 text-[11px] font-bold transition">クリア</button>
                  <button type="button" data-upload-img="standingUrl" class="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition">画像アップロード</button>
                </div>
              </div>
            </div>
            <input id="inp-char-standing-url" type="text" value="${selected.standingUrl.startsWith("data:") ? "" : escapeHtmlText(selected.standingUrl)}" placeholder="${selected.standingUrl.startsWith("data:") ? "埋込画像を設定中（パス・URL指定で上書き可能）" : "画像パス・URLを入力（推奨: img/char_a_standing.webp 等）"}" class="w-full px-2.5 py-1.5 text-[11px] rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00AEFF] focus:outline-none" />
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold text-slate-500 flex-shrink-0">タブ名1:</span>
              <input id="inp-char-standing-tab1" type="text" value="${escapeHtmlText(selected.standingTab1Label || "")}" placeholder="未入力時はサイト設定 (${escapeHtmlText((projectData.site.imageTab1Label && projectData.site.imageTab1Label.trim()) ? projectData.site.imageTab1Label : "画像1")})" class="flex-1 min-w-0 px-2 py-1 text-[11px] font-bold rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00AEFF] focus:outline-none" />
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold text-slate-500 flex-shrink-0">表示サイズ:</span>
              <input id="inp-char-standing-scale1" type="range" min="50" max="250" step="5" value="${escapeHtmlText(selected.standingScale1 != null ? selected.standingScale1 : 100)}" class="flex-1 min-w-0 accent-[#00AEFF] cursor-pointer" />
              <span id="txt-char-standing-scale1" class="text-[11px] font-mono font-bold text-[#1B2B44] w-10 text-right flex-shrink-0">${escapeHtmlText(selected.standingScale1 != null ? selected.standingScale1 : 100)}%</span>
              <button type="button" id="btn-reset-scale1" class="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition flex-shrink-0" title="100%に戻す">100%</button>
            </div>
          </div>

          <!-- プロフィール画像 2 -->
          <div class="p-2.5 rounded-lg bg-white border border-slate-200 space-y-2">
            <div class="flex items-center gap-2.5">
              <img id="prev-char-standing2" src="${escapeHtmlText(selected.standingUrl2 || EMPTY_IMAGE2_PLACEHOLDER_SVG)}" data-fallback-src="${escapeHtmlText(selected.standingUrl2 ? getFallbackAvatar(selected.name, selected.themeColor) : EMPTY_IMAGE2_PLACEHOLDER_SVG)}" alt="standing 2" class="js-fallback-img w-12 h-16 rounded-lg object-cover border border-slate-200 bg-slate-100 flex-shrink-0 ${selected.standingUrl2 ? "" : "opacity-80"}" />
              <div class="min-w-0 flex-1">
                <div class="text-xs font-bold text-[#1B2B44]">プロフィール画像 2（タブ切替用・任意）</div>
                <div class="text-[10px] text-slate-400">画像1と両方設定すると別窓内に切替タブが表示されます</div>
                <div class="mt-1.5 flex flex-wrap gap-1.5">
                  <button type="button" data-reset-svg="standingUrl2" class="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition">仮置きに戻す</button>
                  <button type="button" data-clear-img="standingUrl2" class="px-2 py-1 rounded-md bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 text-[11px] font-bold transition">クリア</button>
                  <button type="button" data-upload-img="standingUrl2" class="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition">画像アップロード</button>
                </div>
              </div>
            </div>
            <input id="inp-char-standing2-url" type="text" value="${(selected.standingUrl2 || "").startsWith("data:") ? "" : escapeHtmlText(selected.standingUrl2 || "")}" placeholder="${(selected.standingUrl2 || "").startsWith("data:") ? "埋込画像を設定中（パス・URL指定で上書き可能）" : "画像パス・URLを入力（推奨: img/char_a_standing2.webp 等）"}" class="w-full px-2.5 py-1.5 text-[11px] rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00AEFF] focus:outline-none" />
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold text-slate-500 flex-shrink-0">タブ名2:</span>
              <input id="inp-char-standing-tab2" type="text" value="${escapeHtmlText(selected.standingTab2Label || "")}" placeholder="未入力時はサイト設定 (${escapeHtmlText((projectData.site.imageTab2Label && projectData.site.imageTab2Label.trim()) ? projectData.site.imageTab2Label : "画像2")})" class="flex-1 min-w-0 px-2 py-1 text-[11px] font-bold rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00AEFF] focus:outline-none" />
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold text-slate-500 flex-shrink-0">表示サイズ:</span>
              <input id="inp-char-standing-scale2" type="range" min="50" max="250" step="5" value="${escapeHtmlText(selected.standingScale2 != null ? selected.standingScale2 : 100)}" class="flex-1 min-w-0 accent-[#00AEFF] cursor-pointer" />
              <span id="txt-char-standing-scale2" class="text-[11px] font-mono font-bold text-[#1B2B44] w-10 text-right flex-shrink-0">${escapeHtmlText(selected.standingScale2 != null ? selected.standingScale2 : 100)}%</span>
              <button type="button" id="btn-reset-scale2" class="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition flex-shrink-0" title="100%に戻す">100%</button>
            </div>
          </div>
        </div>

        <!-- 小カテゴリチェック -->
        <div class="bg-[#F8FAFD] p-3 rounded-xl border border-slate-200/80">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-extrabold text-slate-700">小カテゴリ（複数選択可）</span>
            <button type="button" id="btn-goto-attrs" class="text-[10px] font-bold text-[#1289F6] hover:underline">+ カテゴリを管理</button>
          </div>
          <div class="space-y-2.5">${attrChipsHtml}</div>
        </div>

        <!-- プロフィールスペック項目 -->
        <div class="bg-[#F8FAFD] p-3 rounded-xl border border-slate-200/80 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-extrabold text-slate-700">スペック項目（自由に追加・編集）</span>
            <button type="button" id="btn-add-spec" class="px-2 py-1 rounded-md bg-sky-100 hover:bg-sky-200 text-[#1289F6] text-[11px] font-bold transition">＋ 項目追加</button>
          </div>
          <div id="spec-rows-wrap" class="space-y-1.5">
            ${specsHtml || '<p class="text-[11px] text-slate-400 py-1">スペック項目はありません。</p>'}
          </div>
        </div>

        <!-- 紹介文 -->
        <div class="bg-[#F8FAFD] p-3 rounded-xl border border-slate-200/80">
          <label class="block text-[11px] font-extrabold text-slate-700 mb-1.5">紹介テキスト（改行対応）</label>
          <textarea id="inp-char-bio" rows="5" placeholder="キャラクターの詳細なプロフィールや設定を入力..." class="w-full px-3 py-2 text-xs leading-relaxed text-[#1B2B44] rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none resize-y">${escapeHtmlText(selected.bio)}</textarea>
        </div>

        <!-- 詳細解説ページリンク（空欄でOFF・入力でON） -->
        <div class="bg-[#F8FAFD] p-3 rounded-xl border border-slate-200/80 space-y-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[11px] font-extrabold text-slate-700">詳細解説リンク（別窓・任意）</span>
            <span id="badge-char-detail-link" class="text-[10px] font-extrabold px-2 py-0.5 rounded-full ${String(selected.detailUrl || "").trim() ? "bg-sky-100 text-[#1289F6]" : "bg-slate-200/80 text-slate-500"}">${String(selected.detailUrl || "").trim() ? "ON（表示中）" : "OFF（非表示）"}</span>
          </div>
          <div>
            <label for="inp-char-detail-url" class="block text-[10px] font-bold text-slate-500 mb-1">リンク先URL・相対パス（入力すると表示されます）</label>
            <input id="inp-char-detail-url" type="text" value="${escapeHtmlText(selected.detailUrl || "")}" placeholder="例: detail/char_a.html または https://..." class="w-full px-2.5 py-1.5 text-xs text-[#1B2B44] rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
          </div>
          <div>
            <label for="inp-char-detail-label" class="block text-[10px] font-bold text-slate-500 mb-1">ボタン文言（任意・空欄時はサイト設定を継承）</label>
            <input id="inp-char-detail-label" type="text" value="${escapeHtmlText(selected.detailLabel || "")}" placeholder="未入力時はサイト設定 (${escapeHtmlText((projectData.site.detailLinkLabel && projectData.site.detailLinkLabel.trim()) ? projectData.site.detailLinkLabel : "詳しい解説ページを見る")})" class="w-full px-2.5 py-1.5 text-xs font-bold text-[#1B2B44] rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
          </div>
        </div>
      `;
    }

    tabBodyEl.innerHTML = `
      <!-- キャラクター一覧リスト -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-extrabold text-[#1B2B44]">キャラクター一覧 (${chars.length}名)</span>
          <button type="button" id="btn-add-char" class="px-2.5 py-1.5 rounded-lg bg-[#142238] hover:bg-[#1e3250] text-white text-[11px] font-bold shadow-sm transition flex items-center gap-1">
            <span>＋ 新規キャラ</span>
          </button>
        </div>
        <div id="char-list-scroll" class="space-y-1.5 max-h-48 overflow-y-auto studio-scroll pr-0.5">${listHtml}</div>
      </div>
      ${formHtml}
    `;

    tabBodyEl.setAttribute("data-rendered-tab", "characters");
    const nextCharListEl = document.getElementById("char-list-scroll");
    if (nextCharListEl && isSameTab) {
      nextCharListEl.scrollTop = prevCharListScrollTop;
    }
    tabBodyEl.scrollTop = isSameTab ? prevBodyScrollTop : 0;

    bindCharactersTabEvents();
  }

  function bindCharactersTabEvents() {
    const projectData = global.CASState.getProjectData();
    const studioState = global.CASState.studioState;
    const generateId = global.CASState.generateId;
    const showToast = global.CASState.showToast;
    const showConfirmDialog = global.CASState.showConfirmDialog;
    const getFallbackAvatar = global.CASTemplates.getFallbackAvatar;
    const tabBodyEl = getTabBodyEl();
    const selected = getSelectedCharacter();

    tabBodyEl.querySelectorAll(".js-fallback-img").forEach(function (img) {
      img.addEventListener("error", function () {
        const fb = img.getAttribute("data-fallback-src");
        if (fb && img.getAttribute("src") !== fb) {
          img.src = fb;
        }
      });
    });

    // キャラ追加
    const btnAddChar = document.getElementById("btn-add-char");
    if (btnAddChar) {
      btnAddChar.addEventListener("click", function () {
        const existingCharNames = new Set(projectData.characters.map(function (c) { return c.name; }));
        let suffix = "";
        let foundIndex = -1;
        for (let i = 0; i < 26; i++) {
          const letter = String.fromCharCode(65 + i);
          if (!existingCharNames.has("キャラ" + letter)) {
            suffix = letter;
            foundIndex = i;
            break;
          }
        }
        if (!suffix) {
          let num = projectData.characters.length + 1;
          while (existingCharNames.has("キャラ" + num)) num++;
          suffix = String(num);
          foundIndex = num - 1;
        }
        const palette = ["#00AEFF", "#FF5E8E", "#7C3AED", "#10B981", "#F59E0B", "#3B82F6"];
        const color = palette[foundIndex % palette.length];
        const newChar = {
          id: generateId("char"),
          name: "キャラ" + suffix,
          subName: "CHARA-" + suffix + " // NEW",
          catchphrase: "",
          themeColor: color,
          iconUrl: "img/char_a_icon.webp",
          standingUrl: "img/char_a_standing.webp",
          standingUrl2: "",
          standingTab1Label: "",
          standingTab2Label: "",
          standingScale1: 100,
          standingScale2: 100,
          detailUrl: "",
          detailLabel: "",
          attributeIds: [],
          specs: [
            { label: "柱材質", value: "" },
            { label: "ビーム形状", value: "" },
            { label: "設置時期", value: "" },
            { label: "所在地", value: "" }
          ],
          bio: ""
        };
        projectData.characters.push(newChar);
        studioState.selectedCharId = newChar.id;
        hooks.syncAll(false);
        const addedCard = tabBodyEl.querySelector('[data-select-char="' + CSS.escape(newChar.id) + '"]');
        if (addedCard && typeof addedCard.scrollIntoView === "function") {
          addedCard.scrollIntoView({ block: "nearest" });
        }
        showToast(newChar.name + " を追加しました。", "success");
      });
    }

    // キャラ選択（マウス＆キーボード対応・フォーカス復帰）
    function selectCharById(charId, restoreFocus) {
      studioState.selectedCharId = charId;
      renderCharactersTab();
      if (restoreFocus && charId) {
        const card = tabBodyEl.querySelector('[data-select-char="' + CSS.escape(charId) + '"]');
        if (card && typeof card.focus === "function") {
          try { card.focus({ preventScroll: true }); } catch (err) {}
        }
      }
    }

    tabBodyEl.querySelectorAll("[data-select-char]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        selectCharById(el.getAttribute("data-select-char"), e.detail === 0);
      });
    });

    // キャラ上下並び替え（再描画後に移動ボタンへフォーカス復帰）
    tabBodyEl.querySelectorAll("[data-move-char]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const id = btn.getAttribute("data-move-char");
        const dir = parseInt(btn.getAttribute("data-dir"), 10);
        const idx = projectData.characters.findIndex(function (c) { return c.id === id; });
        const target = idx + dir;
        if (idx === -1 || target < 0 || target >= projectData.characters.length) return;
        const temp = projectData.characters[idx];
        projectData.characters[idx] = projectData.characters[target];
        projectData.characters[target] = temp;
        hooks.syncAll(false);
        const escId = CSS.escape(id);
        const nextFocus = tabBodyEl.querySelector('[data-move-char="' + escId + '"][data-dir="' + dir + '"]:not([disabled])') ||
          tabBodyEl.querySelector('[data-move-char="' + escId + '"][data-dir="' + (-dir) + '"]:not([disabled])') ||
          tabBodyEl.querySelector('[data-select-char="' + escId + '"]');
        if (nextFocus && typeof nextFocus.focus === "function") {
          try { nextFocus.focus({ preventScroll: true }); } catch (err) {}
        }
      });
    });

    if (!selected) return;

    // 詳細モーダルを開く
    const btnOpenModal = document.getElementById("btn-open-char-modal");
    if (btnOpenModal) {
      btnOpenModal.addEventListener("click", function () {
        hooks.openCharacterModal(selected.id);
        if (window.innerWidth < 1024) hooks.setMobileSidebar(false);
      });
    }

    // 複製
    const btnDup = document.getElementById("btn-dup-char");
    if (btnDup) {
      btnDup.addEventListener("click", function () {
        const copy = JSON.parse(JSON.stringify(selected));
        copy.id = generateId("char");
        copy.name = (selected.name || "キャラ") + " (コピー)";
        const idx = projectData.characters.findIndex(function (c) { return c.id === selected.id; });
        projectData.characters.splice(idx + 1, 0, copy);
        studioState.selectedCharId = copy.id;
        hooks.syncAll(false);
        showToast("キャラクターを複製しました。", "success");
      });
    }

    // 削除
    const btnDel = document.getElementById("btn-del-char");
    if (btnDel) {
      btnDel.addEventListener("click", async function () {
        const ok = await showConfirmDialog(
          "キャラクターを削除",
          "「" + (selected.name || "名称未設定") + "」を削除しますか？\nこの操作は元に戻せません。",
          "削除する",
          true
        );
        if (!ok) return;
        const delIdx = projectData.characters.findIndex(function (c) { return c.id === selected.id; });
        projectData.characters = projectData.characters.filter(function (c) { return c.id !== selected.id; });
        const nextChar = projectData.characters[delIdx] || projectData.characters[delIdx - 1] || null;
        studioState.selectedCharId = nextChar ? nextChar.id : null;
        hooks.syncAll(false);
        showToast("キャラクターを削除しました。", "info");
      });
    }

    // テキストフィールドのリアルタイム反映（フォーカス維持のためサイドバー再描画なし）
    function updateCharListItemLabel() {
      const item = tabBodyEl.querySelector('[data-select-char="' + CSS.escape(selected.id) + '"]');
      if (item) {
        const texts = item.querySelectorAll(".truncate");
        if (texts[0]) texts[0].textContent = selected.name || "名称未設定";
        if (texts[1]) texts[1].textContent = selected.subName || "NO SUBNAME";
      }
    }

    document.getElementById("inp-char-name").addEventListener("input", function (e) {
      selected.name = e.target.value;
      updateCharListItemLabel();
      refreshImagePreviews(false);
      hooks.syncAll(true);
    });

    document.getElementById("inp-char-subname").addEventListener("input", function (e) {
      selected.subName = e.target.value;
      updateCharListItemLabel();
      hooks.syncAll(true);
    });

    document.getElementById("inp-char-catchphrase").addEventListener("input", function (e) {
      selected.catchphrase = e.target.value;
      hooks.syncAll(true, { scope: "listAndModal" });
    });

    document.getElementById("inp-char-bio").addEventListener("input", function (e) {
      selected.bio = e.target.value;
      hooks.syncAll(true, { scope: "modalOnly" });
    });

    const detailUrlInp = document.getElementById("inp-char-detail-url");
    const detailBadgeEl = document.getElementById("badge-char-detail-link");
    function updateDetailLinkBadge(rawUrl) {
      if (!detailBadgeEl) return;
      const cleaned = String(rawUrl || "").replace(/[\u0000-\u001F\u007F]/g, "").trim();
      if (!cleaned) {
        detailBadgeEl.setAttribute("data-link-state", "off");
        detailBadgeEl.textContent = "OFF（非表示）";
        detailBadgeEl.className = "text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-500";
        return;
      }
      if (!global.CASState.sanitizeLinkUrl(cleaned)) {
        detailBadgeEl.setAttribute("data-link-state", "invalid");
        detailBadgeEl.textContent = "無効なURL（非表示）";
        detailBadgeEl.className = "text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600";
        return;
      }
      detailBadgeEl.setAttribute("data-link-state", "on");
      detailBadgeEl.textContent = "ON（表示中）";
      detailBadgeEl.className = "text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-100 text-[#1289F6]";
    }
    if (detailUrlInp) {
      updateDetailLinkBadge(selected.detailUrl);
      detailUrlInp.addEventListener("input", function (e) {
        selected.detailUrl = e.target.value.trim();
        updateDetailLinkBadge(selected.detailUrl);
        hooks.syncAll(true, { scope: "modalOnly" });
      });
    }
    const detailLabelInp = document.getElementById("inp-char-detail-label");
    if (detailLabelInp) {
      detailLabelInp.addEventListener("input", function (e) {
        selected.detailLabel = e.target.value;
        hooks.syncAll(true, { scope: "modalOnly" });
      });
    }

    // テーマカラー
    const colorInput = document.getElementById("inp-char-color");
    const colorTxt = document.getElementById("txt-char-color");
    colorInput.addEventListener("input", function (e) {
      const upper = e.target.value.toUpperCase();
      selected.themeColor = upper;
      colorTxt.textContent = upper;
      refreshImagePreviews(false);
      hooks.syncAll(true);
    });
    colorInput.addEventListener("change", function (e) {
      const upper = e.target.value.toUpperCase();
      selected.themeColor = upper;
      global.CASState.recordThemeColor(upper);
      hooks.syncAll(false);
    });

    tabBodyEl.querySelectorAll("[data-color-preset]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const col = btn.getAttribute("data-color-preset").toUpperCase();
        selected.themeColor = col;
        global.CASState.recordThemeColor(col);
        hooks.syncAll(false);
      });
    });

    tabBodyEl.querySelectorAll("[data-color-history]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const col = btn.getAttribute("data-color-history").toUpperCase();
        selected.themeColor = col;
        global.CASState.recordThemeColor(col);
        hooks.syncAll(false);
      });
    });

    const btnClearColorHistory = document.getElementById("btn-clear-color-history");
    if (btnClearColorHistory) {
      btnClearColorHistory.addEventListener("click", function () {
        global.CASState.clearColorHistory();
        renderCharactersTab();
      });
    }

    // 画像アップロードトリガー
    tabBodyEl.querySelectorAll("[data-upload-img]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        studioState.pendingImageTarget = {
          charId: selected.id,
          field: btn.getAttribute("data-upload-img")
        };
        const fileInput = document.getElementById("input-image-upload");
        fileInput.value = "";
        fileInput.click();
      });
    });

    // 仮置き画像に戻す
    tabBodyEl.querySelectorAll("[data-reset-svg]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const field = btn.getAttribute("data-reset-svg");
        if (field === "standingUrl2") {
          selected[field] = "img/char_a_standing2.webp";
        } else if (field === "standingUrl") {
          selected[field] = "img/char_a_standing.webp";
        } else {
          selected[field] = "img/char_a_icon.webp";
        }
        hooks.syncAll(false);
        showToast("仮置き画像に戻しました。", "info");
      });
    });

    // 画像クリア
    tabBodyEl.querySelectorAll("[data-clear-img]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const field = btn.getAttribute("data-clear-img");
        selected[field] = "";
        hooks.syncAll(false);
        const msg = field === "standingUrl2"
          ? "プロフィール画像2をクリアしました。"
          : (field === "iconUrl"
              ? "アイコン画像をクリアしました。"
              : (selected.standingUrl2
                  ? "プロフィール画像1を未設定（画像2を表示）にしました。"
                  : "プロフィール画像1を未設定（アイコン表示）にしました。"));
        showToast(msg, "info");
      });
    });

    function refreshImagePreviews(forceReload) {
      const fallbackAvatar = getFallbackAvatar(selected.name, selected.themeColor);
      function syncImg(imgEl, desiredSrc, nextFallback) {
        if (!imgEl) return;
        const prevFallback = imgEl.getAttribute("data-fallback-src");
        imgEl.setAttribute("data-fallback-src", nextFallback);
        if (forceReload) {
          imgEl.src = desiredSrc || nextFallback;
          return;
        }
        const curAttrSrc = imgEl.getAttribute("src") || "";
        if (!desiredSrc || (prevFallback && curAttrSrc === prevFallback)) {
          imgEl.src = nextFallback;
        }
      }

      const prevIcon = document.getElementById("prev-char-icon");
      syncImg(prevIcon, selected.iconUrl, fallbackAvatar);

      const prevStanding = document.getElementById("prev-char-standing");
      syncImg(prevStanding, selected.standingUrl || selected.standingUrl2 || selected.iconUrl, fallbackAvatar);

      const prevStanding2 = document.getElementById("prev-char-standing2");
      if (prevStanding2) {
        syncImg(prevStanding2, selected.standingUrl2, selected.standingUrl2 ? fallbackAvatar : EMPTY_IMAGE2_PLACEHOLDER_SVG);
        prevStanding2.classList.toggle("opacity-80", !selected.standingUrl2);
      }

      const listCards = tabBodyEl.querySelectorAll("[data-select-char]");
      listCards.forEach(function (cardEl) {
        if (cardEl.getAttribute("data-select-char") === selected.id) {
          syncImg(cardEl.querySelector("img"), selected.iconUrl, fallbackAvatar);
        }
      });
    }

    // 画像URL直接入力（change時は全体再描画を避けて部分更新し、直後の他ボタンクリック吸い込みを防止）
    function bindImageUrlInput(inputId, field, urlPlaceholder) {
      const inp = document.getElementById(inputId);
      if (!inp) return;
      inp.addEventListener("change", function (e) {
        const val = e.target.value.trim();
        const isEmbedded = String(selected[field] || "").startsWith("data:");
        if (val) {
          selected[field] = val;
          e.target.value = val;
          inp.placeholder = urlPlaceholder;
          refreshImagePreviews(true);
          hooks.syncAll(true);
        } else if (!isEmbedded) {
          selected[field] = "";
          e.target.value = "";
          inp.placeholder = urlPlaceholder;
          refreshImagePreviews(true);
          hooks.syncAll(true);
        } else {
          e.target.value = "";
        }
      });
    }
    bindImageUrlInput("inp-char-icon-url", "iconUrl", "画像パス・URLを入力（推奨: img/char_a_icon.webp 等）");
    bindImageUrlInput("inp-char-standing-url", "standingUrl", "画像パス・URLを入力（推奨: img/char_a_standing.webp 等）");
    bindImageUrlInput("inp-char-standing2-url", "standingUrl2", "画像パス・URLを入力（推奨: img/char_a_standing2.webp 等）");

    document.getElementById("inp-char-standing-tab1").addEventListener("input", function (e) {
      selected.standingTab1Label = e.target.value;
      hooks.syncAll(true, { scope: "modalOnly" });
    });

    document.getElementById("inp-char-standing-tab2").addEventListener("input", function (e) {
      selected.standingTab2Label = e.target.value;
      hooks.syncAll(true, { scope: "modalOnly" });
    });

    function bindStandingScaleControl(rangeId, textId, resetBtnId, fieldKey) {
      const rangeEl = document.getElementById(rangeId);
      const textEl = document.getElementById(textId);
      const resetEl = document.getElementById(resetBtnId);
      if (!rangeEl) return;
      rangeEl.addEventListener("input", function (e) {
        const val = Math.min(250, Math.max(50, parseInt(e.target.value, 10) || 100));
        selected[fieldKey] = val;
        if (textEl) textEl.textContent = val + "%";
        hooks.syncAll(true, { scope: "modalScale" });
      });
      if (resetEl) {
        resetEl.addEventListener("click", function () {
          selected[fieldKey] = 100;
          rangeEl.value = "100";
          if (textEl) textEl.textContent = "100%";
          hooks.syncAll(true, { scope: "modalScale" });
        });
      }
    }
    bindStandingScaleControl("inp-char-standing-scale1", "txt-char-standing-scale1", "btn-reset-scale1", "standingScale1");
    bindStandingScaleControl("inp-char-standing-scale2", "txt-char-standing-scale2", "btn-reset-scale2", "standingScale2");

    // 属性ON/OFF（フォーカス保持のためサイドバー全体再構築せず対象チップのみ更新）
    tabBodyEl.querySelectorAll(".js-char-attr-toggle").forEach(function (cb) {
      cb.addEventListener("change", function () {
        const aid = cb.getAttribute("data-attr-id");
        if (cb.checked) {
          if (selected.attributeIds.indexOf(aid) === -1) selected.attributeIds.push(aid);
        } else {
          selected.attributeIds = selected.attributeIds.filter(function (id) { return id !== aid; });
        }
        const labelEl = cb.closest("label");
        if (labelEl) {
          const col = labelEl.getAttribute("data-chip-color") || "#00AEFF";
          const contrastText = global.CASState.getContrastTextColor(col);
          const dotEl = labelEl.querySelector(".js-chip-dot");
          if (cb.checked) {
            labelEl.className = "relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer select-none transition focus-within:ring-2 focus-within:ring-[#00AEFF] shadow-sm";
            labelEl.style.background = col;
            labelEl.style.borderColor = col;
            labelEl.style.color = contrastText;
            if (dotEl) dotEl.style.background = contrastText;
          } else {
            labelEl.className = "relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer select-none transition focus-within:ring-2 focus-within:ring-[#00AEFF] bg-white text-slate-600 border-slate-200 hover:border-slate-300";
            labelEl.style.background = "";
            labelEl.style.borderColor = "";
            labelEl.style.color = "";
            if (dotEl) dotEl.style.background = col;
          }
        }
        hooks.syncAll(true);
      });
    });

    const btnGotoAttrs = document.getElementById("btn-goto-attrs");
    if (btnGotoAttrs) {
      btnGotoAttrs.addEventListener("click", function () {
        studioState.activeTab = "attributes";
        updateTabButtons();
        renderEditorSidebar();
      });
    }

    // スペック項目編集・追加・削除
    document.getElementById("btn-add-spec").addEventListener("click", function () {
      selected.specs.push({ label: "", value: "" });
      hooks.syncAll(false);
      const inputs = tabBodyEl.querySelectorAll('[data-spec-key="label"]');
      if (inputs.length) inputs[inputs.length - 1].focus();
    });

    tabBodyEl.querySelectorAll(".js-spec-input").forEach(function (inp) {
      inp.addEventListener("input", function () {
        const idx = parseInt(inp.getAttribute("data-spec-idx"), 10);
        const key = inp.getAttribute("data-spec-key");
        if (selected.specs[idx]) {
          selected.specs[idx][key] = inp.value;
          hooks.syncAll(true, { scope: "modalOnly" });
        }
      });
    });

    tabBodyEl.querySelectorAll("[data-del-spec]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const idx = parseInt(btn.getAttribute("data-del-spec"), 10);
        selected.specs.splice(idx, 1);
        hooks.syncAll(false);
      });
    });
  }

  /* --- タブ2：カテゴリ --- */
  function renderAttributesTab() {
    const projectData = global.CASState.getProjectData();
    const escapeHtmlText = global.CASState.escapeHtmlText;
    const generateId = global.CASState.generateId;
    const showToast = global.CASState.showToast;
    const showConfirmDialog = global.CASState.showConfirmDialog;
    const tabBodyEl = getTabBodyEl();
    if (!tabBodyEl) return;

    const isSameTab = tabBodyEl.getAttribute("data-rendered-tab") === "attributes";
    const prevBodyScrollTop = isSameTab ? tabBodyEl.scrollTop : 0;

    const categories = projectData.attributeCategories || [];
    const fallbackCatId = categories[0] ? categories[0].id : "cat_a";
    const draftCatExists = categories.some(function (c) { return c.id === newAttrDraft.categoryId; });
    const draftCatId = draftCatExists ? newAttrDraft.categoryId : fallbackCatId;
    const draftColor = /^#[0-9A-Fa-f]{6}$/.test(newAttrDraft.color) ? newAttrDraft.color : "#00AEFF";
    const attrs = projectData.attributes;

    const dragGripSvg = '<svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="5.5" cy="3.5" r="1.2"/><circle cx="10.5" cy="3.5" r="1.2"/><circle cx="5.5" cy="8" r="1.2"/><circle cx="10.5" cy="8" r="1.2"/><circle cx="5.5" cy="12.5" r="1.2"/><circle cx="10.5" cy="12.5" r="1.2"/></svg>';

    const catInputsHtml = categories.map(function (cat, idx) {
      const label = idx < 26 ? ("大カテゴリ" + String.fromCharCode(65 + idx)) : ("大カテゴリ" + (idx + 1));
      const isHighlighted = recentDropHighlight && recentDropHighlight.type === "cat" && recentDropHighlight.id === cat.id;
      return `
        <div data-cat-row="${escapeHtmlText(cat.id)}" class="flex items-center gap-1 rounded-lg transition ${isHighlighted ? "cas-just-dropped" : ""}">
          <button type="button" data-drag-cat="${escapeHtmlText(cat.id)}" ${categories.length <= 1 ? "disabled" : ""} class="cas-drag-handle p-1 rounded text-slate-400 hover:text-[#1289F6] hover:bg-sky-50 disabled:opacity-25 disabled:pointer-events-none transition" title="ドラッグして大カテゴリの順番を変更" aria-label="ドラッグして大カテゴリの順番を変更">${dragGripSvg}</button>
          <span class="text-[11px] font-extrabold text-slate-500 w-[62px] whitespace-nowrap flex-shrink-0">${escapeHtmlText(label)}</span>
          <input type="text" data-cat-name="${escapeHtmlText(cat.id)}" data-prev-name="${escapeHtmlText(cat.name)}" value="${escapeHtmlText(cat.name)}" placeholder="${escapeHtmlText(label)}" class="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-bold text-[#1B2B44] rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
          <div class="flex items-center gap-0.5 flex-shrink-0">
            <button type="button" data-move-cat="${escapeHtmlText(cat.id)}" data-dir="-1" ${idx === 0 ? "disabled" : ""} class="p-1 rounded hover:bg-slate-200/70 text-slate-500 disabled:opacity-25" title="上へ">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/></svg>
            </button>
            <button type="button" data-move-cat="${escapeHtmlText(cat.id)}" data-dir="1" ${idx === categories.length - 1 ? "disabled" : ""} class="p-1 rounded hover:bg-slate-200/70 text-slate-500 disabled:opacity-25" title="下へ">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </button>
            <button type="button" data-del-cat="${escapeHtmlText(cat.id)}" ${categories.length <= 1 ? "disabled" : ""} class="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-25 transition" title="このカテゴリを削除">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join("");

    const newAttrCatOptionsHtml = categories.map(function (cat) {
      return `<option value="${escapeHtmlText(cat.id)}" ${cat.id === draftCatId ? "selected" : ""}>${escapeHtmlText(cat.name || "大カテゴリ")}</option>`;
    }).join("");

    const groupedListHtml = categories.map(function (cat) {
      const catAttrs = attrs.filter(function (a) {
        return (a.categoryId || fallbackCatId) === cat.id;
      });
      const rowsHtml = catAttrs.map(function (attr, idx) {
        const usedCount = projectData.characters.filter(function (c) {
          return c.attributeIds.indexOf(attr.id) !== -1;
        }).length;
        const rowCatOpts = categories.map(function (optCat) {
          return `<option value="${escapeHtmlText(optCat.id)}" ${optCat.id === (attr.categoryId || fallbackCatId) ? "selected" : ""}>${escapeHtmlText(optCat.name || "大カテゴリ")}</option>`;
        }).join("");
        const isHighlighted = recentDropHighlight && recentDropHighlight.type === "attr" && recentDropHighlight.id === attr.id;

        return `
          <div data-attr-row="${escapeHtmlText(attr.id)}" data-attr-cat-id="${escapeHtmlText(cat.id)}" class="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-slate-200 shadow-sm ${isHighlighted ? "cas-just-dropped" : ""}">
            <button type="button" data-drag-attr="${escapeHtmlText(attr.id)}" class="cas-drag-handle p-1 rounded text-slate-400 hover:text-[#1289F6] hover:bg-sky-50 transition" title="ドラッグして並び替え・別カテゴリへ移動" aria-label="ドラッグして並び替え・別カテゴリへ移動">${dragGripSvg}</button>
            <input type="color" data-attr-color="${escapeHtmlText(attr.id)}" value="${escapeHtmlText(attr.color)}" class="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5 flex-shrink-0" title="小カテゴリカラーを変更" />
            <div class="min-w-0 flex-1 space-y-1">
              <input type="text" data-attr-name="${escapeHtmlText(attr.id)}" data-prev-name="${escapeHtmlText(attr.name)}" value="${escapeHtmlText(attr.name)}" class="w-full px-2 py-1 text-xs font-bold text-[#1B2B44] rounded-md border border-transparent hover:border-slate-200 focus:border-[#00AEFF] focus:bg-slate-50 focus:outline-none" />
              <div class="flex items-center gap-2 px-2">
                <select data-attr-cat="${escapeHtmlText(attr.id)}" class="js-cat-label-sync w-auto max-w-[140px] min-w-0 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 rounded border border-slate-200 bg-slate-50 focus:border-[#00AEFF] focus:outline-none" title="所属大カテゴリ">
                  ${rowCatOpts}
                </select>
                <span class="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">設定中: ${usedCount}名</span>
              </div>
            </div>
            <div class="flex items-center gap-0.5 flex-shrink-0">
              <button type="button" data-move-attr="${escapeHtmlText(attr.id)}" data-dir="-1" ${idx === 0 ? "disabled" : ""} class="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-25" title="上へ">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/></svg>
              </button>
              <button type="button" data-move-attr="${escapeHtmlText(attr.id)}" data-dir="1" ${idx === catAttrs.length - 1 ? "disabled" : ""} class="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-25" title="下へ">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <button type="button" data-del-attr="${escapeHtmlText(attr.id)}" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="この小カテゴリを削除">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
        `;
      }).join("");

      return `
        <div data-attr-group-box="${escapeHtmlText(cat.id)}" class="space-y-1.5">
          <div class="flex items-center justify-between px-1">
            <span data-cat-heading="${escapeHtmlText(cat.id)}" class="text-[11px] font-extrabold text-[#1B2B44]">${escapeHtmlText(cat.name || "大カテゴリ")}</span>
            <span class="text-[10px] font-bold text-slate-400">${catAttrs.length}件</span>
          </div>
          <div data-attr-list="${escapeHtmlText(cat.id)}" class="space-y-2 rounded-xl transition">
            ${rowsHtml || '<div data-attr-empty="1" class="p-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-[11px] text-slate-400">この大カテゴリには小カテゴリがありません（ここにドロップして移動可能）</div>'}
          </div>
        </div>
      `;
    }).join("");

    recentDropHighlight = null;

    function buildAttrColorHistoryHtml() {
      const history = global.CASState.getColorHistory();
      const swatches = history.map(function (col) {
        return `<button type="button" data-attr-color-history="${col}" class="w-5 h-5 rounded-md border border-white shadow-sm transition transform hover:scale-110" style="background:${col}" title="履歴: ${col}"></button>`;
      }).join("");
      return `
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] font-bold text-slate-500">使用履歴（最近使ったカラー）</span>
          ${history.length > 0 ? '<button type="button" id="btn-clear-attr-color-history" class="text-[10px] font-bold text-slate-400 hover:text-rose-600 transition">履歴クリア</button>' : ''}
        </div>
        <div class="flex items-center gap-1.5 flex-wrap">
          ${swatches || '<span class="text-[10px] text-slate-400">選択したカラーがここに記録されます</span>'}
        </div>
      `;
    }

    tabBodyEl.innerHTML = `
      <!-- 大カテゴリ名設定 -->
      <div class="bg-[#F8FAFD] p-3.5 rounded-xl border border-slate-200/80 space-y-2">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-extrabold text-[#1B2B44]">大カテゴリ設定 (${categories.length}件)</span>
          <button type="button" id="btn-add-cat" class="px-2 py-1 rounded-md bg-sky-100 hover:bg-sky-200 text-[#1289F6] text-[11px] font-bold transition">＋ 大カテゴリ追加</button>
        </div>
        <p class="text-[11px] text-slate-500 leading-relaxed">左端のグリップをドラッグ（または↑↓）で順番を変更できます。</p>
        <div id="cat-reorder-list" class="space-y-1.5">${catInputsHtml}</div>
      </div>

      <!-- 新規小カテゴリ追加フォーム -->
      <div class="bg-[#F8FAFD] p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
        <div class="text-xs font-extrabold text-[#1B2B44]">新しい小カテゴリを追加</div>
        <p class="text-[11px] text-slate-500 leading-relaxed">ここで追加した小カテゴリは、即座に絞り込みフィルターとキャラ編集の選択肢に反映されます。</p>
        <div class="flex items-center gap-2">
          <input id="inp-new-attr-color" type="color" value="${escapeHtmlText(draftColor)}" class="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 bg-white p-0.5 flex-shrink-0" />
          <input id="inp-new-attr-name" type="text" value="${escapeHtmlText(newAttrDraft.name)}" placeholder="小カテゴリ名" class="flex-1 min-w-0 px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
        </div>
        <div id="attr-color-history-wrap" class="pt-1">
          ${buildAttrColorHistoryHtml()}
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-bold text-slate-600 flex-shrink-0">分類:</span>
          <select id="inp-new-attr-cat" class="js-cat-label-sync flex-1 min-w-0 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none">
            ${newAttrCatOptionsHtml}
          </select>
        </div>
        <button type="button" id="btn-add-attr" class="w-full py-2 rounded-lg bg-[#1289F6] hover:bg-[#0d77db] text-white text-xs font-extrabold shadow-sm transition">＋ 小カテゴリを追加する</button>
      </div>

      <!-- 登録済み小カテゴリ一覧（大カテゴリ別） -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-extrabold text-[#1B2B44]">登録済みの小カテゴリ (${attrs.length}件)</span>
        </div>
        <div class="space-y-3">
          ${groupedListHtml}
        </div>
      </div>
    `;

    tabBodyEl.setAttribute("data-rendered-tab", "attributes");
    tabBodyEl.scrollTop = isSameTab ? prevBodyScrollTop : 0;

    // カテゴリ追加・並び替え・削除・名称変更
    const btnAddCat = document.getElementById("btn-add-cat");
    if (btnAddCat) {
      btnAddCat.addEventListener("click", function () {
        if (!Array.isArray(projectData.attributeCategories)) {
          projectData.attributeCategories = [];
        }
        const existingNames = new Set(projectData.attributeCategories.map(function (c) { return c.name; }));
        let defaultName = "";
        for (let i = 0; i < 26; i++) {
          const candidate = "大カテゴリ" + String.fromCharCode(65 + i);
          if (!existingNames.has(candidate)) {
            defaultName = candidate;
            break;
          }
        }
        if (!defaultName) {
          let num = projectData.attributeCategories.length + 1;
          while (existingNames.has("大カテゴリ" + num)) num++;
          defaultName = "大カテゴリ" + num;
        }
        const newCat = { id: generateId("cat"), name: defaultName };
        projectData.attributeCategories.push(newCat);
        hooks.syncAll(false);
        const inp = tabBodyEl.querySelector('[data-cat-name="' + CSS.escape(newCat.id) + '"]');
        if (inp) {
          inp.focus();
          inp.select();
        }
        showToast("大カテゴリ「" + defaultName + "」を追加しました。", "success");
      });
    }

    tabBodyEl.querySelectorAll("[data-move-cat]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const cid = btn.getAttribute("data-move-cat");
        const dir = parseInt(btn.getAttribute("data-dir"), 10);
        const idx = categories.findIndex(function (c) { return c.id === cid; });
        const target = idx + dir;
        if (idx === -1 || target < 0 || target >= categories.length) return;
        const tmp = categories[idx];
        categories[idx] = categories[target];
        categories[target] = tmp;
        recentDropHighlight = { type: "cat", id: cid };
        hooks.syncAll(false);
        const escId = CSS.escape(cid);
        const nextFocus = tabBodyEl.querySelector('[data-move-cat="' + escId + '"][data-dir="' + dir + '"]:not([disabled])') ||
          tabBodyEl.querySelector('[data-move-cat="' + escId + '"][data-dir="' + (-dir) + '"]:not([disabled])');
        if (nextFocus && typeof nextFocus.focus === "function") {
          try { nextFocus.focus({ preventScroll: true }); } catch (err) {}
        }
      });
    });

    tabBodyEl.querySelectorAll("[data-del-cat]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        if (categories.length <= 1) return;
        const cid = btn.getAttribute("data-del-cat");
        const cat = categories.find(function (c) { return c.id === cid; });
        if (!cat) return;
        const assignedCount = projectData.attributes.filter(function (a) {
          return (a.categoryId || fallbackCatId) === cid;
        }).length;
        const msg = assignedCount > 0
          ? "大カテゴリ「" + cat.name + "」を削除しますか？\n所属する" + assignedCount + "件の小カテゴリは先頭の大カテゴリへ移動されます。"
          : "大カテゴリ「" + cat.name + "」を削除しますか？";
        const ok = await showConfirmDialog("大カテゴリを削除", msg, "削除する", true);
        if (!ok) return;
        projectData.attributeCategories = categories.filter(function (c) { return c.id !== cid; });
        const nextFallbackId = projectData.attributeCategories[0].id;
        projectData.attributes.forEach(function (a) {
          if (!a.categoryId || a.categoryId === cid) a.categoryId = nextFallbackId;
        });
        hooks.syncAll(false);
        showToast("大カテゴリを削除しました。", "info");
      });
    });

    tabBodyEl.querySelectorAll("[data-cat-name]").forEach(function (inp, idx) {
      inp.addEventListener("focus", function () {
        const cid = inp.getAttribute("data-cat-name");
        const cat = categories.find(function (c) { return c.id === cid; });
        const valid = inp.value.trim() ? inp.value : ((cat && cat.name) || "");
        if (valid) inp.setAttribute("data-prev-name", valid);
      });
      inp.addEventListener("input", function () {
        const cid = inp.getAttribute("data-cat-name");
        const cat = categories.find(function (c) { return c.id === cid; });
        if (!cat) return;
        if (inp.value.trim() === "") return;
        cat.name = inp.value;
        const heading = tabBodyEl.querySelector('[data-cat-heading="' + CSS.escape(cid) + '"]');
        if (heading) heading.textContent = cat.name;
        tabBodyEl.querySelectorAll(".js-cat-label-sync").forEach(function (sel) {
          const opt = sel.querySelector('option[value="' + CSS.escape(cid) + '"]');
          if (opt) opt.textContent = cat.name;
        });
        hooks.syncAll(true);
      });
      inp.addEventListener("change", function () {
        const cid = inp.getAttribute("data-cat-name");
        const cat = categories.find(function (c) { return c.id === cid; });
        if (!cat) return;
        if (inp.value.trim() === "") {
          const fallbackLabel = idx < 26 ? ("大カテゴリ" + String.fromCharCode(65 + idx)) : ("大カテゴリ" + (idx + 1));
          const prev = inp.getAttribute("data-prev-name") || cat.name || fallbackLabel;
          inp.value = prev;
          cat.name = prev;
          const heading = tabBodyEl.querySelector('[data-cat-heading="' + CSS.escape(cid) + '"]');
          if (heading) heading.textContent = prev;
          tabBodyEl.querySelectorAll(".js-cat-label-sync").forEach(function (sel) {
            const opt = sel.querySelector('option[value="' + CSS.escape(cid) + '"]');
            if (opt) opt.textContent = prev;
          });
          showToast("大カテゴリ名は空にできません。", "warning");
          hooks.syncAll(true);
        } else {
          inp.setAttribute("data-prev-name", inp.value);
        }
      });
    });

    function refreshAttrColorHistoryStrip() {
      const wrap = document.getElementById("attr-color-history-wrap");
      if (!wrap) return;
      wrap.innerHTML = buildAttrColorHistoryHtml();
      bindAttrColorHistoryEvents();
    }

    function bindAttrColorHistoryEvents() {
      const wrap = document.getElementById("attr-color-history-wrap");
      if (!wrap) return;
      wrap.querySelectorAll("[data-attr-color-history]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const col = btn.getAttribute("data-attr-color-history");
          newAttrDraft.color = col;
          const colorInp = document.getElementById("inp-new-attr-color");
          if (colorInp) colorInp.value = col;
        });
      });
      const btnClear = document.getElementById("btn-clear-attr-color-history");
      if (btnClear) {
        btnClear.addEventListener("click", function () {
          global.CASState.clearColorHistory();
          refreshAttrColorHistoryStrip();
        });
      }
    }
    bindAttrColorHistoryEvents();

    // 追加イベント
    function addAttribute() {
      const nameInp = document.getElementById("inp-new-attr-name");
      const colorInp = document.getElementById("inp-new-attr-color");
      const catSel = document.getElementById("inp-new-attr-cat");
      const name = nameInp.value.trim();
      if (!name) {
        showToast("小カテゴリ名を入力してください。", "warning");
        nameInp.focus();
        return;
      }
      const attrColor = (colorInp.value || "#00AEFF").toUpperCase();
      projectData.attributes.push({
        id: generateId("attr"),
        name: name,
        color: attrColor,
        categoryId: (catSel && catSel.value) || fallbackCatId
      });
      newAttrDraft.name = "";
      global.CASState.recordThemeColor(attrColor);
      hooks.syncAll(false);
      showToast("小カテゴリ「" + name + "」を追加しました。", "success");
    }

    document.getElementById("btn-add-attr").addEventListener("click", addAttribute);
    const newAttrNameInp = document.getElementById("inp-new-attr-name");
    newAttrNameInp.addEventListener("input", function (e) {
      newAttrDraft.name = e.target.value;
    });
    newAttrNameInp.addEventListener("keydown", function (e) {
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === "Enter") addAttribute();
    });
    const newAttrColorInp = document.getElementById("inp-new-attr-color");
    newAttrColorInp.addEventListener("input", function (e) {
      newAttrDraft.color = e.target.value.toUpperCase();
    });
    newAttrColorInp.addEventListener("change", function (e) {
      newAttrDraft.color = e.target.value.toUpperCase();
      global.CASState.recordThemeColor(e.target.value);
      refreshAttrColorHistoryStrip();
    });
    const newAttrCatSel = document.getElementById("inp-new-attr-cat");
    if (newAttrCatSel) {
      newAttrCatSel.addEventListener("change", function (e) {
        newAttrDraft.categoryId = e.target.value;
      });
    }

    // 名称変更（空欄を許容しない）
    tabBodyEl.querySelectorAll("[data-attr-name]").forEach(function (inp) {
      inp.addEventListener("focus", function () {
        const id = inp.getAttribute("data-attr-name");
        const attr = projectData.attributes.find(function (a) { return a.id === id; });
        const valid = inp.value.trim() ? inp.value : ((attr && attr.name) || "");
        if (valid) inp.setAttribute("data-prev-name", valid);
      });
      inp.addEventListener("input", function () {
        const id = inp.getAttribute("data-attr-name");
        const attr = projectData.attributes.find(function (a) { return a.id === id; });
        if (!attr) return;
        if (inp.value.trim() === "") return;
        attr.name = inp.value;
        hooks.syncAll(true);
      });
      inp.addEventListener("change", function () {
        const id = inp.getAttribute("data-attr-name");
        const attr = projectData.attributes.find(function (a) { return a.id === id; });
        if (!attr) return;
        if (inp.value.trim() === "") {
          const prev = inp.getAttribute("data-prev-name") || attr.name || "新規小カテゴリ";
          inp.value = prev;
          attr.name = prev;
          showToast("小カテゴリ名は空にできません。", "warning");
          hooks.syncAll(true);
        } else {
          inp.setAttribute("data-prev-name", inp.value);
        }
      });
    });

    // カラー変更
    tabBodyEl.querySelectorAll("[data-attr-color]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        const id = inp.getAttribute("data-attr-color");
        const attr = projectData.attributes.find(function (a) { return a.id === id; });
        if (attr) {
          attr.color = inp.value.toUpperCase();
          hooks.syncAll(true);
        }
      });
      inp.addEventListener("change", function () {
        const upper = inp.value.toUpperCase();
        const id = inp.getAttribute("data-attr-color");
        const attr = projectData.attributes.find(function (a) { return a.id === id; });
        if (attr) attr.color = upper;
        global.CASState.recordThemeColor(upper);
        refreshAttrColorHistoryStrip();
        hooks.syncAll(true);
      });
    });

    // 所属カテゴリ変更
    tabBodyEl.querySelectorAll("[data-attr-cat]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        const id = sel.getAttribute("data-attr-cat");
        const attr = projectData.attributes.find(function (a) { return a.id === id; });
        if (attr) {
          attr.categoryId = sel.value;
          hooks.syncAll(false);
        }
      });
    });

    // 同一カテゴリ内での並び替え
    tabBodyEl.querySelectorAll("[data-move-attr]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const id = btn.getAttribute("data-move-attr");
        const dir = parseInt(btn.getAttribute("data-dir"), 10);
        const idx = projectData.attributes.findIndex(function (a) { return a.id === id; });
        if (idx === -1) return;
        const catId = projectData.attributes[idx].categoryId || fallbackCatId;
        const sameCatIndices = [];
        projectData.attributes.forEach(function (a, i) {
          if ((a.categoryId || fallbackCatId) === catId) sameCatIndices.push(i);
        });
        const posInCat = sameCatIndices.indexOf(idx);
        const targetPosInCat = posInCat + dir;
        if (posInCat === -1 || targetPosInCat < 0 || targetPosInCat >= sameCatIndices.length) return;
        const targetIdx = sameCatIndices[targetPosInCat];
        const tmp = projectData.attributes[idx];
        projectData.attributes[idx] = projectData.attributes[targetIdx];
        projectData.attributes[targetIdx] = tmp;
        recentDropHighlight = { type: "attr", id: id };
        hooks.syncAll(false);
        const escId = CSS.escape(id);
        const nextFocus = tabBodyEl.querySelector('[data-move-attr="' + escId + '"][data-dir="' + dir + '"]:not([disabled])') ||
          tabBodyEl.querySelector('[data-move-attr="' + escId + '"][data-dir="' + (-dir) + '"]:not([disabled])');
        if (nextFocus && typeof nextFocus.focus === "function") {
          try { nextFocus.focus({ preventScroll: true }); } catch (err) {}
        }
      });
    });

    // 削除
    tabBodyEl.querySelectorAll("[data-del-attr]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        const id = btn.getAttribute("data-del-attr");
        const attr = projectData.attributes.find(function (a) { return a.id === id; });
        if (!attr) return;
        const ok = await showConfirmDialog(
          "小カテゴリを削除",
          "小カテゴリ「" + attr.name + "」を削除しますか？\n各キャラクターへの割り当ても解除されます。",
          "削除する",
          true
        );
        if (!ok) return;
        projectData.attributes = projectData.attributes.filter(function (a) { return a.id !== id; });
        projectData.characters.forEach(function (c) {
          c.attributeIds = c.attributeIds.filter(function (aid) { return aid !== id; });
        });
        hooks.syncAll(false);
        showToast("小カテゴリを削除しました。", "info");
      });
    });

    // Pointer Events ベース・ドラッグ＆ドロップ並び替え（大カテゴリ順列＋小カテゴリ順列＆大カテゴリ横断移動）
    (function setupCategoryAndAttrDragDrop() {
      if (typeof activeDragCleanup === "function") {
        activeDragCleanup();
      }
      let dragState = null;
      let autoScrollRaf = null;

      function ensureIndicator() {
        const el = document.createElement("div");
        el.className = "cas-drop-indicator";
        return el;
      }

      function stopAutoScroll() {
        if (autoScrollRaf) {
          cancelAnimationFrame(autoScrollRaf);
          autoScrollRaf = null;
        }
      }

      function clearDropVisuals() {
        if (!dragState) return;
        if (dragState.indicator && dragState.indicator.parentNode) {
          dragState.indicator.remove();
        }
        tabBodyEl.querySelectorAll(".cas-drop-zone-active").forEach(function (el) {
          el.classList.remove("cas-drop-zone-active");
        });
      }

      function isPointerInsideDropArea(clientX, clientY) {
        const bodyRect = tabBodyEl.getBoundingClientRect();
        const pad = 24;
        if (clientX < bodyRect.left - pad || clientX > bodyRect.right + pad || clientY < bodyRect.top - pad || clientY > bodyRect.bottom + pad) {
          return false;
        }
        if (dragState && dragState.kind === "cat") {
          const listEl = document.getElementById("cat-reorder-list");
          if (!listEl) return false;
          const r = listEl.getBoundingClientRect();
          return clientY >= r.top - pad && clientY <= r.bottom + pad;
        }
        if (dragState && dragState.kind === "attr") {
          const boxes = tabBodyEl.querySelectorAll("[data-attr-group-box]");
          if (!boxes.length) return false;
          let minTop = Infinity;
          let maxBottom = -Infinity;
          for (let i = 0; i < boxes.length; i++) {
            const br = boxes[i].getBoundingClientRect();
            if (br.top < minTop) minTop = br.top;
            if (br.bottom > maxBottom) maxBottom = br.bottom;
          }
          return clientY >= minTop - pad && clientY <= maxBottom + pad;
        }
        return true;
      }

      function updateDropTarget(clientX, clientY) {
        if (!dragState || !dragState.started) return;
        clearDropVisuals();

        if (!isPointerInsideDropArea(clientX, clientY)) {
          dragState.outsideDropArea = true;
          return;
        }
        dragState.outsideDropArea = false;

        if (dragState.kind === "cat") {
          const listEl = document.getElementById("cat-reorder-list");
          if (!listEl) return;
          const otherRows = Array.prototype.slice.call(listEl.querySelectorAll("[data-cat-row]")).filter(function (r) {
            return r !== dragState.sourceRow;
          });
          let insertSlot = otherRows.length;
          let refNode = null;
          for (let i = 0; i < otherRows.length; i++) {
            const rect = otherRows[i].getBoundingClientRect();
            if (clientY < rect.top + rect.height / 2) {
              insertSlot = i;
              refNode = otherRows[i];
              break;
            }
          }
          dragState.dropCatSlot = insertSlot;
          if (refNode) {
            listEl.insertBefore(dragState.indicator, refNode);
          } else {
            listEl.appendChild(dragState.indicator);
          }
          return;
        }

        // kind === "attr": 最も近い/重なっている大カテゴリグループを探す
        const groupBoxes = Array.prototype.slice.call(tabBodyEl.querySelectorAll("[data-attr-group-box]"));
        if (!groupBoxes.length) return;
        let targetBox = null;
        let minDist = Infinity;
        for (let i = 0; i < groupBoxes.length; i++) {
          const r = groupBoxes[i].getBoundingClientRect();
          if (clientY >= r.top && clientY <= r.bottom) {
            targetBox = groupBoxes[i];
            break;
          }
          const dist = clientY < r.top ? (r.top - clientY) : (clientY - r.bottom);
          if (dist < minDist) {
            minDist = dist;
            targetBox = groupBoxes[i];
          }
        }
        if (!targetBox) return;

        const targetCatId = targetBox.getAttribute("data-attr-group-box");
        const listEl = targetBox.querySelector("[data-attr-list]");
        if (!listEl) return;

        const otherRows = Array.prototype.slice.call(listEl.querySelectorAll("[data-attr-row]")).filter(function (r) {
          return r !== dragState.sourceRow;
        });

        let insertSlot = otherRows.length;
        let refNode = null;
        for (let i = 0; i < otherRows.length; i++) {
          const rect = otherRows[i].getBoundingClientRect();
          if (clientY < rect.top + rect.height / 2) {
            insertSlot = i;
            refNode = otherRows[i];
            break;
          }
        }

        dragState.dropAttrCatId = targetCatId;
        dragState.dropAttrSlot = insertSlot;

        if (otherRows.length === 0) {
          if (targetCatId !== dragState.sourceCatId) {
            listEl.classList.add("cas-drop-zone-active");
            listEl.insertBefore(dragState.indicator, listEl.firstChild);
          }
        } else if (refNode) {
          listEl.insertBefore(dragState.indicator, refNode);
        } else {
          listEl.appendChild(dragState.indicator);
        }
      }

      function stepAutoScroll() {
        if (!dragState || !dragState.started) {
          autoScrollRaf = null;
          return;
        }
        if (!dragState.outsideDropArea) {
          const bodyRect = tabBodyEl.getBoundingClientRect();
          const edge = 46;
          let delta = 0;
          if (dragState.lastClientY < bodyRect.top + edge) {
            delta = -Math.max(4, Math.round((bodyRect.top + edge - dragState.lastClientY) / 4));
          } else if (dragState.lastClientY > bodyRect.bottom - edge) {
            delta = Math.max(4, Math.round((dragState.lastClientY - (bodyRect.bottom - edge)) / 4));
          }
          if (delta !== 0) {
            const before = tabBodyEl.scrollTop;
            tabBodyEl.scrollTop += delta;
            if (tabBodyEl.scrollTop !== before) {
              updateDropTarget(dragState.lastClientX, dragState.lastClientY);
            }
          }
        }
        autoScrollRaf = requestAnimationFrame(stepAutoScroll);
      }

      function onDragKeyDown(e) {
        if (!dragState) return;
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          cleanupDrag(false);
        }
      }

      function startDragVisuals(clientX, clientY) {
        if (!dragState || dragState.started) return;
        dragState.started = true;
        const rect = dragState.sourceRow.getBoundingClientRect();
        dragState.offsetX = clientX - rect.left;
        dragState.offsetY = clientY - rect.top;

        const ghost = dragState.sourceRow.cloneNode(true);
        const origFields = dragState.sourceRow.querySelectorAll("input, select");
        const ghostFields = ghost.querySelectorAll("input, select");
        for (let i = 0; i < origFields.length; i++) {
          if (ghostFields[i]) {
            ghostFields[i].value = origFields[i].value;
          }
        }
        ghost.classList.remove("cas-just-dropped");
        ghost.classList.add("cas-drag-ghost");
        ghost.style.width = rect.width + "px";
        ghost.style.left = rect.left + "px";
        ghost.style.top = rect.top + "px";
        document.body.appendChild(ghost);
        dragState.ghost = ghost;
        dragState.indicator = ensureIndicator();
        dragState.sourceRow.classList.add("cas-drag-source");

        document.addEventListener("keydown", onDragKeyDown, true);
        updateDropTarget(clientX, clientY);
        autoScrollRaf = requestAnimationFrame(stepAutoScroll);
      }

      function commitDrop() {
        if (!dragState || !dragState.started || dragState.outsideDropArea) return;

        if (dragState.kind === "cat" && dragState.dropCatSlot != null) {
          const cid = dragState.itemId;
          const oldIdx = projectData.attributeCategories.findIndex(function (c) { return c.id === cid; });
          if (oldIdx !== -1 && dragState.dropCatSlot !== oldIdx) {
            const movingCat = projectData.attributeCategories[oldIdx];
            const without = projectData.attributeCategories.filter(function (c) { return c.id !== cid; });
            without.splice(dragState.dropCatSlot, 0, movingCat);
            projectData.attributeCategories = without;
            recentDropHighlight = { type: "cat", id: cid };
            hooks.syncAll(false);
          }
          return;
        }

        if (dragState.kind === "attr" && dragState.dropAttrCatId != null && dragState.dropAttrSlot != null) {
          const aid = dragState.itemId;
          const oldIdx = projectData.attributes.findIndex(function (a) { return a.id === aid; });
          if (oldIdx === -1) return;
          const movingAttr = projectData.attributes[oldIdx];
          const oldCatId = movingAttr.categoryId || fallbackCatId;
          const targetCatId = dragState.dropAttrCatId;

          let oldSlotInCat = 0;
          for (let i = 0; i < oldIdx; i++) {
            if ((projectData.attributes[i].categoryId || fallbackCatId) === oldCatId) {
              oldSlotInCat++;
            }
          }

          if (oldCatId === targetCatId && dragState.dropAttrSlot === oldSlotInCat) {
            return;
          }

          const without = projectData.attributes.filter(function (a) { return a.id !== aid; });
          const sameCatIndices = [];
          without.forEach(function (a, i) {
            if ((a.categoryId || fallbackCatId) === targetCatId) {
              sameCatIndices.push(i);
            }
          });

          let globalInsertIdx = without.length;
          if (sameCatIndices.length > 0) {
            if (dragState.dropAttrSlot < sameCatIndices.length) {
              globalInsertIdx = sameCatIndices[dragState.dropAttrSlot];
            } else {
              globalInsertIdx = sameCatIndices[sameCatIndices.length - 1] + 1;
            }
          }

          movingAttr.categoryId = targetCatId;
          without.splice(globalInsertIdx, 0, movingAttr);
          projectData.attributes = without;
          recentDropHighlight = { type: "attr", id: aid };
          hooks.syncAll(false);
          if (oldCatId !== targetCatId) {
            const targetCat = projectData.attributeCategories.find(function (c) { return c.id === targetCatId; });
            showToast("「" + movingAttr.name + "」を「" + ((targetCat && targetCat.name) || "大カテゴリ") + "」へ移動しました。", "info");
          }
        }
      }

      function cleanupDrag(commit) {
        if (!dragState) return;
        const st = dragState;
        dragState = null;
        activeDragCleanup = null;

        stopAutoScroll();
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
        document.removeEventListener("pointercancel", onPointerCancel);
        document.removeEventListener("keydown", onDragKeyDown, true);
        window.removeEventListener("blur", onWindowBlur);

        if (st.handle && typeof st.handle.hasPointerCapture === "function" && typeof st.handle.releasePointerCapture === "function") {
          try {
            if (st.handle.hasPointerCapture(st.pointerId)) {
              st.handle.releasePointerCapture(st.pointerId);
            }
          } catch (err) {}
        }

        if (st.indicator && st.indicator.parentNode) {
          st.indicator.remove();
        }
        tabBodyEl.querySelectorAll(".cas-drop-zone-active").forEach(function (el) {
          el.classList.remove("cas-drop-zone-active");
        });
        if (st.ghost && st.ghost.parentNode) {
          st.ghost.remove();
        }
        if (st.sourceRow) {
          st.sourceRow.classList.remove("cas-drag-source");
        }
        if (commit && st.started && !st.outsideDropArea) {
          dragState = st;
          commitDrop();
          dragState = null;
        }
      }

      function onPointerMove(e) {
        if (!dragState || e.pointerId !== dragState.pointerId) return;
        dragState.lastClientX = e.clientX;
        dragState.lastClientY = e.clientY;
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;
        if (!dragState.started) {
          if (Math.hypot(dx, dy) < 5) return;
          startDragVisuals(e.clientX, e.clientY);
        }
        e.preventDefault();
        if (dragState.ghost) {
          dragState.ghost.style.top = (e.clientY - dragState.offsetY) + "px";
        }
        updateDropTarget(e.clientX, e.clientY);
      }

      function onPointerUp(e) {
        if (!dragState || e.pointerId !== dragState.pointerId) return;
        cleanupDrag(true);
      }

      function onPointerCancel(e) {
        if (!dragState || e.pointerId !== dragState.pointerId) return;
        cleanupDrag(false);
      }

      function onWindowBlur() {
        cleanupDrag(false);
      }

      tabBodyEl.querySelectorAll("[data-drag-cat], [data-drag-attr]").forEach(function (handle) {
        handle.addEventListener("pointerdown", function (e) {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          if (handle.disabled) return;
          if (typeof activeDragCleanup === "function") activeDragCleanup();

          const isCat = handle.hasAttribute("data-drag-cat");
          const itemId = handle.getAttribute(isCat ? "data-drag-cat" : "data-drag-attr");
          const sourceRow = handle.closest(isCat ? "[data-cat-row]" : "[data-attr-row]");
          if (!itemId || !sourceRow) return;

          e.preventDefault();
          if (typeof handle.setPointerCapture === "function") {
            try { handle.setPointerCapture(e.pointerId); } catch (err) {}
          }

          dragState = {
            kind: isCat ? "cat" : "attr",
            itemId: itemId,
            sourceRow: sourceRow,
            sourceCatId: isCat ? null : (sourceRow.getAttribute("data-attr-cat-id") || fallbackCatId),
            handle: handle,
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            lastClientX: e.clientX,
            lastClientY: e.clientY,
            offsetX: 0,
            offsetY: 0,
            started: false,
            outsideDropArea: false,
            ghost: null,
            indicator: null,
            dropCatSlot: null,
            dropAttrCatId: null,
            dropAttrSlot: null
          };
          activeDragCleanup = function () { cleanupDrag(false); };

          document.addEventListener("pointermove", onPointerMove);
          document.addEventListener("pointerup", onPointerUp);
          document.addEventListener("pointercancel", onPointerCancel);
          window.addEventListener("blur", onWindowBlur);
        });
      });
    })();
  }

  /* --- タブ3：サイト設定 --- */
  function renderSiteTab() {
    const projectData = global.CASState.getProjectData();
    const escapeHtmlText = global.CASState.escapeHtmlText;
    const tabBodyEl = getTabBodyEl();
    if (!tabBodyEl) return;

    const isSameTab = tabBodyEl.getAttribute("data-rendered-tab") === "site";
    const prevBodyScrollTop = isSameTab ? tabBodyEl.scrollTop : 0;

    const s = projectData.site;
    const accentPresets = ["#00AEFF", "#1289F6", "#2563EB", "#FF5E8E", "#10B981", "#7C3AED"];
    const patterns = [
      { id: "grid", label: "グリッド", desc: "スタイリッシュな方眼ライン" },
      { id: "dots", label: "ドット", desc: "軽やかで清潔感のある微細ドット" },
      { id: "stripes", label: "斜線", desc: "スピード感のある斜めテクスチャ" }
    ];
    const defaultViewModes = [
      { id: "grid", label: "標準グリッド" },
      { id: "compact", label: "アイコン" },
      { id: "list", label: "リスト" }
    ];
    const currentDefaultViewMode = (s.defaultViewMode === "compact" || s.defaultViewMode === "list") ? s.defaultViewMode : "grid";

    const safeAccent = /^#[0-9A-Fa-f]{6}$/.test(s.accentColor) ? s.accentColor.toUpperCase() : "#00AEFF";

    tabBodyEl.innerHTML = `
      <div class="space-y-3.5 bg-[#F8FAFD] p-3.5 rounded-xl border border-slate-200/80">
        <div class="text-xs font-extrabold text-[#1B2B44]">ヘッダー＆サイト基本情報</div>

        <div>
          <label class="block text-[11px] font-bold text-slate-600 mb-1">サイトタイトル</label>
          <input id="inp-site-title" type="text" value="${escapeHtmlText(s.title)}" class="w-full px-3 py-2 text-sm font-bold text-[#1B2B44] rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-600 mb-1">サブタイトル</label>
          <input id="inp-site-subtitle" type="text" value="${escapeHtmlText(s.subtitle)}" class="w-full px-3 py-1.5 text-xs text-[#1B2B44] rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-600 mb-1">装飾バッジ（英字マイクロラベル）</label>
          <input id="inp-site-badge" type="text" value="${escapeHtmlText(s.badgeText)}" placeholder="POLE GIRLS // ARCHIVE DATABASE" class="w-full px-3 py-1.5 text-xs font-mono font-bold text-[#1B2B44] rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
        </div>

        <div class="p-2.5 rounded-lg bg-white border border-slate-200/90 space-y-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[11px] font-bold text-slate-600">ホームページリンク（装飾バッジ横・任意）</span>
            <span id="badge-site-home-link" class="text-[10px] font-extrabold px-2 py-0.5 rounded-full ${String(s.homeUrl || "").trim() ? "bg-sky-100 text-[#1289F6]" : "bg-slate-200/80 text-slate-500"}">${String(s.homeUrl || "").trim() ? "ON（表示中）" : "OFF（非表示）"}</span>
          </div>
          <div>
            <label for="inp-site-home-url" class="block text-[10px] font-bold text-slate-500 mb-1">リンク先URL・相対パス（空欄で非表示）</label>
            <input id="inp-site-home-url" type="text" value="${escapeHtmlText(s.homeUrl || "")}" placeholder="例: ../index.html または https://..." class="w-full px-2.5 py-1.5 text-xs text-[#1B2B44] rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00AEFF] focus:outline-none" />
          </div>
          <div>
            <label for="inp-site-home-label" class="block text-[10px] font-bold text-slate-500 mb-1">リンク表示テキスト（任意の語）</label>
            <input id="inp-site-home-label" type="text" value="${escapeHtmlText(s.homeLabel != null ? s.homeLabel : "トップページへ")}" placeholder="トップページへ" class="w-full px-2.5 py-1.5 text-xs font-bold text-[#1B2B44] rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00AEFF] focus:outline-none" />
          </div>
        </div>

        <div class="p-2.5 rounded-lg bg-white border border-slate-200/90 space-y-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[11px] font-bold text-slate-600">追加リンク2（ホームページリンク横・任意）</span>
            <span id="badge-site-home2-link" class="text-[10px] font-extrabold px-2 py-0.5 rounded-full ${String(s.homeUrl2 || "").trim() ? "bg-sky-100 text-[#1289F6]" : "bg-slate-200/80 text-slate-500"}">${String(s.homeUrl2 || "").trim() ? "ON（表示中）" : "OFF（非表示）"}</span>
          </div>
          <div>
            <label for="inp-site-home2-url" class="block text-[10px] font-bold text-slate-500 mb-1">リンク先URL・相対パス（空欄で非表示）</label>
            <input id="inp-site-home2-url" type="text" value="${escapeHtmlText(s.homeUrl2 || "")}" placeholder="例: ../about.html または https://..." class="w-full px-2.5 py-1.5 text-xs text-[#1B2B44] rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00AEFF] focus:outline-none" />
          </div>
          <div>
            <label for="inp-site-home2-label" class="block text-[10px] font-bold text-slate-500 mb-1">リンク表示テキスト（任意の語）</label>
            <input id="inp-site-home2-label" type="text" value="${escapeHtmlText(s.homeLabel2 != null ? s.homeLabel2 : "")}" placeholder="関連リンク" class="w-full px-2.5 py-1.5 text-xs font-bold text-[#1B2B44] rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00AEFF] focus:outline-none" />
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-600 mb-1">カウンターラベル（人数表示の上部）</label>
          <input id="inp-site-counter-label" type="text" value="${escapeHtmlText(s.counterLabel != null ? s.counterLabel : "キャラクター総数")}" placeholder="キャラクター総数" class="w-full px-3 py-1.5 text-xs font-bold text-[#1B2B44] rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1">プロフィール窓タイトル</label>
            <input id="inp-site-modal-label" type="text" value="${escapeHtmlText(s.modalLabel != null ? s.modalLabel : "CHARACTER PROFILE")}" placeholder="CHARACTER PROFILE" class="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-[#1B2B44] rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1">ナンバリング書式</label>
            <input id="inp-site-modal-number-format" type="text" value="${escapeHtmlText(s.modalNumberFormat != null ? s.modalNumberFormat : "// {01}")}" placeholder="// {01}" class="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-[#1B2B44] rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
          </div>
        </div>
        <p class="text-[10px] text-slate-400 -mt-1.5">書式例: <code>// {01}</code>、<code>#{01}</code>、<code>No.{1}</code>（<code>{01}</code>=2桁、<code>{001}</code>=3桁、<code>{1}</code>=桁埋めなし）</p>

        <div class="grid grid-cols-1 gap-2">
          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1">スペック欄見出し（別窓・空欄で非表示）</label>
            <input id="inp-site-spec-label" type="text" value="${escapeHtmlText(s.specSectionLabel != null ? s.specSectionLabel : "SPECIFICATION // DATA")}" placeholder="SPECIFICATION // DATA" class="w-full px-3 py-1.5 text-xs font-mono font-bold text-[#1B2B44] rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1">紹介文欄見出し（別窓・空欄で非表示）</label>
            <input id="inp-site-bio-label" type="text" value="${escapeHtmlText(s.bioSectionLabel != null ? s.bioSectionLabel : "PROFILE // OVERVIEW")}" placeholder="PROFILE // OVERVIEW" class="w-full px-3 py-1.5 text-xs font-mono font-bold text-[#1B2B44] rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1">画像1 タブ名（共通）</label>
            <input id="inp-site-img-tab1" type="text" value="${escapeHtmlText(s.imageTab1Label != null ? s.imageTab1Label : "画像1")}" placeholder="画像1" class="w-full px-2.5 py-1.5 text-xs font-bold text-[#1B2B44] rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 mb-1">画像2 タブ名（共通）</label>
            <input id="inp-site-img-tab2" type="text" value="${escapeHtmlText(s.imageTab2Label != null ? s.imageTab2Label : "画像2")}" placeholder="画像2" class="w-full px-2.5 py-1.5 text-xs font-bold text-[#1B2B44] rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
          </div>
        </div>
        <p class="text-[10px] text-slate-400 -mt-1.5">※各キャラ編集のタブ名が空欄のときにこの表記が使われます</p>

        <div>
          <label class="block text-[11px] font-bold text-slate-600 mb-1">詳細解説リンク ボタン文言（共通）</label>
          <input id="inp-site-detail-link-label" type="text" value="${escapeHtmlText(s.detailLinkLabel != null ? s.detailLinkLabel : "詳しい解説ページを見る")}" placeholder="詳しい解説ページを見る" class="w-full px-3 py-1.5 text-xs font-bold text-[#1B2B44] rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
          <p class="text-[10px] text-slate-400 mt-1">※各キャラで「詳細解説リンク URL」を入力したときに表示されます</p>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-600 mb-1">フッターテキスト（左端）</label>
          <input id="inp-site-footer" type="text" value="${escapeHtmlText(s.footerText)}" class="w-full px-3 py-1.5 text-xs text-[#1B2B44] rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-600 mb-1">クレジット表記（右端・空欄で非表示）</label>
          <input id="inp-site-footer-credit" type="text" value="${escapeHtmlText(s.footerCredit != null ? s.footerCredit : "CHARACTER ARCHIVE SYSTEM（Powered by しーさいど）")}" placeholder="CHARACTER ARCHIVE SYSTEM（Powered by しーさいど）" class="w-full px-3 py-1.5 text-xs font-mono font-bold text-[#1B2B44] rounded-lg border border-slate-200 bg-white focus:border-[#00AEFF] focus:outline-none" />
        </div>
      </div>

      <div class="space-y-3.5 bg-[#F8FAFD] p-3.5 rounded-xl border border-slate-200/80">
        <div class="text-xs font-extrabold text-[#1B2B44]">テーマ＆背景スタイル</div>

        <div>
          <label class="block text-[11px] font-bold text-slate-600 mb-1.5">アクセントカラー</label>
          <div class="flex items-center gap-2 flex-wrap">
            <input id="inp-site-accent" type="color" value="${escapeHtmlText(safeAccent)}" class="w-9 h-8 rounded cursor-pointer border border-slate-200 bg-white p-0.5" />
            <span id="txt-site-accent" class="text-xs font-mono font-bold text-slate-600 mr-1">${escapeHtmlText(safeAccent)}</span>
            <div class="flex items-center gap-1.5">
              ${accentPresets.map(function (col) {
                return `<button type="button" data-site-accent="${col}" class="w-6 h-6 rounded-md border-2 ${safeAccent === col ? "border-[#1B2B44]" : "border-white shadow-sm"}" style="background:${col}" title="${col}"></button>`;
              }).join("")}
            </div>
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-600 mb-1.5">背景パターン</label>
          <div class="grid grid-cols-1 gap-1.5">
            ${patterns.map(function (p) {
              const active = s.bgPattern === p.id;
              return `
                <button type="button" data-bg-pattern="${p.id}" aria-pressed="${active ? "true" : "false"}" class="text-left p-2.5 rounded-lg border transition flex items-center justify-between ${active ? "bg-sky-50 border-[#00AEFF] text-[#1B2B44]" : "bg-white border-slate-200 text-slate-600 hover:border-sky-300"}">
                  <span class="block">
                    <span class="block text-xs font-extrabold">${p.label}</span>
                    <span class="block text-[10px] text-slate-500">${p.desc}</span>
                  </span>
                  <span class="w-4 h-4 rounded-full border-2 flex items-center justify-center ${active ? "border-[#00AEFF]" : "border-slate-300"}">
                    ${active ? '<span class="w-2 h-2 rounded-full bg-[#00AEFF]"></span>' : ""}
                  </span>
                </button>
              `;
            }).join("")}
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-600 mb-1.5">初期表示形式（公開時のデフォルト）</label>
          <div class="grid grid-cols-3 gap-1.5">
            ${defaultViewModes.map(function (vm) {
              const active = currentDefaultViewMode === vm.id;
              return `<button type="button" data-default-view-mode="${vm.id}" aria-pressed="${active ? "true" : "false"}" class="py-2 px-1.5 rounded-lg border text-[11px] font-extrabold transition text-center ${active ? "bg-sky-50 border-[#00AEFF] text-[#1289F6]" : "bg-white border-slate-200 text-slate-600 hover:border-sky-300"}">${vm.label}</button>`;
            }).join("")}
          </div>
        </div>
      </div>
    `;

    tabBodyEl.setAttribute("data-rendered-tab", "site");
    tabBodyEl.scrollTop = isSameTab ? prevBodyScrollTop : 0;

    document.getElementById("inp-site-title").addEventListener("input", function (e) {
      projectData.site.title = e.target.value;
      hooks.syncAll(true, { scope: "siteMeta" });
    });
    document.getElementById("inp-site-subtitle").addEventListener("input", function (e) {
      projectData.site.subtitle = e.target.value;
      hooks.syncAll(true, { scope: "siteMeta" });
    });
    document.getElementById("inp-site-badge").addEventListener("input", function (e) {
      projectData.site.badgeText = e.target.value;
      hooks.syncAll(true, { scope: "siteMeta" });
    });
    function bindSiteHeaderLinkFields(urlInpId, labelInpId, badgeId, urlKey, labelKey) {
      const urlInp = document.getElementById(urlInpId);
      const labelInp = document.getElementById(labelInpId);
      const badgeEl = document.getElementById(badgeId);
      function updateBadge(rawUrl) {
        if (!badgeEl) return;
        const cleaned = String(rawUrl || "").replace(/[\u0000-\u001F\u007F]/g, "").trim();
        if (!cleaned) {
          badgeEl.setAttribute("data-link-state", "off");
          badgeEl.textContent = "OFF（非表示）";
          badgeEl.className = "text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-500";
          return;
        }
        if (!global.CASState.sanitizeLinkUrl(cleaned)) {
          badgeEl.setAttribute("data-link-state", "invalid");
          badgeEl.textContent = "無効なURL（非表示）";
          badgeEl.className = "text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600";
          return;
        }
        badgeEl.setAttribute("data-link-state", "on");
        badgeEl.textContent = "ON（表示中）";
        badgeEl.className = "text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-100 text-[#1289F6]";
      }
      if (urlInp) {
        updateBadge(projectData.site[urlKey]);
        urlInp.addEventListener("input", function (e) {
          projectData.site[urlKey] = e.target.value.trim();
          updateBadge(projectData.site[urlKey]);
          hooks.syncAll(true, { scope: "siteMeta" });
        });
      }
      if (labelInp) {
        labelInp.addEventListener("input", function (e) {
          projectData.site[labelKey] = e.target.value;
          hooks.syncAll(true, { scope: "siteMeta" });
        });
      }
    }
    bindSiteHeaderLinkFields("inp-site-home-url", "inp-site-home-label", "badge-site-home-link", "homeUrl", "homeLabel");
    bindSiteHeaderLinkFields("inp-site-home2-url", "inp-site-home2-label", "badge-site-home2-link", "homeUrl2", "homeLabel2");
    document.getElementById("inp-site-counter-label").addEventListener("input", function (e) {
      projectData.site.counterLabel = e.target.value;
      hooks.syncAll(true, { scope: "siteMeta" });
    });
    document.getElementById("inp-site-modal-label").addEventListener("input", function (e) {
      projectData.site.modalLabel = e.target.value;
      hooks.syncAll(true, { scope: "modalOnly" });
    });
    document.getElementById("inp-site-modal-number-format").addEventListener("input", function (e) {
      projectData.site.modalNumberFormat = e.target.value;
      hooks.syncAll(true, { scope: "modalOnly" });
    });
    document.getElementById("inp-site-spec-label").addEventListener("input", function (e) {
      projectData.site.specSectionLabel = e.target.value;
      hooks.syncAll(true, { scope: "modalOnly" });
    });
    document.getElementById("inp-site-bio-label").addEventListener("input", function (e) {
      projectData.site.bioSectionLabel = e.target.value;
      hooks.syncAll(true, { scope: "modalOnly" });
    });
    document.getElementById("inp-site-img-tab1").addEventListener("input", function (e) {
      projectData.site.imageTab1Label = e.target.value;
      hooks.syncAll(true, { scope: "modalOnly" });
    });
    document.getElementById("inp-site-img-tab2").addEventListener("input", function (e) {
      projectData.site.imageTab2Label = e.target.value;
      hooks.syncAll(true, { scope: "modalOnly" });
    });
    document.getElementById("inp-site-detail-link-label").addEventListener("input", function (e) {
      projectData.site.detailLinkLabel = e.target.value;
      hooks.syncAll(true, { scope: "modalOnly" });
    });
    document.getElementById("inp-site-footer").addEventListener("input", function (e) {
      projectData.site.footerText = e.target.value;
      hooks.syncAll(true, { scope: "siteMeta" });
    });
    document.getElementById("inp-site-footer-credit").addEventListener("input", function (e) {
      projectData.site.footerCredit = e.target.value;
      hooks.syncAll(true, { scope: "siteMeta" });
    });
    document.getElementById("inp-site-accent").addEventListener("input", function (e) {
      const upper = e.target.value.toUpperCase();
      projectData.site.accentColor = upper;
      document.getElementById("txt-site-accent").textContent = upper;
      tabBodyEl.querySelectorAll("[data-site-accent]").forEach(function (btn) {
        const isMatch = (btn.getAttribute("data-site-accent") || "").toUpperCase() === upper;
        btn.className = "w-6 h-6 rounded-md border-2 " + (isMatch ? "border-[#1B2B44]" : "border-white shadow-sm");
      });
      hooks.syncAll(true, { scope: "siteMeta" });
    });

    tabBodyEl.querySelectorAll("[data-site-accent]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        projectData.site.accentColor = btn.getAttribute("data-site-accent").toUpperCase();
        hooks.syncAll(false);
      });
    });

    tabBodyEl.querySelectorAll("[data-bg-pattern]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        projectData.site.bgPattern = btn.getAttribute("data-bg-pattern");
        hooks.syncAll(false);
      });
    });

    tabBodyEl.querySelectorAll("[data-default-view-mode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const val = btn.getAttribute("data-default-view-mode");
        projectData.site.defaultViewMode = (val === "compact" || val === "list") ? val : "grid";
        hooks.syncAll(false, { scope: "siteDefaultView" });
      });
    });
  }

  global.CASEditor = {
    init: init,
    resetDrafts: resetDrafts,
    getSelectedCharacter: getSelectedCharacter,
    updateTabButtons: updateTabButtons,
    renderEditorSidebar: renderEditorSidebar,
    renderCharactersTab: renderCharactersTab,
    renderAttributesTab: renderAttributesTab,
    renderSiteTab: renderSiteTab
  };
})(window);
