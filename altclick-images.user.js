// ==UserScript==
// @name        Alt-click to open all images
// @namespace   uscripts.minibomba.pro
// @description Opens all images under in the clicked element on alt-click
// @version     1.3.3
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
  const CSS_URL_REGEX = /url\("(.+)"\)/;
  let last_size = null;
  function isTag(element, tag) {
    return element.tagName.toLowerCase() === tag.toLowerCase();
  }
  function compareBoundingRects(e1, e2) {
    const r1 = e1.getBoundingClientRect();
    const r2 = e2.getBoundingClientRect();
    return r1.top === r2.top && r1.right === r2.right && r1.bottom === r2.bottom && r1.left === r2.left;
  }
  function findNearestOverflowContainer(element) {
    if (element !== document.body) element = element.parentElement;
    while (element !== document.body && window.getComputedStyle(element).overflowX === "visible" && window.getComputedStyle(element).overflowY === "visible") {
      element = element.parentElement;
    }
    return element;
  }
  function checkVisible(element) {
    if(!element.checkVisibility()) return false;  // display: none
    const container = findNearestOverflowContainer(element);
    if (container !== document.body && !checkVisible(container)) return false;
    const containerStyle = window.getComputedStyle(container);
    const element_rect = element.getBoundingClientRect();
    const container_rect = container.getBoundingClientRect();
    const body_rect = document.body.getBoundingClientRect();
    return element_rect.right > body_rect.left && element_rect.bottom > body_rect.top &&              // cut off by body's      left or top edge
           element_rect.right > container_rect.left && element_rect.bottom > container_rect.top &&    // cut off by container's left or top edge
          (containerStyle.overflowX !== "hidden" || element_rect.left < container_rect.right) &&      // cut off by container's right edge when overflow-x: hidden
          (containerStyle.overflowY !== "hidden" || element_rect.top < container_rect.bottom);        // cut off by container's bottom edge when overflow-y: hidden
  }
  function scanForBackgroundImage(element, results) {
    const url = CSS_URL_REGEX.exec(window.getComputedStyle(element).backgroundImage);
    if (url != null && checkVisible(element)) results.add(url[1]);
    for (const child of element.children) scanForBackgroundImage(child, results);
  }
  document.addEventListener("click", ev => {
    if (!ev.altKey) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    let target = ev.target;
    const target_rect = target.getBoundingClientRect()
    // If a pseudoelement is clicked, and it has absolute positioning, start search at the nearest positioned element
    if ((ev.clientX > target_rect.right || ev.clientX < target_rect.left || ev.clientY > target_rect.bottom || ev.clientY < target_rect.top) && (window.getComputedStyle(target, ":before").position !== "static" || window.getComputedStyle(target, ":after").position !== "static")) {
      while (window.getComputedStyle(target).position === "static" && target !== document.body)
        target = target.parentElement;
    }
    // For flickr: if .photo-notes-scrappy-view was clicked, go up and find .photo-well-media-scrappy-view
    if (target.classList.contains("photo-notes-scrappy-view")) target = target.parentElement.querySelector(":scope > .photo-well-media-scrappy-view") ?? target;
    // If parent element has the same size as current element, go up
    while (target.parentElement != null && compareBoundingRects(target, target.parentElement)) {
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
    if (isTag(target, "image")) {
      urls.add(target.href.baseVal);
      urls.add(target.href.animVal);
    }
    // Add any images found
    for (const i of imgs) {
      if (checkVisible(i))
        urls.add(i.src)
    }
    for (const i of images) {
      if (checkVisible(i)){
        urls.add(i.href.baseVal);
        urls.add(i.href.animVal);
      }
    }
    // Also try to check any background-image CSS rules
    try {
      scanForBackgroundImage(target, urls);
    } catch (e) {
      console.error("Failed to scan for CSS images", e);
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
