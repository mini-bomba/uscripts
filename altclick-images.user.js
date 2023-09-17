// ==UserScript==
// @name        Alt-click to open all images
// @namespace   uscripts.minibomba.pro
// @description Opens all images under in the clicked element on alt-click
// @version     1.2.1
// @match       *://*/*
// @grant       GM_openInTab
// @grant       GM_notification
// @run-at      document-start
// @homepageURL https://github.com/mini-bomba/uscripts
// @updateURL   https://raw.githubusercontent.com/mini-bomba/uscripts/master/altclick-images.user.js
// @downloadURL https://raw.githubusercontent.com/mini-bomba/uscripts/master/altclick-images.user.js
// @author      mini_bomba
// ==/UserScript==
(function (){
  let last_size = null;
  function isTag(element, tag) {
    return element.tagName.toLowerCase() === tag.toLowerCase();
  }
  document.addEventListener("click", ev => {
    if (!ev.altKey) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    let target = ev.target;
    // If parent element has the same size as current element, go up
    while (target.parentElement != null && target.clientWidth === target.parentElement.clientWidth && target.clientHeight == target.parentElement.clientHeight) {
      target = target.parentElement;
    }
    // Find all img elements under the element
    let imgs = target.querySelectorAll("img");
    // If no images found - go up one more time
    if (!isTag(target, "img") && target.parentElement != null && imgs.length === 0) {
      target = target.parentElement;
      imgs = target.querySelectorAll("img");
    }
    // Deduplicate urls
    const urls = new Set();
    if (isTag(target, "img")) urls.add(target.src); // include target if it's an img element
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
  }, {capture: true});
  // Block other click events on alt-click
  function blockOnAlt(event) {
    if (!event.altKey) return;
    event.stopImmediatePropagation();
  }
  document.addEventListener("mouseup", blockOnAlt, {capture: true});
  document.addEventListener("mousedown", blockOnAlt, {capture: true});
})();
