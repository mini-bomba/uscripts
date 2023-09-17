// ==UserScript==
// @name        Alt-click to open all images
// @namespace   uscripts.minibomba.pro
// @description Opens all images under in the clicked element on alt-click
// @version     1.2.0
// @match       *://*/*
// @grant       GM_openInTab
// @grant       GM_notification
// @run-at      document-start
// @updateURL   https://raw.githubusercontent.com/mini-bomba/uscripts/master/altclick-images.user.js
// @downloadURL https://raw.githubusercontent.com/mini-bomba/uscripts/master/altclick-images.user.js
// @author      mini_bomba
// ==/UserScript==
(function (){
  let last_size = null;
  document.addEventListener("click", ev => {
    if (!ev.altKey) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    let target = ev.target;
    // For flickr: if .photo-notes-scrappy-view was clicked, go up and find .photo-well-media-scrappy-view
    if (target.classList.contains("photo-notes-scrappy-view")) target = target.parentElement.querySelector(":scope > .photo-well-media-scrappy-view") ?? target;
    // If parent element has the same size as current element, go up
    while (target.parentElement != null && target.clientWidth === target.parentElement.clientWidth && target.clientHeight == target.parentElement.clientHeight) {
      target = target.parentElement;
    }
    // Find all img elements under the element
    const imgs = target.querySelectorAll("img");
    // Deduplicate urls
    const urls = new Set();
    if (target.tagName.toLowerCase() === "img") urls.add(target.src); // include target if it's an img element
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
