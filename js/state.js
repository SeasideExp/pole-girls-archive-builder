/**
 * state.js
 * バージョン定数・アプリケーション状態管理・localStorage永続化・共通UIユーティリティ
 * 名前空間: window.CASState
 */
(function (global) {
  "use strict";

  const APP_VERSION = "Ver.0.51b";
  const APP_UPDATED_AT = "2026-11-20";
  const STORAGE_KEY = "char_archive_studio_project_v1";
  const COLOR_HISTORY_KEY = "char_archive_studio_color_history_v1";
  const MAX_COLOR_HISTORY = 12;

  let colorHistory = loadColorHistory();
  let initialLoadStatus = "default"; // "saved" | "default" | "corrupted"

  let projectData = loadInitialProject();
  const studioState = {
    mode: "edit", // "edit" | "preview"
    activeTab: "characters", // "characters" | "attributes" | "site"
    selectedCharId: projectData.characters[0] ? projectData.characters[0].id : null,
    mobileSidebarOpen: false,
    pendingImageTarget: null // { charId, field: "iconUrl" | "standingUrl" | "standingUrl2" }
  };

  let saveTimer = null;
  let quotaWarnShown = false;

  function getProjectData() {
    return projectData;
  }

  function setProjectData(nextData) {
    projectData = nextData;
    return projectData;
  }

  function generateId(prefix) {
    return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  }

  function sanitizeLinkUrl(raw) {
    const cleaned = typeof raw === "string"
      ? raw.replace(/[\u0000-\u001F\u007F]/g, "").trim()
      : "";
    if (!cleaned) return "";
    if (/^(?:\/\/|\\)/.test(cleaned)) return "";
    const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(cleaned);
    if (schemeMatch) {
      if (!/^https?:\/\/[^/\s\\]+/i.test(cleaned)) return "";
    }
    return cleaned;
  }

  function normalizeProjectData(raw) {
    const def = global.CASTemplates.createDefaultData();
    if (!raw || typeof raw !== "object") return def;

    function asStr(val, fallback) {
      return typeof val === "string" ? val : fallback;
    }
    function asTrimmedStr(val) {
      return typeof val === "string" ? val.trim() : "";
    }
    function asScalarStr(val, fallback) {
      if (typeof val === "string") return val;
      if (typeof val === "number" && isFinite(val)) return String(val);
      return fallback;
    }

    const rawSite = (raw.site && typeof raw.site === "object" && !Array.isArray(raw.site)) ? raw.site : {};
    const migrateTab1Default = typeof rawSite.imageTab1Label !== "string";
    const migrateTab2Default = typeof rawSite.imageTab2Label !== "string";
    const site = {
      title: asStr(rawSite.title, def.site.title),
      subtitle: asStr(rawSite.subtitle, def.site.subtitle),
      badgeText: asStr(rawSite.badgeText, def.site.badgeText),
      homeUrl: asTrimmedStr(rawSite.homeUrl),
      homeLabel: asStr(rawSite.homeLabel, def.site.homeLabel),
      homeUrl2: asTrimmedStr(rawSite.homeUrl2),
      homeLabel2: asStr(rawSite.homeLabel2, def.site.homeLabel2),
      counterLabel: asStr(rawSite.counterLabel, def.site.counterLabel),
      modalLabel: asStr(rawSite.modalLabel, def.site.modalLabel),
      modalNumberFormat: asStr(rawSite.modalNumberFormat, def.site.modalNumberFormat),
      specSectionLabel: asStr(rawSite.specSectionLabel, def.site.specSectionLabel),
      bioSectionLabel: asStr(rawSite.bioSectionLabel, def.site.bioSectionLabel),
      imageTab1Label: asStr(rawSite.imageTab1Label, def.site.imageTab1Label),
      imageTab2Label: asStr(rawSite.imageTab2Label, def.site.imageTab2Label),
      detailLinkLabel: asStr(rawSite.detailLinkLabel, def.site.detailLinkLabel),
      accentColor: (typeof rawSite.accentColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(rawSite.accentColor))
        ? rawSite.accentColor.toUpperCase()
        : def.site.accentColor,
      bgPattern: (rawSite.bgPattern === "grid" || rawSite.bgPattern === "dots" || rawSite.bgPattern === "stripes")
        ? rawSite.bgPattern
        : def.site.bgPattern,
      defaultViewMode: (rawSite.defaultViewMode === "grid" || rawSite.defaultViewMode === "compact" || rawSite.defaultViewMode === "list")
        ? rawSite.defaultViewMode
        : def.site.defaultViewMode,
      footerText: asStr(rawSite.footerText, def.site.footerText),
      footerCredit: asStr(rawSite.footerCredit, def.site.footerCredit)
    };

    function ensureUniqueId(rawId, prefix, seenSet) {
      let id = typeof rawId === "string" ? rawId.trim() : (typeof rawId === "number" && isFinite(rawId) ? String(rawId).trim() : "");
      if (!id || seenSet.has(id)) {
        do {
          id = generateId(prefix);
        } while (seenSet.has(id));
      }
      seenSet.add(id);
      return id;
    }

    const rawCategories = Array.isArray(raw.attributeCategories)
      ? raw.attributeCategories.filter(function (cat) { return cat && typeof cat === "object" && !Array.isArray(cat); })
      : [];
    const seenCatIds = new Set();
    const attributeCategories = rawCategories.length > 0
      ? rawCategories.map(function (cat, idx) {
          const catName = asScalarStr(cat.name, "");
          return {
            id: ensureUniqueId(cat.id, "cat", seenCatIds),
            name: catName.trim() ? catName : ("大カテゴリ" + String.fromCharCode(65 + (idx % 26)))
          };
        })
      : def.attributeCategories;

    const catIdSet = new Set(attributeCategories.map(function (cat) { return cat.id; }));
    const fallbackCatId = attributeCategories[0] ? attributeCategories[0].id : "cat_a";

    const seenAttrIds = new Set();
    const attributes = Array.isArray(raw.attributes)
      ? raw.attributes
          .filter(function (a) { return a && typeof a === "object" && !Array.isArray(a); })
          .map(function (a) {
            const attrName = asScalarStr(a.name, "");
            const rawCatId = asTrimmedStr(a.categoryId);
            return {
              id: ensureUniqueId(a.id, "attr", seenAttrIds),
              name: attrName.trim() ? attrName : "新規小カテゴリ",
              color: (typeof a.color === "string" && /^#[0-9A-Fa-f]{6}$/.test(a.color)) ? a.color.toUpperCase() : "#00AEFF",
              categoryId: (rawCatId && catIdSet.has(rawCatId)) ? rawCatId : fallbackCatId
            };
          })
      : def.attributes;

    const attrIdSet = new Set(attributes.map(function (a) { return a.id; }));

    const seenCharIds = new Set();
    const characters = Array.isArray(raw.characters)
      ? raw.characters
          .filter(function (c) { return c && typeof c === "object" && !Array.isArray(c); })
          .map(function (c) {
            const seenAttrIdsPerChar = new Set();
            const dedupAttrIds = [];
            if (Array.isArray(c.attributeIds)) {
              c.attributeIds.forEach(function (id) {
                const trimmed = typeof id === "string" ? id.trim() : "";
                if (!trimmed || !attrIdSet.has(trimmed) || seenAttrIdsPerChar.has(trimmed)) return;
                seenAttrIdsPerChar.add(trimmed);
                dedupAttrIds.push(trimmed);
              });
            }
            const rawName = asScalarStr(c.name, "");
            const rawTab1 = asStr(c.standingTab1Label, "");
            const rawTab2 = asStr(c.standingTab2Label, "");
            return {
              id: ensureUniqueId(c.id, "char", seenCharIds),
              name: rawName.trim() ? rawName : "名称未設定",
              subName: asScalarStr(c.subName, ""),
              catchphrase: asScalarStr(c.catchphrase, ""),
              themeColor: (typeof c.themeColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(c.themeColor)) ? c.themeColor.toUpperCase() : "#00AEFF",
              iconUrl: asTrimmedStr(c.iconUrl),
              standingUrl: asTrimmedStr(c.standingUrl),
              standingUrl2: asTrimmedStr(c.standingUrl2),
              standingTab1Label: (migrateTab1Default && rawTab1 === "画像1") ? "" : rawTab1,
              standingTab2Label: (migrateTab2Default && rawTab2 === "画像2") ? "" : rawTab2,
              standingScale1: (typeof c.standingScale1 === "number" && isFinite(c.standingScale1))
                ? Math.min(250, Math.max(50, Math.round(c.standingScale1)))
                : 100,
              standingScale2: (typeof c.standingScale2 === "number" && isFinite(c.standingScale2))
                ? Math.min(250, Math.max(50, Math.round(c.standingScale2)))
                : 100,
              detailUrl: asTrimmedStr(c.detailUrl),
              detailLabel: asStr(c.detailLabel, ""),
              attributeIds: dedupAttrIds,
              specs: Array.isArray(c.specs)
                ? c.specs
                    .filter(function (s) { return s && typeof s === "object" && !Array.isArray(s); })
                    .map(function (s) {
                      return {
                        label: asScalarStr(s.label, ""),
                        value: asScalarStr(s.value, "")
                      };
                    })
                : [],
              bio: asStr(c.bio, "")
            };
          })
      : def.characters;

    return { version: 1, site: site, attributeCategories: attributeCategories, attributes: attributes, characters: characters };
  }

  function loadInitialProject() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        initialLoadStatus = "saved";
        return normalizeProjectData(parsed);
      }
      initialLoadStatus = "default";
    } catch (err) {
      console.warn("localStorage読込失敗:", err);
      initialLoadStatus = "corrupted";
    }
    return global.CASTemplates.createDefaultData();
  }

  function getInitialLoadStatus() {
    return initialLoadStatus;
  }

  function cancelAutoSave() {
    clearTimeout(saveTimer);
    saveTimer = null;
    quotaWarnShown = false;
  }

  function persistProjectNow(silentOnQuota) {
    const statusEl = document.getElementById("autosave-status");
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projectData));
      quotaWarnShown = false;
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      if (statusEl) statusEl.textContent = "自動保存済み (" + hh + ":" + mm + ":" + ss + ")";
      return true;
    } catch (err) {
      if (statusEl) statusEl.textContent = "容量超過のため自動保存スキップ";
      if (!silentOnQuota && !quotaWarnShown) {
        quotaWarnShown = true;
        showToast("画像データが大きいためブラウザ自動保存をスキップしました。JSON保存やHTML書き出しで保存してください。", "warning");
      }
      return false;
    }
  }

  function flushAutoSave() {
    if (saveTimer === null) return false;
    clearTimeout(saveTimer);
    saveTimer = null;
    return persistProjectNow(true);
  }

  function scheduleAutoSave() {
    const statusEl = document.getElementById("autosave-status");
    if (statusEl) statusEl.textContent = "保存中...";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      saveTimer = null;
      persistProjectNow(false);
    }, 320);
  }

  function escapeHtmlText(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * トースト通知を表示する
   * @param {string} message
   * @param {"success"|"warning"|"error"|"info"} [type]
   */
  function showToast(message, type) {
    const container = document.getElementById("studio-toast-container");
    if (!container) return;
    const el = document.createElement("div");
    const colorClasses = {
      success: "bg-[#142238] text-white border-l-4 border-[#00AEFF]",
      warning: "bg-amber-950 text-amber-50 border-l-4 border-amber-400",
      error: "bg-rose-950 text-rose-50 border-l-4 border-rose-400",
      info: "bg-[#142238] text-white border-l-4 border-sky-400"
    };
    el.setAttribute("data-toast-type", type || "info");
    if (type === "error") {
      el.setAttribute("role", "alert");
    }
    el.className = "studio-toast pointer-events-auto toast-enter rounded-xl px-4 py-3 text-xs font-bold shadow-xl flex items-center justify-between gap-3 " + (colorClasses[type] || colorClasses.info);
    el.innerHTML =
      '<span class="leading-relaxed">' + escapeHtmlText(message) + '</span>' +
      '<button type="button" class="text-white/60 hover:text-white text-base leading-none" aria-label="通知を閉じる">&times;</button>';
    el.querySelector("button").addEventListener("click", function () {
      el.remove();
    });
    container.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) {
        el.style.transition = "opacity 0.25s ease";
        el.style.opacity = "0";
        setTimeout(function () { el.remove(); }, 250);
      }
    }, 3800);
  }

  let confirmDialogOpen = false;

  /**
   * カスタム確認ダイアログ（ネイティブ <dialog>・window.confirm代替）
   * @param {string} title
   * @param {string} message
   * @param {string} [okLabel]
   * @param {boolean} [isDanger]
   * @returns {Promise<boolean>}
   */
  function showConfirmDialog(title, message, okLabel, isDanger) {
    if (confirmDialogOpen) {
      return Promise.resolve(false);
    }
    return new Promise(function (resolve) {
      const modal = document.getElementById("studio-confirm-modal");
      const titleEl = document.getElementById("confirm-title");
      const msgEl = document.getElementById("confirm-message");
      const okBtn = document.getElementById("confirm-ok-btn");
      const cancelBtn = document.getElementById("confirm-cancel-btn");
      const iconWrap = document.getElementById("confirm-icon-wrap");
      if (!modal || !okBtn || !cancelBtn) {
        resolve(false);
        return;
      }
      if (modal.open) {
        resolve(false);
        return;
      }

      confirmDialogOpen = true;
      const lastFocusedEl = document.activeElement;

      titleEl.textContent = title;
      msgEl.textContent = message;
      okBtn.textContent = okLabel || "実行する";

      if (isDanger) {
        okBtn.className = "px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition";
        iconWrap.className = "flex-shrink-0 w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center";
      } else {
        okBtn.className = "px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#1289F6] hover:bg-[#0d77db] shadow-sm transition";
        iconWrap.className = "flex-shrink-0 w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center";
      }

      let settled = false;
      let mouseDownOnBackdrop = false;
      function cleanup(result) {
        if (settled) return;
        settled = true;
        confirmDialogOpen = false;
        okBtn.removeEventListener("click", onOk);
        cancelBtn.removeEventListener("click", onCancel);
        modal.removeEventListener("cancel", onDialogCancel);
        modal.removeEventListener("mousedown", onBackdropMouseDown);
        modal.removeEventListener("click", onBackdrop);
        if (typeof modal.close === "function" && modal.open) {
          modal.close();
        } else {
          modal.removeAttribute("open");
        }
        if (lastFocusedEl && typeof lastFocusedEl.focus === "function" && document.contains(lastFocusedEl)) {
          try { lastFocusedEl.focus({ preventScroll: true }); } catch (e) {}
        }
        resolve(result);
      }
      function onOk() { cleanup(true); }
      function onCancel() { cleanup(false); }
      function onDialogCancel(e) {
        e.preventDefault();
        cleanup(false);
      }
      function onBackdropMouseDown(e) {
        mouseDownOnBackdrop = (e.target === modal);
      }
      function onBackdrop(e) {
        const shouldClose = mouseDownOnBackdrop && (e.target === modal);
        mouseDownOnBackdrop = false;
        if (shouldClose) cleanup(false);
      }

      okBtn.addEventListener("click", onOk);
      cancelBtn.addEventListener("click", onCancel);
      modal.addEventListener("cancel", onDialogCancel);
      modal.addEventListener("mousedown", onBackdropMouseDown);
      modal.addEventListener("click", onBackdrop);

      if (typeof modal.showModal === "function") {
        modal.showModal();
      } else {
        modal.setAttribute("open", "");
      }
      cancelBtn.focus();
    });
  }

  let exportDialogOpen = false;

  /**
   * 公開HTML書き出し用のファイル名入力ダイアログを表示する（ネイティブ <dialog>）
   * @param {string} defaultBaseName
   * @param {function(string): string} sanitizeFn
   * @returns {Promise<string|null>}
   */
  function showExportFilenameDialog(defaultBaseName, sanitizeFn) {
    if (exportDialogOpen) {
      return Promise.resolve(null);
    }
    return new Promise(function (resolve) {
      const dialog = document.getElementById("studio-export-dialog");
      const form = document.getElementById("export-filename-form");
      const input = document.getElementById("export-filename-input");
      const preview = document.getElementById("export-filename-preview");
      const cancelBtn = document.getElementById("export-cancel-btn");

      if (!dialog || !form || !input) {
        resolve(defaultBaseName);
        return;
      }
      if (dialog.open) {
        resolve(null);
        return;
      }

      exportDialogOpen = true;
      const lastFocusedEl = document.activeElement;
      const safeDefault = sanitizeFn(defaultBaseName, "pole-girls-archive");
      input.value = safeDefault;

      function updatePreview() {
        if (!preview) return;
        const resolved = sanitizeFn(input.value, "pole-girls-archive");
        preview.textContent = resolved + ".html";
      }
      updatePreview();

      let settled = false;
      let mouseDownOnBackdrop = false;
      function cleanup(result) {
        if (settled) return;
        settled = true;
        exportDialogOpen = false;
        form.removeEventListener("submit", onSubmit);
        if (cancelBtn) cancelBtn.removeEventListener("click", onCancelClick);
        input.removeEventListener("input", updatePreview);
        input.removeEventListener("keydown", onInputKeyDown);
        dialog.removeEventListener("cancel", onDialogCancel);
        dialog.removeEventListener("mousedown", onBackdropMouseDown);
        dialog.removeEventListener("click", onBackdropClick);
        if (typeof dialog.close === "function" && dialog.open) {
          dialog.close();
        } else {
          dialog.removeAttribute("open");
        }
        if (lastFocusedEl && typeof lastFocusedEl.focus === "function" && document.contains(lastFocusedEl)) {
          try { lastFocusedEl.focus({ preventScroll: true }); } catch (e) {}
        }
        resolve(result);
      }

      function onSubmit(e) {
        e.preventDefault();
        cleanup(sanitizeFn(input.value, "pole-girls-archive"));
      }
      function onCancelClick() {
        cleanup(null);
      }
      function onDialogCancel(e) {
        e.preventDefault();
        cleanup(null);
      }
      function onBackdropMouseDown(e) {
        mouseDownOnBackdrop = (e.target === dialog);
      }
      function onBackdropClick(e) {
        const shouldClose = mouseDownOnBackdrop && (e.target === dialog);
        mouseDownOnBackdrop = false;
        if (shouldClose) cleanup(null);
      }
      function onInputKeyDown(e) {
        if (e.isComposing || e.keyCode === 229) {
          if (e.key === "Enter") e.preventDefault();
        }
      }

      form.addEventListener("submit", onSubmit);
      if (cancelBtn) cancelBtn.addEventListener("click", onCancelClick);
      input.addEventListener("input", updatePreview);
      input.addEventListener("keydown", onInputKeyDown);
      dialog.addEventListener("cancel", onDialogCancel);
      dialog.addEventListener("mousedown", onBackdropMouseDown);
      dialog.addEventListener("click", onBackdropClick);

      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      input.focus();
      input.select();
    });
  }

  function isAnimatedWebPBuffer(buffer) {
    if (!buffer || buffer.byteLength < 21) return false;
    const b = new Uint8Array(buffer);
    // RIFF....WEBPVP8X かつ flags(byte 20) の Animation ビット (0x02) を判定
    const isRiffWebp =
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
    if (!isRiffWebp) return false;
    const isVp8x = b[12] === 0x56 && b[13] === 0x50 && b[14] === 0x38 && b[15] === 0x58;
    return isVp8x && (b[20] & 0x02) !== 0;
  }

  function inferImageMime(file) {
    if (!file) return "";
    const rawType = String(file.type || "").toLowerCase().trim();
    if (rawType.startsWith("image/")) return rawType;
    if (rawType && rawType !== "application/octet-stream") return "";
    const name = String(file.name || "").toLowerCase();
    if (/\.svg$/i.test(name)) return "image/svg+xml";
    if (/\.gif$/i.test(name)) return "image/gif";
    if (/\.webp$/i.test(name)) return "image/webp";
    if (/\.jpe?g$/i.test(name)) return "image/jpeg";
    if (/\.png$/i.test(name)) return "image/png";
    if (/\.bmp$/i.test(name)) return "image/bmp";
    if (/\.avif$/i.test(name)) return "image/avif";
    if (/\.ico$/i.test(name)) return "image/x-icon";
    return "";
  }

  /**
   * ローカル画像をリサイズ＆Base64最適化してデータURIを返す
   * @param {File} file
   * @param {number} maxDimension
   * @returns {Promise<string>}
   */
  function optimizeUploadedImage(file, maxDimension) {
    const MAX_RAW_EMBED_BYTES = 2 * 1024 * 1024;
    const LIGHTWEIGHT_DIRECT_BYTES = 350 * 1024;

    return new Promise(function (resolve, reject) {
      const mime = inferImageMime(file);
      if (!mime) {
        reject(new Error("画像ファイルを選択してください。"));
        return;
      }

      function fixDataUrlMime(dataUrl) {
        if (typeof dataUrl !== "string" || !mime || mime === "image/*") return dataUrl;
        return dataUrl.replace(/^data:(?:application\/octet-stream)?(?=;|,)/i, "data:" + mime);
      }

      function readAsRawDataUrl(errorMsg) {
        if (file.size > MAX_RAW_EMBED_BYTES) {
          reject(new Error("アニメーション画像・SVG の埋め込みは 2MB 以下にしてください。"));
          return;
        }
        const reader = new FileReader();
        reader.onload = function () { resolve(fixDataUrlMime(reader.result)); };
        reader.onerror = function () { reject(new Error(errorMsg)); };
        reader.readAsDataURL(file);
      }

      // SVGおよびGIF（アニメーション保持）はそのままデータURI化
      if (mime === "image/svg+xml" || mime === "image/gif") {
        readAsRawDataUrl("画像の読み込みに失敗しました。");
        return;
      }

      function encodeStaticViaCanvas() {
        const reader = new FileReader();
        reader.onload = function (ev) {
          const safeOrigDataUrl = fixDataUrlMime(ev.target.result);
          const img = new Image();
          img.onload = function () {
            try {
              const naturalW = Math.max(1, img.naturalWidth || img.width || 1);
              const naturalH = Math.max(1, img.naturalHeight || img.height || 1);
              const needsResize = naturalW > maxDimension || naturalH > maxDimension;

              // すでに最大寸法以下かつ軽量な PNG / WebP は非可逆再エンコードを避けて無劣化保持
              if (!needsResize && (mime === "image/webp" || mime === "image/png") && file.size <= LIGHTWEIGHT_DIRECT_BYTES) {
                resolve(safeOrigDataUrl);
                return;
              }

              let w = naturalW;
              let h = naturalH;
              if (needsResize) {
                if (w >= h) {
                  h = Math.max(1, Math.round((h * maxDimension) / w));
                  w = maxDimension;
                } else {
                  w = Math.max(1, Math.round((w * maxDimension) / h));
                  h = maxDimension;
                }
              }
              const canvas = document.createElement("canvas");
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext("2d");
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = "high";
              ctx.drawImage(img, 0, 0, w, h);

              let dataUrl = "";
              if (mime === "image/jpeg") {
                dataUrl = canvas.toDataURL("image/jpeg", 0.86);
              } else {
                // 透過PNG等を軽量WebPへ最適化（非対応環境はPNGへ自動フォールバック）
                const webp = canvas.toDataURL("image/webp", 0.88);
                dataUrl = webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/png");
              }

              // リサイズ不要時に再エンコードで却って肥大化した場合は元データを保持
              if (!needsResize && typeof safeOrigDataUrl === "string" && /^data:image\//i.test(safeOrigDataUrl) && dataUrl.length >= safeOrigDataUrl.length) {
                resolve(safeOrigDataUrl);
                return;
              }
              resolve(dataUrl);
            } catch (err) {
              reject(err);
            }
          };
          img.onerror = function () {
            reject(new Error("画像のデコードに失敗しました。"));
          };
          img.src = safeOrigDataUrl;
        };
        reader.onerror = function () {
          reject(new Error("ファイルの読み込みに失敗しました。"));
        };
        reader.readAsDataURL(file);
      }

      // アニメーションWebPはフレーム保持のため再エンコードせずそのまま埋め込む
      if (mime === "image/webp" && typeof file.slice === "function") {
        const headReader = new FileReader();
        headReader.onload = function () {
          if (isAnimatedWebPBuffer(headReader.result)) {
            readAsRawDataUrl("アニメーションWebPの読み込みに失敗しました。");
          } else {
            encodeStaticViaCanvas();
          }
        };
        headReader.onerror = function () {
          encodeStaticViaCanvas();
        };
        headReader.readAsArrayBuffer(file.slice(0, 32));
        return;
      }

      encodeStaticViaCanvas();
    });
  }

  function loadColorHistory() {
    try {
      const saved = localStorage.getItem(COLOR_HISTORY_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      const seen = new Set();
      return parsed
        .map(function (c) { return String(c || "").toUpperCase(); })
        .filter(function (c) {
          if (!/^#[0-9A-F]{6}$/.test(c) || seen.has(c)) return false;
          seen.add(c);
          return true;
        })
        .slice(0, MAX_COLOR_HISTORY);
    } catch (err) {
      return [];
    }
  }

  function getColorHistory() {
    return colorHistory.slice();
  }

  function recordThemeColor(hex) {
    const normalized = String(hex || "").toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(normalized)) return colorHistory.slice();
    colorHistory = [normalized].concat(colorHistory.filter(function (c) { return c !== normalized; })).slice(0, MAX_COLOR_HISTORY);
    try {
      localStorage.setItem(COLOR_HISTORY_KEY, JSON.stringify(colorHistory));
    } catch (err) {}
    return colorHistory.slice();
  }

  function clearColorHistory() {
    colorHistory = [];
    try {
      localStorage.removeItem(COLOR_HISTORY_KEY);
    } catch (err) {}
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

  global.CASState = {
    APP_VERSION: APP_VERSION,
    APP_UPDATED_AT: APP_UPDATED_AT,
    STORAGE_KEY: STORAGE_KEY,
    studioState: studioState,
    getProjectData: getProjectData,
    setProjectData: setProjectData,
    getColorHistory: getColorHistory,
    recordThemeColor: recordThemeColor,
    clearColorHistory: clearColorHistory,
    generateId: generateId,
    sanitizeLinkUrl: sanitizeLinkUrl,
    normalizeProjectData: normalizeProjectData,
    loadInitialProject: loadInitialProject,
    getInitialLoadStatus: getInitialLoadStatus,
    scheduleAutoSave: scheduleAutoSave,
    flushAutoSave: flushAutoSave,
    cancelAutoSave: cancelAutoSave,
    escapeHtmlText: escapeHtmlText,
    getContrastTextColor: getContrastTextColor,
    showToast: showToast,
    showConfirmDialog: showConfirmDialog,
    showExportFilenameDialog: showExportFilenameDialog,
    optimizeUploadedImage: optimizeUploadedImage
  };
})(window);
