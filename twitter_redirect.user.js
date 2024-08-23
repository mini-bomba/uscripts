// ==UserScript==
// @name        Twitter redirect
// @namespace   uscripts.minibomba.pro
// @match       *://x.com/*
// @match       *://twitter.com/*
// @match       https://uscripts.minibomba.pro/twitter_redirect
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @grant       GM_openInTab
// @require     https://raw.githubusercontent.com/mini-bomba/uscripts/master/utils/general.js
// @require     https://raw.githubusercontent.com/mini-bomba/uscripts/master/utils/settings.js
// @run-at      document-start
// @version     1.0.2
// @author      mini_bomba
// @updateURL   https://raw.githubusercontent.com/mini-bomba/uscripts/master/twitter_redirect.user.js
// @downloadURL https://raw.githubusercontent.com/mini-bomba/uscripts/master/twitter_redirect.user.js
// @description A stupidly simple twitter redirect userscript
// ==/UserScript==

// Configuration page boilerplate
const { SETTINGS, on_the_config_page } = settingsSetup({
  default_settings: {
    target_host: "xcancel.com",
  },
  settings_page_name: "twitter_redirect",
  settings_event_name: "mbusc-tr",
});

// The actual redirect code:
if (!on_the_config_page) window.location.host = SETTINGS.target_host;
// yes, it's a one-liner
