// ==UserScript==
// @name        Twitter redirect
// @namespace   uscripts.minibomba.pro
// @match       *://x.com/*
// @match       *://twitter.com/*
// @match       https://uscripts.minibomba.pro/twitter_redirect
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @run-at      document-start
// @version     1.0
// @author      mini_bomba
// @updateURL   https://raw.githubusercontent.com/mini-bomba/uscripts/master/twitter_redirect.user.js
// @downloadURL https://raw.githubusercontent.com/mini-bomba/uscripts/master/twitter_redirect.user.js
// @description A stupidly simple twitter redirect userscript
// ==/UserScript==

// The actual redirect code:
if (window.location.host == "x.com" || window.location.host == "twitter.com") window.location.host = GM_getValue("target-host", "xcancel.com");
// yes, it's a one-liner



// Configuration page boilerplate
GM_registerMenuCommand("Open settings", () => GM_openInTab("https://uscripts.minibomba.pro/twitter_redirect"));
if (window.location != "https://uscripts.minibomba.pro/twitter_redirect") return;
(function() {
  function handleSettingChange(event) {
    if (event.target.nodeName === "INPUT" && event.target.checkValidity()) switch (event.target.type) {
      case "checkbox":
        GM_setValue(event.target.id, event.target.checked);
        break;
      case "number":
        let val = Number(event.target.value)
        if (!isNaN(val)) GM_setValue(event.target.id, val);
        break;
      default:
        GM_setValue(event.target.id, event.target.value);
    }
  }

  function waitUntilInteractive() {
    if (document.readyState == "loading") {
      return new Promise((res, _) => {
        document.addEventListener("readystatechange", e => res(), {once: true});
      });
    } else {
      return Promise.resolve();
    }
  }

  async function handleSettingsPage() {
    await waitUntilInteractive(); // wait until the dom has loaded

    const settings = document.getElementById("settings")
    const setting = settings.querySelector("input#target-host");
    setting.value = GM_getValue("target_host", "xcancel.com");
    setting.addEventListener("change", ev => {
      if (!ev.target.checkValidity() || ev.target.nodeName !== "INPUT" || ev.target.id !== "target-host") return;
      GM_setValue("target-host", ev.target.value);
    });

    document.getElementById("not-installed").classList.add("hidden");
    settings.classList.remove("hidden");
  }

  window.addEventListener("mbusc-tr", e => e.preventDefault()); // Config page uses this to verify the script is installed
  handleSettingsPage();
})()