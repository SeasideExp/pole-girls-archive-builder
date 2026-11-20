/**
 * main.js
 * アプリケーション初期化・ライブプレビュー同期・ツールバー／ファイル操作イベント統括
 * 名前空間: window.CASMain
 */
(function (global) {
  "use strict";

  function boot() {
    const State = global.CASState;
    const Viewer = global.CASViewer;
    const ViewerStyles = global.CASViewerStyles;
    const Editor = global.CASEditor;
    const IO = global.CASIO;
    const Templates = global.CASTemplates;

    // ビューア共通CSSをページへ注入
    const sharedStyleEl = document.getElementById("viewer-shared-styles");
    if (sharedStyleEl) {
      sharedStyleEl.textContent = ViewerStyles.VIEWER_CSS;
    }

    const toolbarEl = document.getElementById("studio-toolbar");
    const sidebarEl = document.getElementById("editor-sidebar");
    const mobileBackdropEl = document.getElementById("mobile-sidebar-backdrop");
    const btnMobileSidebar = document.getElementById("btn-mobile-sidebar");
    const btnModeEdit = document.getElementById("btn-mode-edit");
    const btnModePreview = document.getElementById("btn-mode-preview");
    const archiveMountEl = document.getElementById("archive-app");

    function syncToolbarHeight() {
      if (!toolbarEl) return;
      document.documentElement.style.setProperty("--studio-toolbar-h", toolbarEl.offsetHeight + "px");
    }
    syncToolbarHeight();
    if (typeof ResizeObserver === "function" && toolbarEl) {
      new ResizeObserver(syncToolbarHeight).observe(toolbarEl);
    }
    window.addEventListener("resize", function () {
      syncToolbarHeight();
      if (window.innerWidth >= 1024 && State.studioState.mobileSidebarOpen) {
        setMobileSidebar(false);
      }
    });

    function setMobileSidebar(open) {
      State.studioState.mobileSidebarOpen = open;
      if (btnMobileSidebar) {
        btnMobileSidebar.setAttribute("aria-expanded", open ? "true" : "false");
      }
      if (open) {
        sidebarEl.classList.remove("-translate-x-full");
        mobileBackdropEl.classList.remove("hidden");
      } else {
        sidebarEl.classList.add("-translate-x-full");
        mobileBackdropEl.classList.add("hidden");
      }
    }

    let viewer = null;

    function syncAll(skipSidebarRerender, viewerUpdateOpts) {
      viewer.updateData(State.getProjectData(), viewerUpdateOpts);
      State.scheduleAutoSave();
      if (!skipSidebarRerender) {
        Editor.renderEditorSidebar();
      }
    }

    function setMode(mode) {
      State.studioState.mode = mode;
      if (mode === "edit") {
        document.body.classList.add("edit-mode-active");
        sidebarEl.classList.remove("hidden");
        btnModeEdit.setAttribute("aria-pressed", "true");
        btnModePreview.setAttribute("aria-pressed", "false");
        btnModeEdit.className = "px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1.5 bg-[#00AEFF] text-white shadow";
        btnModePreview.className = "px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1.5 text-slate-300 hover:text-white";
      } else {
        document.body.classList.remove("edit-mode-active");
        setMobileSidebar(false);
        sidebarEl.classList.add("hidden");
        btnModeEdit.setAttribute("aria-pressed", "false");
        btnModePreview.setAttribute("aria-pressed", "true");
        btnModePreview.className = "px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1.5 bg-[#00AEFF] text-white shadow";
        btnModeEdit.className = "px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1.5 text-slate-300 hover:text-white";
      }
      viewer.refreshModal();
    }

    // ライブプレビュー初期化
    viewer = Viewer.initArchiveViewer(archiveMountEl, State.getProjectData(), {
      isEditor: true,
      getIsEditMode: function () {
        return State.studioState.mode === "edit";
      },
      onEditCharacter: function (charId) {
        State.studioState.selectedCharId = charId;
        State.studioState.activeTab = "characters";
        Editor.updateTabButtons();
        Editor.renderEditorSidebar();
        if (window.innerWidth < 1024) {
          setMobileSidebar(true);
          viewer.closeModal();
        }
        State.showToast("選択したキャラクターをエディタに読み込みました。", "info");
      }
    });

    // エディタへコールバックを接続
    Editor.init({
      syncAll: syncAll,
      openCharacterModal: function (charId) {
        viewer.openCharacter(charId);
      },
      setMobileSidebar: setMobileSidebar
    });

    // モード切替・モバイルサイドバー
    btnModeEdit.addEventListener("click", function () { setMode("edit"); });
    btnModePreview.addEventListener("click", function () { setMode("preview"); });

    if (btnMobileSidebar) {
      btnMobileSidebar.addEventListener("click", function () {
        if (State.studioState.mode !== "edit") setMode("edit");
        setMobileSidebar(!State.studioState.mobileSidebarOpen);
      });
    }
    mobileBackdropEl.addEventListener("click", function () {
      setMobileSidebar(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.defaultPrevented || e.isComposing || e.keyCode === 229) return;
      if (e.key === "Escape" && State.studioState.mobileSidebarOpen && !document.querySelector("dialog[open]")) {
        setMobileSidebar(false);
        if (btnMobileSidebar && typeof btnMobileSidebar.focus === "function") {
          try { btnMobileSidebar.focus({ preventScroll: true }); } catch (err) {}
        }
      }
    });

    // タブ切替
    document.querySelectorAll(".editor-tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        State.studioState.activeTab = btn.getAttribute("data-tab");
        Editor.updateTabButtons();
        Editor.renderEditorSidebar();
      });
    });

    // 画像アップロード処理
    document.getElementById("input-image-upload").addEventListener("change", async function (e) {
      const file = e.target.files && e.target.files[0];
      const target = State.studioState.pendingImageTarget;
      State.studioState.pendingImageTarget = null;
      if (!file || !target) return;

      const startProject = State.getProjectData();
      const chBefore = startProject.characters.find(function (c) { return c.id === target.charId; });
      if (!chBefore) return;

      try {
        const maxDim = (target.field === "standingUrl" || target.field === "standingUrl2") ? 1200 : 512;
        const dataUrl = await State.optimizeUploadedImage(file, maxDim);
        const currentProject = State.getProjectData();
        if (currentProject !== startProject) return;
        const chCurrent = currentProject.characters.find(function (c) { return c.id === target.charId; });
        if (!chCurrent) return;

        chCurrent[target.field] = dataUrl;
        syncAll(false);
        const kb = Math.max(1, Math.round((dataUrl.length * 3) / 4 / 1024));
        const kindName = target.field === "standingUrl"
          ? "プロフィール画像1"
          : (target.field === "standingUrl2" ? "プロフィール画像2" : "アイコン画像");
        State.showToast(kindName + "を最適化して埋め込みました（約 " + kb + " KB）。", "success");
      } catch (err) {
        State.showToast(err.message || "画像の処理に失敗しました。", "error");
      }
    });

    // 公開用HTML書き出し（ファイル名指定ダイアログ）
    document.getElementById("btn-export-html").addEventListener("click", async function () {
      try {
        const defaultBase = IO.getDefaultExportBaseName();
        const chosenBase = await State.showExportFilenameDialog(defaultBase, IO.sanitizeFilename);
        if (!chosenBase) return;
        const filename = IO.exportStandaloneHtml(chosenBase);
        State.showToast("公開用の単一HTMLファイル（「" + filename + "」）を書き出しました！", "success");
      } catch (err) {
        console.error(err);
        State.showToast("HTMLの書き出し中にエラーが発生しました。", "error");
      }
    });

    // 設定保存（JSON）
    document.getElementById("btn-save-json").addEventListener("click", function () {
      try {
        const filename = IO.exportProjectJson();
        State.showToast("プロジェクト設定（「" + filename + "」）を保存しました。", "success");
      } catch (err) {
        State.showToast("JSON保存中にエラーが発生しました。", "error");
      }
    });

    // データ読込（JSON または 書き出し済みHTML）
    const importInputEl = document.getElementById("input-import-file");
    document.getElementById("btn-import-data").addEventListener("click", function () {
      importInputEl.value = "";
      importInputEl.click();
    });

    importInputEl.addEventListener("change", async function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      try {
        const normalized = await IO.parseProjectFile(file);
        const ok = await State.showConfirmDialog(
          "データを読み込み",
          "「" + file.name + "」のデータを読み込みますか？（" + normalized.characters.length + "名）\n現在の編集内容は上書きされます。",
          "読み込む",
          false
        );
        if (!ok) return;
        State.cancelAutoSave();
        State.setProjectData(normalized);
        State.studioState.selectedCharId = normalized.characters[0] ? normalized.characters[0].id : null;
        Editor.resetDrafts();
        viewer.updateData(normalized, { resetView: true });
        Editor.renderEditorSidebar();
        State.scheduleAutoSave();
        State.showToast("「" + file.name + "」からデータを読み込みました（" + normalized.characters.length + "名）。", "success");
      } catch (err) {
        State.showToast("読込エラー: " + (err.message || "対応していないファイル形式です。"), "error");
      }
    });

    // 初期状態へリセット
    document.getElementById("btn-reset-data").addEventListener("click", async function () {
      const ok = await State.showConfirmDialog(
        "初期データにリセット",
        "現在の編集内容を破棄し、雛形（初期データ）の状態に戻しますか？\n必要に応じて先に「設定保存(JSON)」でバックアップしてください。",
        "リセットする",
        true
      );
      if (!ok) return;
      State.cancelAutoSave();
      const fresh = Templates.createDefaultData();
      State.setProjectData(fresh);
      State.studioState.selectedCharId = fresh.characters[0] ? fresh.characters[0].id : null;
      Editor.resetDrafts();
      try { localStorage.removeItem(State.STORAGE_KEY); } catch (e) {}
      viewer.updateData(fresh, { resetView: true });
      Editor.renderEditorSidebar();
      const statusEl = document.getElementById("autosave-status");
      if (statusEl) statusEl.textContent = "初期データにリセット済み";
      State.showToast("初期データにリセットしました。", "info");
    });

    // このツールについて / ヘルプ モーダル
    const aboutVerEl = document.getElementById("about-version-text");
    if (aboutVerEl) aboutVerEl.textContent = State.APP_VERSION;
    const aboutUpdatedEl = document.getElementById("about-updated-text");
    if (aboutUpdatedEl && State.APP_UPDATED_AT) {
      const parts = String(State.APP_UPDATED_AT).split("-");
      aboutUpdatedEl.textContent = parts.length === 3
        ? (parts[0] + "年" + parseInt(parts[1], 10) + "月" + parseInt(parts[2], 10) + "日")
        : State.APP_UPDATED_AT;
    }

    function bindInfoDialog(dialogId, openBtnId, closeBtnId, bodyId) {
      const dialog = document.getElementById(dialogId);
      const openBtn = document.getElementById(openBtnId);
      const closeBtn = document.getElementById(closeBtnId);
      if (!dialog || !openBtn) return;

      let mouseDownOnBackdrop = false;
      let lastFocusedEl = null;
      function closeDlg() {
        mouseDownOnBackdrop = false;
        if (typeof dialog.close === "function" && dialog.open) {
          dialog.close();
        } else {
          dialog.removeAttribute("open");
        }
        const restoreTarget = (lastFocusedEl && document.contains(lastFocusedEl)) ? lastFocusedEl : openBtn;
        lastFocusedEl = null;
        if (restoreTarget && typeof restoreTarget.focus === "function") {
          try { restoreTarget.focus({ preventScroll: true }); } catch (err) {}
        }
      }

      openBtn.addEventListener("click", function () {
        lastFocusedEl = document.activeElement;
        if (typeof dialog.showModal === "function") {
          if (!dialog.open) dialog.showModal();
        } else {
          dialog.setAttribute("open", "");
        }
        if (bodyId) {
          const bodyEl = document.getElementById(bodyId);
          if (bodyEl) bodyEl.scrollTop = 0;
        }
      });
      if (closeBtn) {
        closeBtn.addEventListener("click", closeDlg);
      }
      dialog.addEventListener("mousedown", function (e) {
        mouseDownOnBackdrop = (e.target === dialog);
      });
      dialog.addEventListener("click", function (e) {
        const shouldClose = mouseDownOnBackdrop && (e.target === dialog);
        mouseDownOnBackdrop = false;
        if (shouldClose) closeDlg();
      });
      dialog.addEventListener("cancel", function (e) {
        e.preventDefault();
        closeDlg();
      });
    }

    bindInfoDialog("studio-about-dialog", "btn-studio-about", "about-close-btn");
    bindInfoDialog("studio-help-dialog", "btn-studio-help", "help-close-btn", "help-modal-body");

    document.querySelectorAll(".studio-help-toc-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const targetId = btn.getAttribute("data-help-target");
        const targetEl = targetId ? document.getElementById(targetId) : null;
        if (targetEl && typeof targetEl.scrollIntoView === "function") {
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    window.addEventListener("pagehide", function () {
      State.flushAutoSave();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") {
        State.flushAutoSave();
      }
    });

    // 初期描画（未編集のまま localStorage へ自動保存しない）
    Editor.updateTabButtons();
    Editor.renderEditorSidebar();
    const initStatusEl = document.getElementById("autosave-status");
    const initLoadStatus = State.getInitialLoadStatus();
    if (initStatusEl) {
      if (initLoadStatus === "saved") {
        initStatusEl.textContent = "自動保存データ読込済み";
      } else if (initLoadStatus === "corrupted") {
        initStatusEl.textContent = "自動保存データ読込失敗（初期データで起動）";
      } else {
        initStatusEl.textContent = "自動保存: 待機中（未編集）";
      }
    }
    if (initLoadStatus === "corrupted") {
      State.showToast("ブラウザ内の自動保存データが破損していたため、初期データで起動しました。", "warning");
    }

    global.CASMain = {
      syncAll: syncAll,
      setMode: setMode,
      setMobileSidebar: setMobileSidebar
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
