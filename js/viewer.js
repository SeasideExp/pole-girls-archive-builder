/**
 * viewer.js
 * 公開ページ＆ライブプレビュー共通ビューアエンジン
 * 名前空間: window.CASViewer
 *
 * 【重要不変条件】
 * initArchiveViewer() は公開用単一HTML書き出し時に Function.prototype.toString() で
 * そのまま出力HTMLへ埋め込まれます。外部変数・クロージャ・他モジュールへ一切依存させないでください。
 */
(function (global) {
  "use strict";

  function initArchiveViewer(mountEl, initialData, options) {
    const opts = options || {};
    let data = initialData;
    function resolveSiteDefaultViewMode(site) {
      const m = site && site.defaultViewMode;
      return (m === "compact" || m === "list") ? m : "grid";
    }

    const viewState = {
      selectedAttrIds: [],
      filterLogic: "OR", // "OR" | "AND"
      sortOrder: "desc", // "desc" | "asc"
      viewMode: resolveSiteDefaultViewMode(initialData && initialData.site), // "grid" | "compact" | "list"
      searchQuery: "",
      activeCatTabId: "__CLOSED__", // "__CLOSED__" | categoryId
      modalCharId: null,
      modalImageTab: 1, // 1 | 2
      lightboxOpen: false
    };
    let lastAttrStructureKey = null;

    function escHtml(str) {
      return String(str == null ? "" : str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function sanitizeDetailUrl(raw) {
      const cleaned = String(raw == null ? "" : raw).replace(/[\u0000-\u001F\u007F]/g, "").trim();
      if (!cleaned) return "";
      if (/^(?:\/\/|\\)/.test(cleaned)) return "";
      const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(cleaned);
      if (schemeMatch) {
        if (!/^https?:\/\/[^/\s\\]+/i.test(cleaned)) return "";
      }
      return cleaned;
    }

    function hexToRgbString(hex) {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
      if (!m) return "0, 174, 255";
      return parseInt(m[1], 16) + ", " + parseInt(m[2], 16) + ", " + parseInt(m[3], 16);
    }

    function getContrastTextColor(hex) {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
      if (!m) return "#FFFFFF";
      const r = parseInt(m[1], 16) / 255;
      const g = parseInt(m[2], 16) / 255;
      const b = parseInt(m[3], 16) / 255;
      function lin(c) {
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      }
      const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      return luminance > 0.40 ? "#1B2B44" : "#FFFFFF";
    }

    function getFallbackAvatar(name, color) {
      const firstChar = Array.from((name || "?").trim())[0] || "?";
      const initial = firstChar.toUpperCase();
      const c = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#00AEFF";
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#EDF4FC"/><rect width="200" height="8" fill="' + c + '"/><text x="100" y="122" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="76" fill="#1B2B44">' + escHtml(initial) + "</text></svg>";
      return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    }

    function getAttributeMap() {
      const map = {};
      (data.attributes || []).forEach(function (a) {
        map[a.id] = a;
      });
      return map;
    }

    function getOrderedCharAttrs(ch) {
      const ids = Array.isArray(ch && ch.attributeIds) ? ch.attributeIds : [];
      if (ids.length === 0) return [];
      const selectedSet = {};
      for (let i = 0; i < ids.length; i++) {
        selectedSet[ids[i]] = true;
      }
      const attrs = data.attributes || [];
      const categories = Array.isArray(data.attributeCategories) && data.attributeCategories.length > 0
        ? data.attributeCategories
        : null;
      if (!categories) {
        return attrs.filter(function (a) { return Boolean(selectedSet[a.id]); });
      }
      const catOrderMap = {};
      categories.forEach(function (cat, idx) {
        catOrderMap[cat.id] = idx;
      });
      const buckets = categories.map(function () { return []; });
      attrs.forEach(function (a) {
        if (!selectedSet[a.id]) return;
        const ci = Object.prototype.hasOwnProperty.call(catOrderMap, a.categoryId) ? catOrderMap[a.categoryId] : 0;
        buckets[ci].push(a);
      });
      const ordered = [];
      buckets.forEach(function (bucket) {
        for (let i = 0; i < bucket.length; i++) ordered.push(bucket[i]);
      });
      return ordered;
    }

    function getFilteredCharacters() {
      const chars = data.characters || [];
      const attrMap = getAttributeMap();
      const q = (viewState.searchQuery || "").trim().toLowerCase();
      const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
      const selected = viewState.selectedAttrIds;
      const logic = viewState.filterLogic;

      return chars.filter(function (ch) {
        // 属性フィルター
        if (selected.length > 0) {
          const charAttrs = ch.attributeIds || [];
          if (logic === "AND") {
            for (let i = 0; i < selected.length; i++) {
              if (charAttrs.indexOf(selected[i]) === -1) return false;
            }
          } else {
            let matched = false;
            for (let i = 0; i < selected.length; i++) {
              if (charAttrs.indexOf(selected[i]) !== -1) {
                matched = true;
                break;
              }
            }
            if (!matched) return false;
          }
        }

        // キーワード検索（名前・サブテキスト・セリフ・紹介文・スペック・小カテゴリ名／スペース区切りAND対応）
        if (tokens.length > 0) {
          const specsText = (ch.specs || [])
            .map(function (s) { return (s.label || "") + " " + (s.value || ""); })
            .join(" ");
          const attrNamesText = (ch.attributeIds || [])
            .map(function (aid) { return attrMap[aid] ? (attrMap[aid].name || "") : ""; })
            .join(" ");
          const haystack = [
            ch.name || "",
            ch.subName || "",
            ch.catchphrase || "",
            ch.bio || "",
            specsText,
            attrNamesText
          ].join(" ").toLowerCase();
          for (let i = 0; i < tokens.length; i++) {
            if (haystack.indexOf(tokens[i]) === -1) return false;
          }
        }
        return true;
      });
    }

    function getFilteredAndSortedCharacters() {
      const filtered = getFilteredCharacters();
      return viewState.sortOrder === "desc" ? filtered.slice().reverse() : filtered;
    }

    const modalTitleId = "ba-modal-title-" + Math.random().toString(36).slice(2, 8);

    // 初回DOM骨格構築
    mountEl.innerHTML =
      '<div class="ba-root" data-pattern="grid">' +
        '<div class="ba-bg-layer"></div>' +
        '<div class="ba-bg-pattern"></div>' +
        '<div class="ba-container">' +
          '<header class="ba-header"></header>' +
          '<div class="ba-filter-sentinel" aria-hidden="true"></div>' +
          '<section class="ba-filter-panel" aria-label="キャラクター検索・カテゴリ絞り込み"></section>' +
          '<main class="ba-grid-area"></main>' +
          '<footer class="ba-footer"></footer>' +
        '</div>' +
        '<div class="ba-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="' + modalTitleId + '" aria-hidden="true" inert>' +
          '<div class="ba-modal-window"></div>' +
        '</div>' +
        '<div class="ba-lightbox-overlay" role="dialog" aria-modal="true" aria-label="キャラクター全身画像" aria-hidden="true" inert></div>' +
      '</div>';

    const rootEl = mountEl.querySelector(".ba-root");
    const headerEl = mountEl.querySelector(".ba-header");
    const filterSentinelEl = mountEl.querySelector(".ba-filter-sentinel");
    const filterEl = mountEl.querySelector(".ba-filter-panel");
    const gridAreaEl = mountEl.querySelector(".ba-grid-area");
    const footerEl = mountEl.querySelector(".ba-footer");
    const modalOverlayEl = mountEl.querySelector(".ba-modal-overlay");
    const modalWindowEl = mountEl.querySelector(".ba-modal-window");
    const lightboxOverlayEl = mountEl.querySelector(".ba-lightbox-overlay");

    if (filterSentinelEl && typeof IntersectionObserver === "function") {
      const stickyObserver = new IntersectionObserver(
        function (entries) {
          if (!entries || !entries.length) return;
          const entry = entries[0];
          const topThreshold = entry.rootBounds ? (entry.rootBounds.top + 20) : 20;
          const stuck = !entry.isIntersecting && entry.boundingClientRect.top < topThreshold;
          filterEl.classList.toggle("is-stuck", stuck);
        },
        {
          root: opts.isEditor ? (mountEl.parentElement || null) : null,
          threshold: 0
        }
      );
      stickyObserver.observe(filterSentinelEl);
    }

    function applySiteTheme() {
      const site = data.site || {};
      const accent = /^#[0-9A-Fa-f]{6}$/.test(site.accentColor) ? site.accentColor : "#00AEFF";
      rootEl.style.setProperty("--ba-accent", accent);
      rootEl.style.setProperty("--ba-accent-rgb", hexToRgbString(accent));
      rootEl.style.setProperty("--ba-accent-text", getContrastTextColor(accent));
      rootEl.setAttribute("data-pattern", site.bgPattern || "grid");
    }

    function renderHeader() {
      const site = data.site || {};
      const total = (data.characters || []).length;
      const counterLabelText = site.counterLabel != null ? String(site.counterLabel) : "キャラクター総数";
      const hasBadge = Boolean(site.badgeText && String(site.badgeText).trim());
      function buildHeaderLinkHtml(rawUrl, rawLabel, fallbackLabel, iconPath) {
        const safeUrl = sanitizeDetailUrl(rawUrl);
        if (!safeUrl) return "";
        const labelText = (rawLabel != null && String(rawLabel).trim()) ? String(rawLabel).trim() : fallbackLabel;
        const isExternal = /^https?:\/\//i.test(safeUrl);
        const openInNewTab = isExternal || Boolean(opts.isEditor);
        const arrowPath = isExternal ? "M7 17L17 7M9 7h8v8" : "M5 12h14M13 6l6 6-6 6";
        return '<a class="ba-home-link" href="' + escHtml(safeUrl) + '"' + (openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
            '<span class="ba-home-link-inner">' +
              '<svg class="ba-home-link-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="' + iconPath + '"/></svg>' +
              '<span>' + escHtml(labelText) + '</span>' +
              '<svg class="ba-home-link-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="' + arrowPath + '"/></svg>' +
            '</span>' +
          '</a>';
      }
      const homeLinkHtml = buildHeaderLinkHtml(
        site.homeUrl,
        site.homeLabel,
        "トップページへ",
        "M3 10.5L12 3l9 7.5M5 9.5V20h5v-6h4v6h5V9.5"
      );
      const homeLink2Html = buildHeaderLinkHtml(
        site.homeUrl2,
        site.homeLabel2,
        "関連リンク",
        "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      );
      const badgeRowHtml = (hasBadge || homeLinkHtml || homeLink2Html)
        ? '<div class="ba-badge-wrap">' +
            (hasBadge ? '<div class="ba-badge"><span>' + escHtml(site.badgeText) + '</span></div>' : '') +
            homeLinkHtml +
            homeLink2Html +
          '</div>'
        : '';
      headerEl.innerHTML =
        '<div class="ba-header-inner">' +
          '<div>' +
            badgeRowHtml +
            '<h1 class="ba-title">' + escHtml((site.title && site.title.trim()) ? site.title : "キャラクターアーカイブ") + '</h1>' +
            (site.subtitle ? '<p class="ba-subtitle">' + escHtml(site.subtitle) + '</p>' : '') +
          '</div>' +
          '<div class="ba-header-meta">' +
            '<div class="ba-counter-box">' +
              (counterLabelText.trim() ? '<div class="ba-counter-label">' + escHtml(counterLabelText) + '</div>' : '') +
              '<div class="ba-counter-value">' + String(total).padStart(2, "0") + '<small>名</small></div>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    function ensureFilterPanelSkeleton() {
      if (filterEl.querySelector(".ba-search-input")) return;
      filterEl.innerHTML =
        '<div class="ba-filter-top">' +
          '<div class="ba-search-wrap">' +
            '<svg class="ba-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="M20 20l-3.5-3.5"/></svg>' +
            '<input type="text" class="ba-search-input" placeholder="検索ワードを入力" value="" aria-label="キャラクター検索" />' +
            '<button type="button" class="ba-search-clear" title="検索をクリア" aria-label="検索をクリア" hidden>×</button>' +
          '</div>' +
          '<div class="ba-filter-controls">' +
            '<div class="ba-logic-toggle" role="group" aria-label="複数カテゴリの一致条件">' +
              '<button type="button" class="ba-logic-btn" data-logic="OR" title="いずれかのカテゴリに一致 (OR)">OR</button>' +
              '<button type="button" class="ba-logic-btn" data-logic="AND" title="すべてのカテゴリに一致 (AND)">AND</button>' +
            '</div>' +
            '<div class="ba-sort-toggle" role="group" aria-label="表示順の切り替え">' +
              '<button type="button" class="ba-sort-btn" data-sort="desc" title="登録が新しい順（降順）">降順</button>' +
              '<button type="button" class="ba-sort-btn" data-sort="asc" title="登録順（昇順）">昇順</button>' +
            '</div>' +
            '<div class="ba-view-toggle" role="group" aria-label="表示密度の切り替え">' +
              '<button type="button" class="ba-view-btn" data-view-mode="grid" title="標準グリッド表示" aria-label="標準グリッド表示">' +
                '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1"/><rect x="9" y="9" width="5.5" height="5.5" rx="1"/></svg>' +
                '<span class="ba-view-btn-label">標準</span>' +
              '</button>' +
              '<button type="button" class="ba-view-btn" data-view-mode="compact" title="コンパクトアイコン表示" aria-label="コンパクトアイコン表示">' +
                '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="1" y="1" width="3.6" height="3.6" rx="0.8"/><rect x="6.2" y="1" width="3.6" height="3.6" rx="0.8"/><rect x="11.4" y="1" width="3.6" height="3.6" rx="0.8"/><rect x="1" y="6.2" width="3.6" height="3.6" rx="0.8"/><rect x="6.2" y="6.2" width="3.6" height="3.6" rx="0.8"/><rect x="11.4" y="6.2" width="3.6" height="3.6" rx="0.8"/><rect x="1" y="11.4" width="3.6" height="3.6" rx="0.8"/><rect x="6.2" y="11.4" width="3.6" height="3.6" rx="0.8"/><rect x="11.4" y="11.4" width="3.6" height="3.6" rx="0.8"/></svg>' +
                '<span class="ba-view-btn-label">アイコン</span>' +
              '</button>' +
              '<button type="button" class="ba-view-btn" data-view-mode="list" title="リスト表示" aria-label="リスト表示">' +
                '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="1.5" y="2" width="3" height="3" rx="0.7"/><rect x="6" y="2.5" width="8.5" height="2" rx="0.7"/><rect x="1.5" y="6.5" width="3" height="3" rx="0.7"/><rect x="6" y="7" width="8.5" height="2" rx="0.7"/><rect x="1.5" y="11" width="3" height="3" rx="0.7"/><rect x="6" y="11.5" width="8.5" height="2" rx="0.7"/></svg>' +
                '<span class="ba-view-btn-label">リスト</span>' +
              '</button>' +
            '</div>' +
            '<div class="ba-result-count"></div>' +
          '</div>' +
        '</div>' +
        '<div class="ba-attr-bar"></div>';
    }

    function renderFilterPanel() {
      ensureFilterPanelSkeleton();

      // 存在しない属性IDが選択状態に残っていたら除去
      const attrMap = getAttributeMap();
      viewState.selectedAttrIds = viewState.selectedAttrIds.filter(function (id) {
        return Boolean(attrMap[id]);
      });

      const filtered = getFilteredCharacters();
      const total = (data.characters || []).length;
      const allActive = viewState.selectedAttrIds.length === 0;

      const categories = Array.isArray(data.attributeCategories) && data.attributeCategories.length > 0
        ? data.attributeCategories
        : null;

      function renderAttrBtn(attr) {
        const isActive = viewState.selectedAttrIds.indexOf(attr.id) !== -1;
        const c = /^#[0-9A-Fa-f]{6}$/.test(attr.color) ? attr.color : "#00AEFF";
        const tc = getContrastTextColor(c);
        return '<button type="button" class="ba-attr-btn ' + (isActive ? "is-active" : "") + '" data-attr-id="' + escHtml(attr.id) + '" aria-pressed="' + (isActive ? "true" : "false") + '" style="--btn-color:' + c + ';--btn-text:' + tc + '">' +
          '<span class="ba-attr-dot"></span>' +
          '<span>' + escHtml(attr.name) + '</span>' +
        '</button>';
      }

      function renderActiveFiltersBar() {
        if (viewState.selectedAttrIds.length === 0) return "";
        const selectedAttrs = getOrderedCharAttrs({ attributeIds: viewState.selectedAttrIds });
        if (!selectedAttrs.length) return "";
        const chipsHtml = selectedAttrs.map(function (attr) {
          const c = /^#[0-9A-Fa-f]{6}$/.test(attr.color) ? attr.color : "#00AEFF";
          const tc = getContrastTextColor(c);
          return '<button type="button" class="ba-active-chip" data-attr-id="' + escHtml(attr.id) + '" style="--chip-color:' + c + ';--chip-text:' + tc + '" title="クリックして解除">' +
            '<span>' + escHtml(attr.name) + '</span>' +
            '<span class="ba-active-chip-x" aria-hidden="true">×</span>' +
          '</button>';
        }).join("");
        return '<div class="ba-active-filters" aria-label="選択中の絞り込み条件">' +
          '<span class="ba-active-filters-label">選択中:</span>' +
          chipsHtml +
          '<button type="button" class="ba-active-clear" data-attr-id="__ALL__">すべて解除</button>' +
        '</div>';
      }

      const structureParts = [];
      let attrBarHtml = "";
      if (categories) {
        const catIdSet = {};
        categories.forEach(function (cat) { catIdSet[cat.id] = true; });
        const fallbackCatId = categories[0].id;
        const grouped = {};
        categories.forEach(function (cat) { grouped[cat.id] = []; });
        (data.attributes || []).forEach(function (attr) {
          const cid = (attr.categoryId && catIdSet[attr.categoryId]) ? attr.categoryId : fallbackCatId;
          grouped[cid].push(attr);
        });

        const nonEmptyCats = categories.filter(function (cat) {
          return (grouped[cat.id] || []).length > 0;
        });

        if (nonEmptyCats.length > 0) {
          if (viewState.activeCatTabId && viewState.activeCatTabId !== "__CLOSED__") {
            const exists = nonEmptyCats.some(function (cat) { return cat.id === viewState.activeCatTabId; });
            if (!exists) {
              viewState.activeCatTabId = "__CLOSED__";
            }
          } else {
            viewState.activeCatTabId = "__CLOSED__";
          }
        } else {
          viewState.activeCatTabId = "__CLOSED__";
        }

        let tabsHtml =
          '<button type="button" class="ba-cat-tab is-all ' + (allActive ? "is-active" : "") + '" data-attr-id="__ALL__" aria-pressed="' + (allActive ? "true" : "false") + '">' +
            '<span>すべて</span>' +
          '</button>';
        let activeTrayHtml = "";

        nonEmptyCats.forEach(function (cat) {
          const list = grouped[cat.id] || [];
          const catTitle = (cat.name && cat.name.trim()) ? cat.name : "大カテゴリ";
          let selInCat = 0;
          list.forEach(function (a) {
            if (viewState.selectedAttrIds.indexOf(a.id) !== -1) selInCat++;
          });
          const isOpen = viewState.activeCatTabId === cat.id;
          const badgeText = selInCat > 0 ? (selInCat + "/" + list.length) : String(list.length);
          structureParts.push(cat.id + ":" + catTitle + ":" + selInCat + "=" + list.map(function (a) { return a.id + "|" + a.name + "|" + a.color; }).join(","));

          tabsHtml +=
            '<button type="button" class="ba-cat-tab ' + (isOpen ? "is-open " : "") + (selInCat > 0 ? "has-selected" : "") + '" data-cat-tab="' + escHtml(cat.id) + '" aria-expanded="' + (isOpen ? "true" : "false") + '">' +
              '<span>' + escHtml(catTitle) + '</span>' +
              '<span class="ba-cat-tab-badge">' + escHtml(badgeText) + '</span>' +
              '<span class="ba-cat-tab-chevron" aria-hidden="true">▾</span>' +
            '</button>';

          if (isOpen) {
            activeTrayHtml =
              '<div class="ba-cat-tray" role="region" aria-label="' + escHtml(catTitle) + 'の小カテゴリ">' +
                list.map(renderAttrBtn).join("") +
              '</div>';
          }
        });

        attrBarHtml =
          '<div class="ba-cat-tabs" role="group" aria-label="大カテゴリ切り替え">' + tabsHtml + '</div>' +
          activeTrayHtml +
          renderActiveFiltersBar();
      } else {
        let flatHtml =
          '<button type="button" class="ba-attr-btn is-all ' + (allActive ? "is-active" : "") + '" data-attr-id="__ALL__" aria-pressed="' + (allActive ? "true" : "false") + '">' +
            '<span>すべて</span>' +
          '</button>';
        (data.attributes || []).forEach(function (attr) {
          structureParts.push(attr.id + "|" + attr.name + "|" + attr.color);
          flatHtml += renderAttrBtn(attr);
        });
        attrBarHtml = '<div class="ba-cat-tabs">' + flatHtml + '</div>' + renderActiveFiltersBar();
      }

      // <input> 自体は破棄せず、クリア/リセット等のプログラム変更時のみ値を同期（IME入力中断を防止）
      const searchInput = filterEl.querySelector(".ba-search-input");
      if (searchInput && searchInput.value !== viewState.searchQuery) {
        searchInput.value = viewState.searchQuery;
      }
      const clearBtn = filterEl.querySelector(".ba-search-clear");
      if (clearBtn) {
        clearBtn.hidden = !viewState.searchQuery;
      }

      filterEl.querySelectorAll(".ba-logic-btn").forEach(function (btn) {
        const isActive = (btn.getAttribute("data-logic") || "OR") === viewState.filterLogic;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      });

      filterEl.querySelectorAll(".ba-sort-btn").forEach(function (btn) {
        const isActive = (btn.getAttribute("data-sort") || "desc") === viewState.sortOrder;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      });

      filterEl.querySelectorAll(".ba-view-btn").forEach(function (btn) {
        const isActive = (btn.getAttribute("data-view-mode") || "grid") === viewState.viewMode;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      });

      const countEl = filterEl.querySelector(".ba-result-count");
      if (countEl) {
        countEl.innerHTML = '表示: <strong>' + filtered.length + '</strong> / ' + total + ' 名';
      }

      const attrBarEl = filterEl.querySelector(".ba-attr-bar");
      if (attrBarEl) {
        const nextKey = String(viewState.activeCatTabId || "") + "##" + viewState.selectedAttrIds.join(",") + "##" + structureParts.join(";;");
        if (lastAttrStructureKey !== nextKey || !attrBarEl.firstElementChild) {
          const activeEl = document.activeElement;
          let focusRestore = null;
          if (activeEl && attrBarEl.contains(activeEl)) {
            if (activeEl.hasAttribute("data-cat-tab")) {
              focusRestore = { kind: "catTab", val: activeEl.getAttribute("data-cat-tab") };
            } else if (activeEl.classList.contains("ba-active-chip")) {
              const prevChips = Array.prototype.slice.call(attrBarEl.querySelectorAll(".ba-active-chip"));
              focusRestore = { kind: "activeChip", idx: Math.max(0, prevChips.indexOf(activeEl)) };
            } else if (activeEl.classList.contains("ba-active-clear")) {
              focusRestore = { kind: "activeClear" };
            } else if (activeEl.classList.contains("ba-attr-btn") || activeEl.classList.contains("ba-cat-tab")) {
              focusRestore = { kind: "attrBtn", val: activeEl.getAttribute("data-attr-id") };
            }
          }
          lastAttrStructureKey = nextKey;
          attrBarEl.innerHTML = attrBarHtml;
          if (focusRestore) {
            let matched = null;
            if (focusRestore.kind === "catTab" && focusRestore.val) {
              matched = Array.prototype.find.call(attrBarEl.querySelectorAll("[data-cat-tab]"), function (b) {
                return b.getAttribute("data-cat-tab") === focusRestore.val;
              });
            } else if (focusRestore.kind === "activeChip") {
              const nextChips = attrBarEl.querySelectorAll(".ba-active-chip");
              if (nextChips.length > 0) {
                matched = nextChips[Math.min(focusRestore.idx, nextChips.length - 1)];
              } else {
                matched = attrBarEl.querySelector('[data-attr-id="__ALL__"]');
              }
            } else if (focusRestore.kind === "activeClear") {
              matched = attrBarEl.querySelector('[data-attr-id="__ALL__"]');
            } else if (focusRestore.kind === "attrBtn" && focusRestore.val) {
              matched = Array.prototype.find.call(attrBarEl.querySelectorAll(".ba-attr-btn, .ba-cat-tab[data-attr-id]"), function (b) {
                return b.getAttribute("data-attr-id") === focusRestore.val;
              });
            }
            if (matched) {
              try { matched.focus({ preventScroll: true }); } catch (e) {}
            }
          }
        }
      }
    }

    function renderGrid() {
      const filtered = getFilteredAndSortedCharacters();
      const attrMap = getAttributeMap();

      const totalChars = (data.characters || []).length;
      if (filtered.length === 0) {
        if (totalChars === 0) {
          gridAreaEl.innerHTML =
            '<div class="ba-empty">' +
              '<p class="ba-empty-title">キャラクターが登録されていません</p>' +
              '<p style="margin:0;font-size:13px;">' +
                (opts.isEditor ? '左サイドバーの「＋ 新規キャラ」からキャラクターを追加してください。' : '現在表示できるキャラクターデータがありません。') +
              '</p>' +
            '</div>';
          return;
        }
        gridAreaEl.innerHTML =
          '<div class="ba-empty">' +
            '<p class="ba-empty-title">条件に一致するキャラクターが見つかりません</p>' +
            '<p style="margin:0;font-size:13px;">選択中のカテゴリや検索キーワードを変更してみてください。</p>' +
            ((viewState.selectedAttrIds.length > 0 || viewState.searchQuery)
              ? '<button type="button" class="ba-empty-btn" data-reset-filter="1">絞り込みをすべて解除</button>'
              : '') +
          '</div>';
        return;
      }

      const registeredIndexMap = {};
      (data.characters || []).forEach(function (c, i) {
        registeredIndexMap[c.id] = i + 1;
      });

      const viewMode = (viewState.viewMode === "compact" || viewState.viewMode === "list") ? viewState.viewMode : "grid";
      let cardsHtml = '<div class="ba-grid is-view-' + viewMode + '">';
      filtered.forEach(function (ch, idx) {
        const regNo = registeredIndexMap[ch.id] || (idx + 1);
        const noText = "NO." + String(regNo).padStart(2, "0");
        const color = /^#[0-9A-Fa-f]{6}$/.test(ch.themeColor) ? ch.themeColor : "#00AEFF";
        const rawIcon = (ch.iconUrl && ch.iconUrl.trim()) ? ch.iconUrl.trim() : "";
        const imgSrc = rawIcon || getFallbackAvatar(ch.name, color);
        const fallback = getFallbackAvatar(ch.name, color);
        const charTitle = ch.name || "名称未設定";

        let tagsHtml = "";
        if (viewMode !== "compact") {
          getOrderedCharAttrs(ch).forEach(function (attr) {
            const tc = /^#[0-9A-Fa-f]{6}$/.test(attr.color) ? attr.color : "#64748B";
            tagsHtml += '<span class="ba-tag-pill" style="--tag-color:' + tc + ';--tag-text:' + getContrastTextColor(tc) + '">' + escHtml(attr.name) + '</span>';
          });
        }

        const thumbHtml =
          '<span class="ba-card-thumb">' +
            '<span class="ba-card-thumb-frame">' +
              '<img src="' + escHtml(imgSrc) + '" alt="' + escHtml(charTitle) + '" loading="lazy" onerror="this.onerror=null;this.src=\'' + escHtml(fallback) + '\';" />' +
            '</span>' +
          '</span>';

        let bodyHtml = "";
        if (viewMode === "compact") {
          bodyHtml =
            '<span class="ba-card-body">' +
              '<span class="ba-card-name">' + escHtml(charTitle) + '</span>' +
            '</span>';
        } else if (viewMode === "list") {
          const catchHtml = (ch.catchphrase && ch.catchphrase.trim())
            ? '<span class="ba-card-catch">' + escHtml(ch.catchphrase) + '</span>'
            : '';
          bodyHtml =
            '<span class="ba-card-body">' +
              '<span class="ba-card-list-main">' +
                '<span class="ba-card-meta-row">' +
                  '<span class="ba-card-no">' + escHtml(noText) + '</span>' +
                  (ch.subName ? '<span class="ba-card-sub">' + escHtml(ch.subName) + '</span>' : '') +
                '</span>' +
                '<span class="ba-card-name">' + escHtml(charTitle) + '</span>' +
                catchHtml +
              '</span>' +
              (tagsHtml ? '<span class="ba-card-tags">' + tagsHtml + '</span>' : '') +
            '</span>';
        } else {
          bodyHtml =
            '<span class="ba-card-body">' +
              '<span class="ba-card-meta-row">' +
                '<span class="ba-card-no">' + escHtml(noText) + '</span>' +
                (ch.subName ? '<span class="ba-card-sub">' + escHtml(ch.subName) + '</span>' : '') +
              '</span>' +
              '<span class="ba-card-name">' + escHtml(charTitle) + '</span>' +
              (tagsHtml ? '<span class="ba-card-tags">' + tagsHtml + '</span>' : '') +
            '</span>';
        }

        cardsHtml +=
          '<button type="button" class="ba-card" data-char-id="' + escHtml(ch.id) + '" style="--char-color:' + color + '" title="' + escHtml(noText + " " + charTitle) + '">' +
            thumbHtml +
            bodyHtml +
          '</button>';
      });
      cardsHtml += '</div>';
      gridAreaEl.innerHTML = cardsHtml;
    }

    function renderFooter() {
      const site = data.site || {};
      const footerLeft = site.footerText != null ? String(site.footerText) : "";
      const footerCredit = site.footerCredit != null
        ? String(site.footerCredit)
        : "CHARACTER ARCHIVE SYSTEM（Powered by しーさいど）";
      const hasLeft = Boolean(footerLeft.trim());
      const hasCredit = Boolean(footerCredit.trim());
      footerEl.hidden = !hasLeft && !hasCredit;
      footerEl.innerHTML =
        '<span>' + escHtml(footerLeft) + '</span>' +
        (hasCredit ? '<span class="ba-footer-accent">' + escHtml(footerCredit) + '</span>' : '');
    }

    function getModalNavContext() {
      const filtered = getFilteredAndSortedCharacters();
      const allChars = data.characters || [];
      let list = filtered;
      let idx = list.findIndex(function (c) { return c.id === viewState.modalCharId; });
      if (idx === -1) {
        list = viewState.sortOrder === "desc" ? allChars.slice().reverse() : allChars;
        idx = list.findIndex(function (c) { return c.id === viewState.modalCharId; });
      }
      return { list: list, idx: idx };
    }

    let lastRenderedModalCharId = null;
    let lastFocusBeforeModal = null;
    let lastFocusBeforeLightbox = null;
    let scrollLocked = false;
    let prevScrollOverflow = "";
    const scrollLockTarget = opts.isEditor ? (mountEl.parentElement || document.body) : document.body;

    function closeLightbox(restoreFocus) {
      if (!viewState.lightboxOpen && !lightboxOverlayEl.classList.contains("is-open")) return;
      viewState.lightboxOpen = false;
      lightboxOverlayEl.classList.remove("is-open");
      lightboxOverlayEl.setAttribute("aria-hidden", "true");
      lightboxOverlayEl.setAttribute("inert", "");
      if (restoreFocus && lastFocusBeforeLightbox && typeof lastFocusBeforeLightbox.focus === "function" && document.contains(lastFocusBeforeLightbox)) {
        try { lastFocusBeforeLightbox.focus({ preventScroll: true }); } catch (e) {}
      }
      lastFocusBeforeLightbox = null;
    }

    function renderLightbox() {
      if (!viewState.lightboxOpen || !viewState.modalCharId) {
        closeLightbox(false);
        return;
      }
      const navCtx = getModalNavContext();
      const ch = navCtx.list[navCtx.idx];
      if (!ch) {
        closeLightbox(false);
        return;
      }
      const site = data.site || {};
      const color = /^#[0-9A-Fa-f]{6}$/.test(ch.themeColor) ? ch.themeColor : "#00AEFF";
      const rawIcon = (ch.iconUrl && ch.iconUrl.trim()) ? ch.iconUrl.trim() : "";
      const rawStanding = (ch.standingUrl && ch.standingUrl.trim()) ? ch.standingUrl.trim() : "";
      const rawStanding2 = (ch.standingUrl2 && ch.standingUrl2.trim()) ? ch.standingUrl2.trim() : "";
      const showTabs = Boolean(rawStanding && rawStanding2);
      const activeTab = (showTabs && viewState.modalImageTab === 2) ? 2 : 1;
      const artSrc = showTabs
        ? (activeTab === 2 ? rawStanding2 : rawStanding)
        : (rawStanding || rawStanding2 || rawIcon || getFallbackAvatar(ch.name, color));
      const fallback = getFallbackAvatar(ch.name, color);
      const charDisplayName = ch.name || "名称未設定";
      const tab1Fallback = (site.imageTab1Label && site.imageTab1Label.trim()) ? site.imageTab1Label : "画像1";
      const tab2Fallback = (site.imageTab2Label && site.imageTab2Label.trim()) ? site.imageTab2Label : "画像2";
      const tab1Label = (ch.standingTab1Label && ch.standingTab1Label.trim()) ? ch.standingTab1Label : tab1Fallback;
      const tab2Label = (ch.standingTab2Label && ch.standingTab2Label.trim()) ? ch.standingTab2Label : tab2Fallback;

      const tabsHtml = showTabs
        ? '<div class="ba-lightbox-tabs" role="tablist" aria-label="表示画像切り替え">' +
            '<button type="button" role="tab" aria-selected="' + (activeTab === 1 ? "true" : "false") + '" class="ba-lightbox-tab ' + (activeTab === 1 ? "is-active" : "") + '" data-lb-tab="1">' + escHtml(tab1Label) + '</button>' +
            '<button type="button" role="tab" aria-selected="' + (activeTab === 2 ? "true" : "false") + '" class="ba-lightbox-tab ' + (activeTab === 2 ? "is-active" : "") + '" data-lb-tab="2">' + escHtml(tab2Label) + '</button>' +
          '</div>'
        : '';

      const wasOpen = lightboxOverlayEl.classList.contains("is-open");
      let lbFocusKind = null;
      if (wasOpen && document.activeElement && lightboxOverlayEl.contains(document.activeElement)) {
        if (document.activeElement.hasAttribute("data-lb-tab")) {
          lbFocusKind = "tab";
        } else if (document.activeElement.classList.contains("ba-lightbox-close")) {
          lbFocusKind = "close";
        }
      }
      lightboxOverlayEl.style.setProperty("--lb-color", color);
      lightboxOverlayEl.style.setProperty("--lb-color-text", getContrastTextColor(color));
      lightboxOverlayEl.innerHTML =
        '<div class="ba-lightbox-topbar">' +
          '<div class="ba-lightbox-title">' + escHtml(charDisplayName) + '</div>' +
          '<div class="ba-lightbox-actions">' +
            tabsHtml +
            '<button type="button" class="ba-lightbox-close" data-close-lightbox="1" aria-label="全身表示を閉じる">×</button>' +
          '</div>' +
        '</div>' +
        '<div class="ba-lightbox-stage" data-close-lightbox="1">' +
          '<div class="ba-lightbox-frame">' +
            '<img class="ba-lightbox-img" src="' + escHtml(artSrc) + '" alt="' + escHtml(charDisplayName) + ' 全身画像" />' +
          '</div>' +
        '</div>' +
        '<div class="ba-lightbox-hint" data-close-lightbox="1">タップまたは × で閉じる</div>';

      const lbImg = lightboxOverlayEl.querySelector(".ba-lightbox-img");
      if (lbImg) {
        let triedIconFallback = (!rawStanding && !rawStanding2);
        lbImg.onerror = function () {
          if (!triedIconFallback && rawIcon && artSrc !== rawIcon) {
            triedIconFallback = true;
            lbImg.src = rawIcon;
            return;
          }
          lbImg.onerror = null;
          if (lbImg.getAttribute("src") !== fallback) {
            lbImg.src = fallback;
          }
        };
      }

      lightboxOverlayEl.removeAttribute("inert");
      lightboxOverlayEl.classList.add("is-open");
      lightboxOverlayEl.setAttribute("aria-hidden", "false");
      if (!wasOpen) {
        const closeBtn = lightboxOverlayEl.querySelector(".ba-lightbox-close");
        if (closeBtn) {
          try { closeBtn.focus({ preventScroll: true }); } catch (e) {}
        }
      } else if (lbFocusKind) {
        const target = (lbFocusKind === "tab" && showTabs)
          ? lightboxOverlayEl.querySelector('[data-lb-tab="' + String(activeTab) + '"]')
          : lightboxOverlayEl.querySelector(".ba-lightbox-close");
        if (target && typeof target.focus === "function") {
          try { target.focus({ preventScroll: true }); } catch (e) {}
        }
      }
    }

    function applyClosedModalState() {
      closeLightbox(false);
      lastRenderedModalCharId = null;
      modalOverlayEl.classList.remove("is-open");
      modalOverlayEl.setAttribute("aria-hidden", "true");
      modalOverlayEl.setAttribute("inert", "");
      if (scrollLocked && scrollLockTarget) {
        scrollLockTarget.style.overflow = prevScrollOverflow;
        scrollLocked = false;
      }
      if (lastFocusBeforeModal && typeof lastFocusBeforeModal.focus === "function" && document.contains(lastFocusBeforeModal)) {
        try { lastFocusBeforeModal.focus({ preventScroll: true }); } catch (e) {}
      }
      lastFocusBeforeModal = null;
    }

    function renderModal() {
      if (!viewState.modalCharId) {
        applyClosedModalState();
        return;
      }

      const navCtx = getModalNavContext();
      const listForNav = navCtx.list;
      const currentIdx = navCtx.idx;
      if (currentIdx === -1) {
        viewState.modalCharId = null;
        applyClosedModalState();
        return;
      }

      const ch = listForNav[currentIdx];
      const wasOpen = modalOverlayEl.classList.contains("is-open");
      const isSameChar = lastRenderedModalCharId === ch.id;
      if (!isSameChar || !viewState.lightboxOpen) {
        closeLightbox(false);
      } else {
        renderLightbox();
      }
      let focusedControl = null;
      if (wasOpen && document.activeElement && modalWindowEl.contains(document.activeElement)) {
        const actEl = document.activeElement;
        if (actEl.hasAttribute("data-stage-tab")) {
          focusedControl = { kind: "stageTab", tab: actEl.getAttribute("data-stage-tab") };
        } else if (actEl.hasAttribute("data-open-lightbox")) {
          focusedControl = { kind: "zoom" };
        } else if (actEl.hasAttribute("data-stage-detail-link")) {
          focusedControl = { kind: "detailLink" };
        } else if (actEl.hasAttribute("data-nav-dir")) {
          focusedControl = { kind: "nav", dir: actEl.getAttribute("data-nav-dir") };
        } else if (actEl.hasAttribute("data-close-modal")) {
          focusedControl = { kind: "close" };
        } else if (actEl.hasAttribute("data-edit-char")) {
          focusedControl = { kind: "edit" };
        }
      }
      const prevInfoEl = modalWindowEl.querySelector(".ba-modal-info");
      const prevBodyEl = modalWindowEl.querySelector(".ba-modal-body");
      const prevInfoScrollTop = (isSameChar && prevInfoEl) ? prevInfoEl.scrollTop : 0;
      const prevBodyScrollTop = (isSameChar && prevBodyEl) ? prevBodyEl.scrollTop : 0;

      if (!wasOpen) {
        lastFocusBeforeModal = document.activeElement;
        if (!scrollLocked && scrollLockTarget) {
          prevScrollOverflow = scrollLockTarget.style.overflow;
          scrollLockTarget.style.overflow = "hidden";
          scrollLocked = true;
        }
      }

      const site = data.site || {};
      const color = /^#[0-9A-Fa-f]{6}$/.test(ch.themeColor) ? ch.themeColor : "#00AEFF";
      const rawIcon = (ch.iconUrl && ch.iconUrl.trim()) ? ch.iconUrl.trim() : "";
      const rawStanding = (ch.standingUrl && ch.standingUrl.trim()) ? ch.standingUrl.trim() : "";
      const rawStanding2 = (ch.standingUrl2 && ch.standingUrl2.trim()) ? ch.standingUrl2.trim() : "";
      const hasStanding = Boolean(rawStanding);
      const hasStanding2 = Boolean(rawStanding2);
      const showStageTabs = hasStanding && hasStanding2;
      const activeImgTab = (showStageTabs && viewState.modalImageTab === 2) ? 2 : 1;
      const artSrc = showStageTabs
        ? (activeImgTab === 2 ? rawStanding2 : rawStanding)
        : (rawStanding || rawStanding2 || rawIcon || getFallbackAvatar(ch.name, color));
      const useIconFallbackClass = !hasStanding && !hasStanding2;
      const fallback = getFallbackAvatar(ch.name, color);
      const scale1Pct = (typeof ch.standingScale1 === "number" && isFinite(ch.standingScale1))
        ? Math.min(250, Math.max(50, ch.standingScale1))
        : 100;
      const scale2Pct = (typeof ch.standingScale2 === "number" && isFinite(ch.standingScale2))
        ? Math.min(250, Math.max(50, ch.standingScale2))
        : 100;
      const isShowingImg2 = showStageTabs ? (activeImgTab === 2) : (!hasStanding && hasStanding2);
      const activeArtScale = useIconFallbackClass ? 1 : ((isShowingImg2 ? scale2Pct : scale1Pct) / 100);

      function formatNumberBySetting(num) {
        const fmt = site.modalNumberFormat != null ? String(site.modalNumberFormat) : "// {01}";
        if (!fmt.trim()) return "";
        if (/\{(0*1)\}/.test(fmt)) {
          return fmt.replace(/\{(0*1)\}/g, function (_, token) {
            return String(num).padStart(token.length, "0");
          }).trim();
        }
        return fmt.trim();
      }
      const allChars = data.characters || [];
      const regIdx = allChars.findIndex(function (c) { return c.id === ch.id; });
      const modalNumberText = formatNumberBySetting((regIdx !== -1 ? regIdx : currentIdx) + 1);
      const modalBigNumberText = modalNumberText.replace(/^\/\/\s*/, "");
      const modalPrefix = site.modalLabel != null ? String(site.modalLabel).trim() : "CHARACTER PROFILE";
      const modalTopLabelText = [modalPrefix, modalNumberText].filter(Boolean).join(" ");

      let tagsHtml = "";
      getOrderedCharAttrs(ch).forEach(function (attr) {
        const tc = /^#[0-9A-Fa-f]{6}$/.test(attr.color) ? attr.color : "#64748B";
        tagsHtml += '<span class="ba-tag-pill" style="--tag-color:' + tc + ';--tag-text:' + getContrastTextColor(tc) + '">' + escHtml(attr.name) + '</span>';
      });

      let specsHtml = "";
      const validSpecs = (ch.specs || []).filter(function (s) {
        return (s.label && s.label.trim()) || (s.value && s.value.trim());
      });
      const specLabelText = site.specSectionLabel != null ? String(site.specSectionLabel) : "SPECIFICATION // DATA";
      if (validSpecs.length > 0) {
        specsHtml =
          '<div>' +
            (specLabelText.trim() ? '<div class="ba-section-label">' + escHtml(specLabelText) + '</div>' : '') +
            '<div class="ba-specs-grid">' +
              validSpecs.map(function (s) {
                return '<div class="ba-spec-item">' +
                  '<div class="ba-spec-key">' + escHtml(s.label || "項目") + '</div>' +
                  '<div class="ba-spec-val">' + escHtml(s.value || "-") + '</div>' +
                '</div>';
              }).join("") +
            '</div>' +
          '</div>';
      }

      const prevChar = listForNav.length > 1 ? listForNav[(currentIdx - 1 + listForNav.length) % listForNav.length] : null;
      const nextChar = listForNav.length > 1 ? listForNav[(currentIdx + 1) % listForNav.length] : null;

      const showEditBtn = Boolean(opts.isEditor && opts.getIsEditMode && opts.getIsEditMode());

      const tab1Fallback = (site.imageTab1Label && site.imageTab1Label.trim()) ? site.imageTab1Label : "画像1";
      const tab2Fallback = (site.imageTab2Label && site.imageTab2Label.trim()) ? site.imageTab2Label : "画像2";
      const stageTabsHtml = showStageTabs
        ? '<div class="ba-stage-tabs" role="tablist" aria-label="表示画像切り替え">' +
            '<button type="button" role="tab" aria-selected="' + (activeImgTab === 1 ? "true" : "false") + '" class="ba-stage-tab ' + (activeImgTab === 1 ? "is-active" : "") + '" data-stage-tab="1">' +
              escHtml((ch.standingTab1Label && ch.standingTab1Label.trim()) ? ch.standingTab1Label : tab1Fallback) +
            '</button>' +
            '<button type="button" role="tab" aria-selected="' + (activeImgTab === 2 ? "true" : "false") + '" class="ba-stage-tab ' + (activeImgTab === 2 ? "is-active" : "") + '" data-stage-tab="2">' +
              escHtml((ch.standingTab2Label && ch.standingTab2Label.trim()) ? ch.standingTab2Label : tab2Fallback) +
            '</button>' +
          '</div>'
        : '';

      const safeDetailUrl = sanitizeDetailUrl(ch.detailUrl);
      const isExternalDetail = /^https?:\/\//i.test(safeDetailUrl);
      const openDetailInNewTab = isExternalDetail || Boolean(opts.isEditor);
      const detailArrowPath = isExternalDetail ? "M7 17L17 7M9 7h8v8" : "M5 12h14M13 6l6 6-6 6";
      const detailLabelFallback = (site.detailLinkLabel && site.detailLinkLabel.trim()) ? site.detailLinkLabel.trim() : "詳しい解説ページを見る";
      const detailLabelText = (ch.detailLabel && ch.detailLabel.trim()) ? ch.detailLabel.trim() : detailLabelFallback;
      const stageDetailLinkHtml = safeDetailUrl
        ? '<a class="ba-stage-detail-link" href="' + escHtml(safeDetailUrl) + '"' + (openDetailInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '') + ' data-stage-detail-link="1">' +
            '<span class="ba-stage-detail-dot" aria-hidden="true"></span>' +
            '<span class="ba-stage-detail-text">' + escHtml(detailLabelText) + '</span>' +
            '<svg class="ba-stage-detail-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="' + detailArrowPath + '"/></svg>' +
          '</a>'
        : '';

      const hasBio = Boolean(ch.bio && ch.bio.trim());
      const bioLabelText = site.bioSectionLabel != null ? String(site.bioSectionLabel) : "PROFILE // OVERVIEW";
      const bioHtml = hasBio
        ? '<div>' +
            (bioLabelText.trim() ? '<div class="ba-section-label">' + escHtml(bioLabelText) + '</div>' : '') +
            '<p class="ba-bio-text">' + escHtml(ch.bio) + '</p>' +
          '</div>'
        : '';

      const charDisplayName = ch.name || "名称未設定";
      modalWindowEl.style.setProperty("--modal-color", color);
      modalWindowEl.style.setProperty("--modal-color-text", getContrastTextColor(color));
      modalWindowEl.innerHTML =
        '<div class="ba-modal-topbar">' +
          (modalTopLabelText
            ? '<div class="ba-modal-top-label"><span class="ba-modal-top-dot"></span><span>' + escHtml(modalTopLabelText) + '</span></div>'
            : '<div class="ba-modal-top-label"></div>') +
          '<div class="ba-modal-top-actions">' +
            (showEditBtn
              ? '<button type="button" class="ba-modal-edit-btn" data-edit-char="' + escHtml(ch.id) + '">' +
                  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6.232-6.232a2.5 2.5 0 113.536 3.536L12.536 14.536a4 4 0 01-1.789 1.033L7 16.5l.931-3.747A4 4 0 019 11z"/></svg>' +
                  '<span>このキャラを編集</span>' +
                '</button>'
              : '') +
            '<button type="button" class="ba-modal-close" data-close-modal="1" aria-label="閉じる">×</button>' +
          '</div>' +
        '</div>' +
        '<div class="ba-modal-body">' +
          '<div class="ba-modal-stage">' +
            '<div class="ba-modal-stage-bg"></div>' +
            '<div class="ba-modal-stage-slash"></div>' +
            '<div class="ba-modal-stage-line"></div>' +
            '<img class="ba-modal-art ' + (useIconFallbackClass ? "is-icon-fallback" : "") + '" style="--art-scale:' + activeArtScale + '" src="' + escHtml(artSrc) + '" alt="' + escHtml(charDisplayName) + '" data-open-lightbox="1" title="クリック / タップで全身を表示" />' +
            '<div class="ba-stage-top-controls">' +
              stageTabsHtml +
              '<button type="button" class="ba-stage-zoom-btn" data-open-lightbox="1" title="全身を拡大表示" aria-label="全身を拡大表示">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path stroke-linecap="round" d="M20 20l-4-4M11 8v6M8 11h6"/></svg>' +
                '<span>全身</span>' +
              '</button>' +
            '</div>' +
            stageDetailLinkHtml +
          '</div>' +
          '<div class="ba-modal-info">' +
            '<div class="ba-profile-head">' +
              '<div class="ba-profile-head-row">' +
                '<div class="ba-profile-title-col">' +
                  (ch.subName ? '<div class="ba-profile-sub">' + escHtml(ch.subName) + '</div>' : '') +
                  '<h2 id="' + modalTitleId + '" class="ba-profile-name">' + escHtml(charDisplayName) + '</h2>' +
                '</div>' +
                (modalBigNumberText ? '<div class="ba-profile-big-num" aria-hidden="true">' + escHtml(modalBigNumberText) + '</div>' : '') +
              '</div>' +
              (tagsHtml ? '<div class="ba-profile-tags">' + tagsHtml + '</div>' : '') +
            '</div>' +
            (ch.catchphrase ? '<div class="ba-quote-box">' + escHtml(ch.catchphrase) + '</div>' : '') +
            specsHtml +
            bioHtml +
          '</div>' +
        '</div>' +
        '<div class="ba-modal-footer">' +
          '<button type="button" class="ba-nav-btn" data-nav-dir="prev" data-nav-id="' + (prevChar ? escHtml(prevChar.id) : "") + '" ' + (prevChar ? "" : "disabled") + '>' +
            '<span>←</span>' +
            '<span class="ba-nav-btn-text">' + (prevChar ? escHtml(prevChar.name || "名称未設定") : "前へ") + '</span>' +
          '</button>' +
          '<span class="ba-nav-pos">' + (currentIdx + 1) + ' / ' + listForNav.length + '</span>' +
          '<button type="button" class="ba-nav-btn" data-nav-dir="next" data-nav-id="' + (nextChar ? escHtml(nextChar.id) : "") + '" ' + (nextChar ? "" : "disabled") + '>' +
            '<span class="ba-nav-btn-text">' + (nextChar ? escHtml(nextChar.name || "名称未設定") : "次へ") + '</span>' +
            '<span>→</span>' +
          '</button>' +
        '</div>';

      const renderedArtImg = modalWindowEl.querySelector(".ba-modal-art");
      if (renderedArtImg) {
        let triedIconFallback = useIconFallbackClass;
        renderedArtImg.onerror = function () {
          renderedArtImg.style.setProperty("--art-scale", "1");
          renderedArtImg.classList.add("is-icon-fallback");
          if (!triedIconFallback && rawIcon && artSrc !== rawIcon) {
            triedIconFallback = true;
            renderedArtImg.src = rawIcon;
            return;
          }
          renderedArtImg.onerror = null;
          if (renderedArtImg.getAttribute("src") !== fallback) {
            renderedArtImg.src = fallback;
          }
        };
      }

      modalOverlayEl.removeAttribute("inert");
      modalOverlayEl.classList.add("is-open");
      modalOverlayEl.setAttribute("aria-hidden", "false");
      lastRenderedModalCharId = ch.id;

      if (prevInfoScrollTop > 0) {
        const nextInfoEl = modalWindowEl.querySelector(".ba-modal-info");
        if (nextInfoEl) nextInfoEl.scrollTop = prevInfoScrollTop;
      }
      if (prevBodyScrollTop > 0) {
        const nextBodyEl = modalWindowEl.querySelector(".ba-modal-body");
        if (nextBodyEl) nextBodyEl.scrollTop = prevBodyScrollTop;
      }
      if (!wasOpen) {
        const closeBtn = modalWindowEl.querySelector(".ba-modal-close");
        if (closeBtn) {
          try { closeBtn.focus({ preventScroll: true }); } catch (e) {}
        }
      } else if (focusedControl) {
        let restoreTarget = null;
        if (focusedControl.kind === "stageTab") {
          restoreTarget = modalWindowEl.querySelector('[data-stage-tab="' + String(activeImgTab) + '"]');
        } else if (focusedControl.kind === "zoom") {
          restoreTarget = modalWindowEl.querySelector(".ba-stage-zoom-btn");
        } else if (focusedControl.kind === "detailLink") {
          restoreTarget = modalWindowEl.querySelector("[data-stage-detail-link]");
        } else if (focusedControl.kind === "nav") {
          restoreTarget = modalWindowEl.querySelector('[data-nav-dir="' + focusedControl.dir + '"]:not([disabled])');
        } else if (focusedControl.kind === "close") {
          restoreTarget = modalWindowEl.querySelector("[data-close-modal]");
        } else if (focusedControl.kind === "edit") {
          restoreTarget = modalWindowEl.querySelector("[data-edit-char]");
        }
        if (restoreTarget && typeof restoreTarget.focus === "function") {
          try { restoreTarget.focus({ preventScroll: true }); } catch (e) {}
        }
      }
    }

    function updateModalStageImage(nextTab) {
      if (!viewState.modalCharId) return false;
      const navCtx = getModalNavContext();
      const ch = navCtx.list[navCtx.idx];
      if (!ch) return false;
      const rawStanding = (ch.standingUrl && ch.standingUrl.trim()) ? ch.standingUrl.trim() : "";
      const rawStanding2 = (ch.standingUrl2 && ch.standingUrl2.trim()) ? ch.standingUrl2.trim() : "";
      if (!rawStanding || !rawStanding2) return false;

      const resolvedTab = nextTab === 2 ? 2 : 1;
      viewState.modalImageTab = resolvedTab;

      const artImg = modalWindowEl.querySelector(".ba-modal-art");
      if (artImg) {
        const color = /^#[0-9A-Fa-f]{6}$/.test(ch.themeColor) ? ch.themeColor : "#00AEFF";
        const fallback = getFallbackAvatar(ch.name, color);
        const rawIcon = (ch.iconUrl && ch.iconUrl.trim()) ? ch.iconUrl.trim() : "";
        const nextSrc = resolvedTab === 2 ? rawStanding2 : rawStanding;
        let triedIconFallback = false;
        artImg.classList.remove("is-icon-fallback");
        artImg.onerror = function () {
          artImg.style.setProperty("--art-scale", "1");
          artImg.classList.add("is-icon-fallback");
          if (!triedIconFallback && rawIcon && nextSrc !== rawIcon) {
            triedIconFallback = true;
            artImg.src = rawIcon;
            return;
          }
          artImg.onerror = null;
          if (artImg.getAttribute("src") !== fallback) {
            artImg.src = fallback;
          }
        };
        const scalePct = resolvedTab === 2
          ? ((typeof ch.standingScale2 === "number" && isFinite(ch.standingScale2)) ? Math.min(250, Math.max(50, ch.standingScale2)) : 100)
          : ((typeof ch.standingScale1 === "number" && isFinite(ch.standingScale1)) ? Math.min(250, Math.max(50, ch.standingScale1)) : 100);
        artImg.style.setProperty("--art-scale", String(scalePct / 100));
        artImg.src = nextSrc;
      }
      modalWindowEl.querySelectorAll("[data-stage-tab]").forEach(function (tabBtn) {
        const isThis = parseInt(tabBtn.getAttribute("data-stage-tab"), 10) === resolvedTab;
        tabBtn.setAttribute("aria-selected", isThis ? "true" : "false");
        tabBtn.classList.toggle("is-active", isThis);
      });
      return true;
    }

    function updateModalArtScale() {
      if (!viewState.modalCharId) return;
      const artImg = modalWindowEl.querySelector(".ba-modal-art");
      if (!artImg || artImg.classList.contains("is-icon-fallback")) return;
      const navCtx = getModalNavContext();
      const ch = navCtx.list[navCtx.idx];
      if (!ch) return;
      const hasStanding = Boolean(ch.standingUrl && ch.standingUrl.trim());
      const hasStanding2 = Boolean(ch.standingUrl2 && ch.standingUrl2.trim());
      if (!hasStanding && !hasStanding2) return;
      const showStageTabs = hasStanding && hasStanding2;
      const activeImgTab = (showStageTabs && viewState.modalImageTab === 2) ? 2 : 1;
      const isShowingImg2 = showStageTabs ? (activeImgTab === 2) : (!hasStanding && hasStanding2);
      const scalePct = isShowingImg2
        ? ((typeof ch.standingScale2 === "number" && isFinite(ch.standingScale2)) ? Math.min(250, Math.max(50, ch.standingScale2)) : 100)
        : ((typeof ch.standingScale1 === "number" && isFinite(ch.standingScale1)) ? Math.min(250, Math.max(50, ch.standingScale1)) : 100);
      artImg.style.setProperty("--art-scale", String(scalePct / 100));
    }

    function renderAll() {
      applySiteTheme();
      renderHeader();
      renderFilterPanel();
      renderGrid();
      renderFooter();
      renderModal();
    }

    // イベント委譲：フィルター＆検索
    filterEl.addEventListener("click", function (e) {
      const catTabBtn = e.target.closest("[data-cat-tab]");
      if (catTabBtn) {
        const cid = catTabBtn.getAttribute("data-cat-tab");
        viewState.activeCatTabId = (viewState.activeCatTabId === cid) ? "__CLOSED__" : cid;
        renderFilterPanel();
        return;
      }

      const attrBtn = e.target.closest("[data-attr-id]");
      if (attrBtn) {
        const id = attrBtn.getAttribute("data-attr-id");
        if (id === "__ALL__") {
          viewState.selectedAttrIds = [];
        } else {
          const idx = viewState.selectedAttrIds.indexOf(id);
          if (idx === -1) {
            viewState.selectedAttrIds.push(id);
          } else {
            viewState.selectedAttrIds.splice(idx, 1);
          }
        }
        renderFilterPanel();
        renderGrid();
        return;
      }

      const logicBtn = e.target.closest(".ba-logic-btn");
      if (logicBtn) {
        viewState.filterLogic = logicBtn.getAttribute("data-logic") || "OR";
        renderFilterPanel();
        renderGrid();
        return;
      }

      const sortBtn = e.target.closest(".ba-sort-btn");
      if (sortBtn) {
        viewState.sortOrder = sortBtn.getAttribute("data-sort") === "asc" ? "asc" : "desc";
        renderFilterPanel();
        renderGrid();
        return;
      }

      const viewBtn = e.target.closest(".ba-view-btn");
      if (viewBtn) {
        const nextMode = viewBtn.getAttribute("data-view-mode");
        viewState.viewMode = (nextMode === "compact" || nextMode === "list") ? nextMode : "grid";
        renderFilterPanel();
        renderGrid();
        return;
      }

      if (e.target.closest(".ba-search-clear")) {
        viewState.searchQuery = "";
        renderFilterPanel();
        renderGrid();
        const inp = filterEl.querySelector(".ba-search-input");
        if (inp) inp.focus();
      }
    });

    filterEl.addEventListener("input", function (e) {
      if (e.target.classList.contains("ba-search-input")) {
        viewState.searchQuery = e.target.value;
        renderFilterPanel();
        renderGrid();
      }
    });

    // イベント委譲：キャラカードクリック・空状態リセット
    gridAreaEl.addEventListener("click", function (e) {
      const resetBtn = e.target.closest("[data-reset-filter]");
      if (resetBtn) {
        viewState.selectedAttrIds = [];
        viewState.searchQuery = "";
        renderFilterPanel();
        renderGrid();
        return;
      }

      const card = e.target.closest(".ba-card");
      if (card) {
        viewState.modalCharId = card.getAttribute("data-char-id");
        viewState.modalImageTab = 1;
        renderModal();
      }
    });

    // イベント委譲：モーダル内操作（ドラッグ選択で背景上で離した誤爆を防止）
    let mouseDownOnBackdrop = false;
    modalOverlayEl.addEventListener("mousedown", function (e) {
      mouseDownOnBackdrop = (e.target === modalOverlayEl);
    });

    modalOverlayEl.addEventListener("click", function (e) {
      if (e.target === modalOverlayEl) {
        const shouldClose = mouseDownOnBackdrop;
        mouseDownOnBackdrop = false;
        if (shouldClose) {
          viewState.modalCharId = null;
          renderModal();
        }
        return;
      }
      mouseDownOnBackdrop = false;

      if (e.target.closest("[data-close-modal]")) {
        viewState.modalCharId = null;
        renderModal();
        return;
      }

      const stageTabBtn = e.target.closest("[data-stage-tab]");
      if (stageTabBtn) {
        const nextTab = parseInt(stageTabBtn.getAttribute("data-stage-tab"), 10) === 2 ? 2 : 1;
        if (!updateModalStageImage(nextTab)) {
          viewState.modalImageTab = nextTab;
          renderModal();
        }
        return;
      }

      const navBtn = e.target.closest("[data-nav-id]");
      if (navBtn && !navBtn.disabled) {
        const targetId = navBtn.getAttribute("data-nav-id");
        if (targetId) {
          viewState.modalCharId = targetId;
          viewState.modalImageTab = 1;
          renderModal();
        }
        return;
      }

      const editBtn = e.target.closest("[data-edit-char]");
      if (editBtn && typeof opts.onEditCharacter === "function") {
        opts.onEditCharacter(editBtn.getAttribute("data-edit-char"));
        return;
      }

      const openLbTrigger = e.target.closest("[data-open-lightbox]");
      if (openLbTrigger) {
        const actEl = document.activeElement;
        if (openLbTrigger.tagName === "BUTTON") {
          lastFocusBeforeLightbox = openLbTrigger;
        } else if (actEl && actEl !== document.body && modalWindowEl.contains(actEl)) {
          lastFocusBeforeLightbox = actEl;
        } else {
          lastFocusBeforeLightbox = modalWindowEl.querySelector(".ba-stage-zoom-btn") || modalWindowEl.querySelector(".ba-modal-close");
        }
        viewState.lightboxOpen = true;
        renderLightbox();
      }
    });

    // イベント委譲：全身ライトボックス操作
    lightboxOverlayEl.addEventListener("click", function (e) {
      const lbTab = e.target.closest("[data-lb-tab]");
      if (lbTab) {
        const nextTab = parseInt(lbTab.getAttribute("data-lb-tab"), 10) === 2 ? 2 : 1;
        if (!updateModalStageImage(nextTab)) {
          viewState.modalImageTab = nextTab;
        }
        renderLightbox();
        const activeBtn = lightboxOverlayEl.querySelector('[data-lb-tab="' + String(nextTab) + '"]');
        if (activeBtn && typeof activeBtn.focus === "function") {
          try { activeBtn.focus({ preventScroll: true }); } catch (err) {}
        }
        return;
      }

      if (e.target === lightboxOverlayEl || e.target.closest("[data-close-lightbox]")) {
        closeLightbox(true);
      }
    });

    // キーボード操作（ESCで閉じる・左右キーで前後移動）
    function onKeyDown(e) {
      if (e.defaultPrevented || e.isComposing || e.keyCode === 229) return;
      if (!viewState.modalCharId) return;
      if (document.querySelector("dialog[open]")) return;
      const confirmModal = document.getElementById("studio-confirm-modal");
      if (confirmModal && (confirmModal.tagName === "DIALOG" ? Boolean(confirmModal.open) : !confirmModal.classList.contains("hidden"))) return;

      const activeEl = document.activeElement;
      if (viewState.lightboxOpen) {
        if (e.key === "Escape") {
          e.preventDefault();
          closeLightbox(true);
          return;
        }
        if (e.key === "Tab") {
          const lbFocusables = Array.prototype.slice.call(
            lightboxOverlayEl.querySelectorAll('button:not([disabled]), [tabindex]:not([tabindex="-1"])')
          ).filter(function (el) {
            return el.offsetParent !== null || el.getClientRects().length > 0;
          });
          if (lbFocusables.length > 0) {
            const firstLb = lbFocusables[0];
            const lastLb = lbFocusables[lbFocusables.length - 1];
            const inLb = Boolean(activeEl && lightboxOverlayEl.contains(activeEl));
            if (e.shiftKey) {
              if (!inLb || activeEl === firstLb) {
                e.preventDefault();
                lastLb.focus();
              }
            } else if (!inLb || activeEl === lastLb) {
              e.preventDefault();
              firstLb.focus();
            }
          } else {
            e.preventDefault();
          }
          return;
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          const lbTabs = lightboxOverlayEl.querySelectorAll("[data-lb-tab]");
          if (lbTabs.length === 2) {
            e.preventDefault();
            const nextTab = viewState.modalImageTab === 2 ? 1 : 2;
            if (!updateModalStageImage(nextTab)) {
              viewState.modalImageTab = nextTab;
            }
            renderLightbox();
            if (!document.activeElement || !lightboxOverlayEl.contains(document.activeElement)) {
              const fallbackBtn = lightboxOverlayEl.querySelector('[data-lb-tab="' + String(nextTab) + '"]') || lightboxOverlayEl.querySelector(".ba-lightbox-close");
              if (fallbackBtn && typeof fallbackBtn.focus === "function") {
                try { fallbackBtn.focus({ preventScroll: true }); } catch (err) {}
              }
            }
          }
        }
        return;
      }
      if (e.key === "Tab") {
        const isEditMode = Boolean(opts.isEditor && opts.getIsEditMode && opts.getIsEditMode());
        const focusInModal = Boolean(activeEl && modalWindowEl.contains(activeEl));
        if (!isEditMode || focusInModal) {
          const focusables = Array.prototype.slice.call(
            modalWindowEl.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
          ).filter(function (el) {
            return el.offsetParent !== null || el.getClientRects().length > 0;
          });
          if (focusables.length > 0) {
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey) {
              if (!focusInModal || activeEl === first) {
                e.preventDefault();
                last.focus();
              }
            } else if (!focusInModal || activeEl === last) {
              e.preventDefault();
              first.focus();
            }
          } else {
            e.preventDefault();
          }
        }
        return;
      }

      const tag = (activeEl && activeEl.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (activeEl && activeEl.isContentEditable)) {
        return;
      }

      if (e.key === "Escape") {
        viewState.modalCharId = null;
        renderModal();
      } else if (
        (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End") &&
        activeEl &&
        activeEl.getAttribute("role") === "tab" &&
        activeEl.hasAttribute("data-stage-tab") &&
        modalWindowEl.contains(activeEl)
      ) {
        e.preventDefault();
        let nextTab = viewState.modalImageTab === 2 ? 1 : 2;
        if (e.key === "Home") nextTab = 1;
        if (e.key === "End") nextTab = 2;
        if (!updateModalStageImage(nextTab)) {
          viewState.modalImageTab = nextTab;
          renderModal();
        }
        const targetTabBtn = modalWindowEl.querySelector('[data-stage-tab="' + String(nextTab) + '"]');
        if (targetTabBtn && typeof targetTabBtn.focus === "function") {
          try { targetTabBtn.focus({ preventScroll: true }); } catch (err) {}
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const isEditModeNav = Boolean(opts.isEditor && opts.getIsEditMode && opts.getIsEditMode());
        if (isEditModeNav && activeEl && activeEl !== document.body && !modalWindowEl.contains(activeEl)) {
          return;
        }
        const navCtx = getModalNavContext();
        const list = navCtx.list;
        const idx = navCtx.idx;
        if (list.length <= 1 || idx === -1) return;
        e.preventDefault();
        const nextIdx = e.key === "ArrowRight"
          ? (idx + 1) % list.length
          : (idx - 1 + list.length) % list.length;
        viewState.modalCharId = list[nextIdx].id;
        viewState.modalImageTab = 1;
        renderModal();
      }
    }
    document.addEventListener("keydown", onKeyDown);

    renderAll();

    return {
      updateData: function (newData, updateOpts) {
        data = newData;
        if (updateOpts && updateOpts.resetView) {
          viewState.selectedAttrIds = [];
          viewState.filterLogic = "OR";
          viewState.sortOrder = "desc";
          viewState.viewMode = resolveSiteDefaultViewMode(data.site);
          viewState.searchQuery = "";
          viewState.activeCatTabId = "__CLOSED__";
          viewState.modalCharId = null;
          viewState.modalImageTab = 1;
          viewState.lightboxOpen = false;
          renderAll();
          return;
        }
        const scope = updateOpts && updateOpts.scope;
        if (scope === "modalScale") {
          updateModalArtScale();
          return;
        }
        if (scope === "listAndModal") {
          if (viewState.viewMode === "list" || (viewState.searchQuery && viewState.searchQuery.trim())) {
            renderFilterPanel();
            renderGrid();
          }
          renderModal();
          return;
        }
        if (scope === "modalOnly") {
          if (viewState.searchQuery && viewState.searchQuery.trim()) {
            renderFilterPanel();
            renderGrid();
          }
          renderModal();
          return;
        }
        if (scope === "siteMeta") {
          applySiteTheme();
          renderHeader();
          renderFooter();
          return;
        }
        if (scope === "siteDefaultView") {
          viewState.viewMode = resolveSiteDefaultViewMode(data.site);
          renderFilterPanel();
          renderGrid();
          return;
        }
        renderAll();
      },
      resetViewState: function () {
        viewState.selectedAttrIds = [];
        viewState.filterLogic = "OR";
        viewState.sortOrder = "desc";
        viewState.viewMode = resolveSiteDefaultViewMode(data.site);
        viewState.searchQuery = "";
        viewState.activeCatTabId = "__CLOSED__";
        viewState.modalCharId = null;
        viewState.modalImageTab = 1;
        viewState.lightboxOpen = false;
        renderAll();
      },
      refreshModal: function () {
        renderModal();
      },
      openCharacter: function (charId) {
        closeLightbox(false);
        viewState.modalCharId = charId;
        viewState.modalImageTab = 1;
        renderModal();
      },
      closeModal: function () {
        viewState.modalCharId = null;
        viewState.lightboxOpen = false;
        renderModal();
      }
    };
  }

  global.CASViewer = {
    initArchiveViewer: initArchiveViewer
  };
})(window);
