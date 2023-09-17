// ==UserScript==
// @name        Alt-click to open all images
// @namespace   uscripts.minibomba.pro
// @description Opens all images under in the clicked element on alt-click
// @version     1.0.1
// @match       *://*/*
// @grant       GM_openInTab
// @grant       GM_notification
// @updateURL   https://raw.githubusercontent.com/mini-bomba/uscripts/master/altclick-images.user.js
// @downloadURL https://raw.githubusercontent.com/mini-bomba/uscripts/master/altclick-images.user.js
// @author      mini_bomba
// ==/UserScript==
(function (){
  let last_size = null;
  document.body.addEventListener("click", ev => {
    if (!ev.altKey) return;
    ev.preventDefault();
    // Find all img elements under the element
    const imgs = ev.target.querySelectorAll("img");
    // Deduplicate urls
    const urls = new Set();
    if (ev.target.tagName.toLowerCase() === "img") urls.add(ev.target.src); // include target if it's an img element
    for (const i of imgs) urls.add(i.src);
    // Ask for confirmation when opening > 5 tabs
    if (urls.size > 5 && last_size !== urls.size) {
      last_size = urls.size;
      GM_notification(`About to open ${urls.size} tabs. Alt-click again to continue.`);
      return;
    }
    last_size = null;
    // Open all images
    for (const u of urls) if (u != null) GM_openInTab(u);
  });
