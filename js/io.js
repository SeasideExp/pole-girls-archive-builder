/**
 * io.js
 * 公開用単一HTMLファイル書き出し＆JSON/HTML再読込
 * 名前空間: window.CASIO
 */
(function (global) {
  "use strict";

  function serializeJsonForHtmlScript(obj) {
    return JSON.stringify(obj)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");
  }

  /**
   * 外部CDN・外部ファイルへの依存が一切ない完全スタンドアロンHTMLを生成する
   * @param {object} data
   * @returns {string}
   */
  function buildStandaloneExportHtml(data) {
    const safeTitle = global.CASState.escapeHtmlText((data.site && data.site.title && data.site.title.trim()) ? data.site.title : "キャラクターアーカイブ");
    const safeJson = serializeJsonForHtmlScript(data);
    const viewerFnCode = global.CASViewer.initArchiveViewer.toString();
    const viewerCss = global.CASViewerStyles.VIEWER_CSS;

    return [
      "<!DOCTYPE html>",
      '<html lang="ja">',
      "<head>",
      '  <meta charset="UTF-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      "  <title>" + safeTitle + "</title>",
      "  <style>",
      "    html { scrollbar-gutter: stable; }",
      "    html, body { margin: 0; padding: 0; min-height: 100%; background: #F4F7FB; }",
      "    body { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; }",
      "    #archive-app { flex: 1 0 auto; display: flex; flex-direction: column; }",
      viewerCss,
      "  </style>",
      "</head>",
      "<body>",
      '  <div id="archive-app"></div>',
      "",
      "  <!-- キャラクターデータ本体（このHTMLを制作ツールに読み込むことで再編集可能） -->",
      '  <script id="char-archive-data" type="application/json">' + safeJson + "<" + "/script>",
      "",
      "  <!-- スタンドアロン実行エンジン -->",
      "  <script>",
      "    (function () {",
      '      "use strict";',
      viewerFnCode,
      "      document.addEventListener('DOMContentLoaded', function () {",
      "        try {",
      "          var dataEl = document.getElementById('char-archive-data');",
      "          var parsed = JSON.parse(dataEl.textContent);",
      "          var mountEl = document.getElementById('archive-app');",
      "          initArchiveViewer(mountEl, parsed, { isEditor: false });",
      "        } catch (err) {",
      "          console.error('Archive initialization failed:', err);",
      "        }",
      "      });",
      "    })();",
      "  <" + "/script>",
      "</body>",
      "</html>"
    ].join("\n");
  }

  function triggerDownload(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function sanitizeFilename(name, fallback) {
    const withoutExt = String(name || "").trim().replace(/\.html?$/i, "");
    const cleaned = withoutExt
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^[_-]+|[_-]+$/g, "")
      .slice(0, 60);
    return cleaned || fallback;
  }

  function getDefaultBaseNameFromTitle(title, fallback) {
    const raw = String(title || "").trim().replace(/\.html?$/i, "");
    if (!raw || /[^\x00-\x7F]/.test(raw)) {
      return fallback;
    }
    return sanitizeFilename(raw, fallback);
  }

  function getDefaultExportBaseName() {
    const data = global.CASState.getProjectData();
    return getDefaultBaseNameFromTitle(data.site && data.site.title, "pole-girls-archive");
  }

  /**
   * 現在のプロジェクトを公開用単一HTMLとしてダウンロード書き出し
   * @param {string} [customBaseName]
   */
  function exportStandaloneHtml(customBaseName) {
    const data = global.CASState.getProjectData();
    const html = buildStandaloneExportHtml(data);
    const defaultBase = getDefaultExportBaseName();
    const baseName = customBaseName != null
      ? sanitizeFilename(customBaseName, "pole-girls-archive")
      : defaultBase;
    triggerDownload(html, baseName + ".html", "text/html;charset=utf-8");
    return baseName + ".html";
  }

  /**
   * 現在のプロジェクトをJSONファイルとしてダウンロード保存
   */
  function exportProjectJson() {
    const data = global.CASState.getProjectData();
    const jsonStr = JSON.stringify(data, null, 2);
    const baseName = getDefaultBaseNameFromTitle(data.site && data.site.title, "pole-girls-archive");
    triggerDownload(jsonStr, baseName + "-data.json", "application/json;charset=utf-8");
    return baseName + "-data.json";
  }

  /**
   * JSONまたは書き出し済みHTMLファイルを読み込み、正規化済みデータを返す
   * @param {File} file
   * @returns {Promise<object>}
   */
  function parseProjectFile(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const text = String(reader.result || "").replace(/^\uFEFF/, "");
          let parsed = null;

          // HTMLファイルの場合は埋め込みJSONスクリプトから抽出
          if (file.name.toLowerCase().endsWith(".html") || file.name.toLowerCase().endsWith(".htm") || text.trim().startsWith("<")) {
            const doc = new DOMParser().parseFromString(text, "text/html");
            const dataScript = doc.getElementById("char-archive-data");
            if (!dataScript || !dataScript.textContent) {
              throw new Error("このHTMLファイルには再編集用データ（#char-archive-data）が見つかりませんでした。");
            }
            parsed = JSON.parse(dataScript.textContent);
          } else {
            parsed = JSON.parse(text);
          }

          const hasValidChars = Array.isArray(parsed && parsed.characters);
          const hasValidSite = Boolean(parsed && parsed.site && typeof parsed.site === "object" && !Array.isArray(parsed.site));
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || (!hasValidChars && !hasValidSite)) {
            throw new Error("データ形式が正しくありません。");
          }
          if ((parsed.characters != null && !hasValidChars) || (parsed.site != null && !hasValidSite)) {
            throw new Error("データ形式が正しくありません。");
          }

          resolve(global.CASState.normalizeProjectData(parsed));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = function () {
        reject(new Error("ファイルの読み込みに失敗しました。"));
      };
      reader.readAsText(file, "UTF-8");
    });
  }

  global.CASIO = {
    serializeJsonForHtmlScript: serializeJsonForHtmlScript,
    buildStandaloneExportHtml: buildStandaloneExportHtml,
    triggerDownload: triggerDownload,
    sanitizeFilename: sanitizeFilename,
    getDefaultExportBaseName: getDefaultExportBaseName,
    exportStandaloneHtml: exportStandaloneHtml,
    exportProjectJson: exportProjectJson,
    parseProjectFile: parseProjectFile
  };
})(window);
