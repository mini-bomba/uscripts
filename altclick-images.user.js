// ==UserScript==
// @name        Alt-click to open all images
// @namespace   uscripts.minibomba.pro
// @description Opens all images under in the clicked element on alt-click
// @version     1.3.0
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
    // For flickr: if .photo-notes-scrappy-view was clicked, go up and find .photo-well-media-scrappy-view
    if (target.classList.contains("photo-notes-scrappy-view")) target = target.parentElement.querySelector(":scope > .photo-well-media-scrappy-view") ?? target;
    // If parent element has the same size as current element, go up
    while (target.parentElement != null && target.clientWidth === target.parentElement.clientWidth && target.clientHeight == target.parentElement.clientHeight) {
      target = target.parentElement;
    }
    // If no images found - go up one more time
    if (!isTag(target, "img") && !isTag(target, "image") && target.parentElement != null && target.querySelector("img, image") == null) {
      target = target.parentElement;
    }
    // Find all img elements under the element
    const imgs = target.querySelectorAll("img");
    const images = target.querySelectorAll("image");
    // Collect URLs
    const urls = new Set();
    // Check if target is an image
    if (isTag(target, "img")) urls.add(target.src);
    if (isTag(target, "imgage")) {
      urls.add(target.href.baseVal);
      urls.add(target.href.animVal);
    }
    // Add any images found
    for (const i of imgs) urls.add(i.src);
    for (const i of images) {
      urls.add(i.href.baseVal);
      urls.add(i.href.animVal);
    }
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
