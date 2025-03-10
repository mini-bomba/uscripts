// ==UserScript==
// @name          YouTube custom grid layouts
// @namespace     uscripts.minibomba.pro
// @match         *://*.youtube.com/*
// @match         https://uscripts.minibomba.pro/yt_custom_grid
// @exclude-match https://accounts.youtube.com/*
// @grant         GM_getValue
// @grant         GM_setValue
// @grant         GM_registerMenuCommand
// @grant         GM_openInTab
// @require       https://raw.githubusercontent.com/mini-bomba/uscripts/master/utils/general.js
// @require       https://raw.githubusercontent.com/mini-bomba/uscripts/master/utils/settings.js
// @run-at        document-start
// @version       1.1.0
// @author        mini_bomba
// @updateURL     https://raw.githubusercontent.com/mini-bomba/uscripts/master/yt_custom_grid.user.js
// @downloadURL   https://raw.githubusercontent.com/mini-bomba/uscripts/master/yt_custom_grid.user.js
// @description   Rewrites youtube's stupid rich "grid" renderer to actually use CSS grid, with custom values!
// ==/UserScript==

// Configuration page boilerplate
const { SETTINGS, on_the_config_page } = settingsSetup({
  default_settings: {
    min_item_width: "300px",
    column_gap: "16px",
    row_gap: "40px",
    container_padding: "16px",
    mmb_fix: true,
  },
  settings_page_name: "yt_custom_grid",
  settings_event_name: "mbusc-ytcg",
});

const stylesheet = new CSSStyleSheet();
document.adoptedStyleSheets.push(stylesheet);

function add_css() {
  stylesheet.replaceSync("");
  let rule = stylesheet.cssRules[stylesheet.insertRule("ytd-rich-grid-renderer {}")];
  rule.style.setProperty("padding-left", SETTINGS.container_padding);
  rule.style.setProperty("padding-right", SETTINGS.container_padding);

  rule = stylesheet.cssRules[stylesheet.insertRule("ytd-rich-grid-renderer > #contents.ytd-rich-grid-renderer {}")];
  rule.style.setProperty("display", "grid");
  rule.style.setProperty("grid-template-columns", `repeat(auto-fit, minmax(${SETTINGS.min_item_width}, 1fr))`);
  rule.style.setProperty("column-gap", SETTINGS.column_gap);
  rule.style.setProperty("row-gap", SETTINGS.row_gap);

  rule = stylesheet.cssRules[stylesheet.insertRule("ytd-rich-grid-renderer > #contents.ytd-rich-grid-renderer > ytd-rich-item-renderer[rendered-from-rich-grid] {}")];
  rule.style.setProperty("width", "unset", "important");
  rule.style.setProperty("margin", "unset", "important");

  rule = stylesheet.cssRules[stylesheet.insertRule("ytd-rich-grid-renderer > #contents.ytd-rich-grid-renderer > ytd-rich-item-renderer[rendered-from-rich-grid] > #content > ytd-rich-grid-media {}")];
  rule.style.setProperty("max-width", "unset", "important");

  rule = stylesheet.cssRules[stylesheet.insertRule("ytd-rich-grid-renderer > #contents.ytd-rich-grid-renderer > :is(ytd-rich-section-renderer, ytd-continuation-item-renderer) {}")];
  rule.style.setProperty("grid-column", "1 / -1");
}

function on_middleclick(ev) {
  // only middle mouse button clicks processed
  if (ev.button != 1) return;

  // check enabled
  if (!SETTINGS.mmb_fix) return;

  // check that we didn't click a link
  if (ev.target.closest("a") != null) return;

  // check that we clicked a thumbnail
  const thumbnail_item = ev.target.closest("ytd-rich-item-renderer");
  if (thumbnail_item == null) return;
  if (thumbnail_item.querySelector(":scope > div > yt-lockup-view-model") == null) return;

  const title_element = thumbnail_item.querySelector(".yt-lockup-metadata-view-model-wiz__title")

  window.open(title_element.href);
  ev.preventDefault();
  ev.stopImmediatePropagation();
}

function custom_setting_check(id, check) {
  document.getElementById(id).addEventListener("change", e => {
    if (isTag(event.target, "input")) {
      if (check(event.target.value)) {
        event.target.setCustomValidity("");
      } else {
        event.target.setCustomValidity("Invalid CSS value!");
      }
    }
  }, {
    capture: true,
    passive: true,
  });
}

if (!on_the_config_page) {
  GM_registerMenuCommand("Refresh CSS", add_css);
  add_css();
  document.addEventListener("mousedown", on_middleclick, {capture: true});
} else {
  waitUntilInteractive().then(() => {
    custom_setting_check("min-item-width", val => CSS.supports("grid-template-columns", `repeat(auto-fit, minmax(${val}, 1fr))`));
    custom_setting_check("column-gap", val => CSS.supports("column-gap", val));
    custom_setting_check("row-gap", val => CSS.supports("row-gap", val));
    custom_setting_check("container-padding", val => CSS.supports("padding-left", val) && CSS.supports("padding-right", val));
  });
}

