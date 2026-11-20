/**
 * templates.js
 * 初期テンプレートデータ（サンプルキャラ + サンプル属性）と仮置きSVGジェネレーター
 * 名前空間: window.CASTemplates
 */
(function (global) {
  "use strict";

  const COLOR_PRESETS = [
    "#00AEFF", "#1289F6", "#2563EB", "#0EA5E9",
    "#FF5E8E", "#EF4444", "#F97316", "#F59E0B",
    "#10B981", "#14B8A6", "#7C3AED", "#EC4899",
    "#64748B", "#78716C", "#1B2B44", "#0F172A"
  ];

  function escapeXml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /**
   * 画像未設定・読込失敗時に共通使用する頭文字アバターSVGデータURIを生成する（viewer.js と同一デザイン）
   * @param {string} name
   * @param {string} colorHex
   * @returns {string} SVGデータURI
   */
  function getFallbackAvatar(name, colorHex) {
    const firstChar = Array.from((name || "?").trim())[0] || "?";
    const initial = firstChar.toUpperCase();
    const c = /^#[0-9A-Fa-f]{6}$/.test(colorHex) ? colorHex : "#00AEFF";
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#EDF4FC"/><rect width="200" height="8" fill="' + c + '"/><text x="100" y="122" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="76" fill="#1B2B44">' + escapeXml(initial) + "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /**
   * 初期テンプレートデータを生成して返す
   * @returns {object}
   */
  function createDefaultData() {
    return {
      version: 1,
      site: {
        title: "架線柱ちゃん アーカイブ",
        subtitle: "各地の鉄道の架線柱を擬人化した「架線柱ちゃん」キャラクターデータベース",
        badgeText: "POLE GIRLS // ARCHIVE DATABASE",
        homeUrl: "",
        homeLabel: "トップページへ",
        homeUrl2: "",
        homeLabel2: "",
        counterLabel: "キャラクター総数",
        modalLabel: "CHARACTER PROFILE",
        modalNumberFormat: "// {01}",
        specSectionLabel: "SPECIFICATION // DATA",
        bioSectionLabel: "PROFILE // OVERVIEW",
        imageTab1Label: "画像1",
        imageTab2Label: "画像2",
        detailLinkLabel: "詳しい解説ページを見る",
        accentColor: "#00AEFF",
        bgPattern: "grid", // "grid" | "dots" | "stripes"
        defaultViewMode: "grid", // "grid" | "compact" | "list"
        footerText: "© しーさいど (@SeasideExp) / アンバリヅカ // ※実在の鉄道会社様とは一切関係ありません。",
        footerCredit: "CHARACTER ARCHIVE SYSTEM（Powered by しーさいど）"
      },
      attributeCategories: [
        { id: "cat_a", name: "材質" },
        { id: "cat_b", name: "地域" },
        { id: "cat_c", name: "特性" },
        { id: "cat_d", name: "その他" }
      ],
      attributes: [
        { id: "attr_steel", name: "鉄柱", color: "#334155", categoryId: "cat_a" },
        { id: "attr_concrete", name: "コンクリート柱", color: "#64748B", categoryId: "cat_a" },
        { id: "attr_wood", name: "木柱", color: "#B45309", categoryId: "cat_a" },
        { id: "attr_kanto", name: "関東", color: "#00AEFF", categoryId: "cat_b" },
        { id: "attr_chubu", name: "中部", color: "#10B981", categoryId: "cat_b" },
        { id: "attr_kansai", name: "関西", color: "#F43F5E", categoryId: "cat_b" },
        { id: "attr_electric_origin", name: "最初から電鉄", color: "#2563EB", categoryId: "cat_c" },
        { id: "attr_steam_electrified", name: "汽車→電化", color: "#7C3AED", categoryId: "cat_c" },
        { id: "attr_pipe", name: "鋼管柱", color: "#0EA5E9", categoryId: "cat_d" },
        { id: "attr_taper", name: "テーパー柱", color: "#F59E0B", categoryId: "cat_d" },
        { id: "attr_non_taper", name: "ノーテーパー柱", color: "#14B8A6", categoryId: "cat_d" }
      ],
      characters: [
        {
          id: "char_a",
          name: "キャラA",
          subName: "CHARA-A // ALPHA",
          catchphrase: "架線柱ちゃんです！",
          themeColor: "#00AEFF",
          iconUrl: "img/char_a_icon.webp",
          standingUrl: "img/char_a_standing.webp",
          standingUrl2: "img/char_a_standing2.webp",
          standingTab1Label: "",
          standingTab2Label: "",
          standingScale1: 100,
          standingScale2: 100,
          detailUrl: "",
          detailLabel: "",
          attributeIds: ["attr_steel", "attr_kanto", "attr_electric_origin"],
          specs: [
            { label: "柱材質", value: "鉄柱" },
            { label: "ビーム形状", value: "平面トラス等" },
            { label: "設置時期", value: "昭和5年（開業時）" },
            { label: "所在地", value: "本線" }
          ],
          bio: "　開業から95年、今日も同じ場所に立ち続けている……はずなのだが、注目度が低すぎて、不明な事が多い架線柱ちゃんだ！"
        }
      ]
    };
  }

  global.CASTemplates = {
    COLOR_PRESETS: COLOR_PRESETS,
    escapeXml: escapeXml,
    getFallbackAvatar: getFallbackAvatar,
    createDefaultData: createDefaultData
  };
})(window);
