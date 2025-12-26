// ==UserScript==
// @name          SBB number reformat
// @namespace     uscripts.minibomba.pro
// @match         *://sb.ltn.fi/*
// @match         https://uscripts.minibomba.pro/sbb_numreformat
// @grant         GM_getValue
// @grant         GM_setValue
// @grant         GM_registerMenuCommand
// @grant         GM_openInTab
// @require       https://raw.githubusercontent.com/mini-bomba/uscripts/master/utils/general.js
// @require       https://raw.githubusercontent.com/mini-bomba/uscripts/master/utils/settings.js
// @version       1.0.0
// @author        mini_bomba
// @updateURL     https://raw.githubusercontent.com/mini-bomba/uscripts/master/sb.ltn.fi-number-reformat.user.js
// @downloadURL   https://raw.githubusercontent.com/mini-bomba/uscripts/master/sb.ltn.fi-number-reformat.user.js
// @description   Reformats the view/segment counts in SBB according to user settings (adding thousands separators)
// ==/UserScript==

const { SETTINGS, on_the_config_page } = settingsSetup({
  default_settings: {
    locale: "",
  },
  validity_checks: {
    locale: val => {
      try {
        (1000).toLocaleString(val);
        return true
      } catch {
        return "Invalid locale!";
      }
    },
  },
  settings_page_name: "sbb_numreformat",
  settings_event_name: "mbusc-sbbnref",
});

if (!on_the_config_page) {
  const theTable = document.querySelector("table");
  const NUM_REGEX = /^\d+$/;

  const reformatNumber = (num) => num.toLocaleString(SETTINGS.locale);

  // find the views column index
  const viewsColIdx = Array.from(theTable.rows[0].cells).findIndex(x => x.innerText === "Views");

  function reformatNode(node) {
    if (node.nodeType !== Node.TEXT_NODE || node.formatted === true) return;
    node.textContent = node.textContent.replaceAll(
      /(^|\s)(\d{1,10})($|\s)/g,
      (_, before, num, after) => `${before}${reformatNumber(parseInt(num))}${after}`,
    );
    node.formatted = true;
  }

  function doReformat() {
    for (const row of theTable.rows) {
      const cell = row.cells[viewsColIdx];
      if (NUM_REGEX.test(cell.innerText)) cell.innerText = reformatNumber(parseInt(cell.innerText));
    }

    // reformat all stat boxes
    for (const cell of document.querySelectorAll(".list-group-item")) {
      for (const node of cell.childNodes) {
        reformatNode(node);
        // recurse once into <span>s (contains text with hover actions)
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "SPAN") {
          for (const subnode of node.childNodes) reformatNode(subnode);
        }
      }
    }
  }

  // reformat now + hook into force refresh
  doReformat();
  document.addEventListener("forceRefresh", doReformat);
}