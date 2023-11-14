// ==UserScript==
// @name        Alt-click to open all images
// @namespace   uscripts.minibomba.pro
// @description Opens all images under in the clicked element on alt-click
// @version     1.4.6
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
    if (isTag(element, "picture")) for (const child of element.children) scanForBackgroundImage(child, results);
  }
  function googleSearch(u) {
    const url = new URL("https://images.google.com/searchbyimage");
    url.searchParams.set("image_url", u);
    url.searchParams.set("client", "app");
    return url.toString();
  }
  document.addEventListener("click", ev => {
    if (!ev.altKey) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    console.log(ev.target);
    let main_target = ev.target;
    const target_rect = main_target.getBoundingClientRect()
    // If a pseudoelement is clicked, and it has absolute positioning, start search at the nearest positioned element
    if ((ev.clientX > target_rect.right || ev.clientX < target_rect.left || ev.clientY > target_rect.bottom || ev.clientY < target_rect.top) && (window.getComputedStyle(main_target, ":before").position !== "static" || window.getComputedStyle(main_target, ":after").position !== "static")) {
      while (window.getComputedStyle(main_target).position === "static" && main_target !== document.body)
        main_target = main_target.parentElement;
    }
    // For flickr: if .photo-notes-scrappy-view was clicked, go up and find .photo-well-media-scrappy-view
    if (main_target.classList.contains("photo-notes-scrappy-view")) main_target = main_target.parentElement.querySelector(":scope > .photo-well-media-scrappy-view") ?? main_target;
    // If parent element has the same size as current element, go up
    while (main_target.parentElement != null && compareBoundingRects(main_target, main_target.parentElement)) {
      main_target = main_target.parentElement;
    }
    const targets = [main_target]
    // If the element has an aria-controls attribute, search these too
    const aria_controls = main_target.getAttribute("aria-controls");
    if (aria_controls != null) {
      for (const id of aria_controls.split(" ")) {
        const element = document.getElementById(id);
        if (element != null) targets.push(element);
      }
    }
    // Collect URLs
    const urls = new Set();
    // For each target:
    for (let target of targets) {
      // If this is an <img> or <source> in a <picture>, start at <picture>
      if (isTag(target, "img") || isTag(target, "source")) {
        target = target.closest("picture") ?? target;
      }
      // If no images found - go up one more time, or to the root of the svg element
      if (!isTag(target, "img") && !isTag(target, "image") && !isTag(target, "picture") && target.parentElement != null && target.querySelector("img, image, picture") == null) {
        target = target.closest("svg") ?? target.parentElement;
      }
      // Find all img elements under the element
      const imgs = Array.from(target.querySelectorAll("img"));
      const images = Array.from(target.querySelectorAll("image"));
      const pictures = Array.from(target.querySelectorAll("picture"));
      // Check if target is an image
      switch(target.nodeName) {
        case "IMG":
          imgs.push(target);
          break;
        case "IMAGE":
          images.push(target);
          break;
        case "PICTURE":
          pictures.push(target);
          break;
      }
      // Add any images found
      for (const i of imgs) {
        if (i.closest("picture") == null && checkVisible(i))
          urls.add(i.src)
      }
      for (const i of images) {
        if (checkVisible(i)){
          urls.add(i.href.baseVal);
          urls.add(i.href.animVal);
        }
      }
      for (const p of pictures) {
        if (checkVisible(p)){
          let anyMatched = false;
          for (const s of p.querySelectorAll("source")) {
            if (!s.media || matchMedia(s.media).matches) {
              anyMatched = true;
              const sources = s.srcset.split(",").map(x => {
                const parts = x.trim().split(" ");
                return [parts[0], parseFloat(parts[1]) ?? 1]
              })
              urls.add(sources.sort((a,b) => b[1]-a[1])[0][0]);
            }
          }
          if (!anyMatched) {
            for (const i of p.querySelectorAll("img")) {
                urls.add(i.src)
            }
          }
        }
      }
      // Also try to check any background-image CSS rules
      try {
        scanForBackgroundImage(target, urls);
      } catch (e) {
        console.error("Failed to scan for CSS images", e);
      }
    }
    // Ask for confirmation when opening > 5 tabs
    if (urls.size > 5 && last_size !== urls.size) {
      last_size = urls.size;
      GM_notification(`About to open ${urls.size} tabs. Alt-click again to continue.`);
      return;
    }
    last_size = null;
    // Open all images
    for (const u of urls) if (u != null) GM_openInTab(ev.ctrlKey ? googleSearch(u) : u);
  }, {capture: true});
  // Block other click events on alt-click
  function blockOnAlt(event) {
    if (!event.altKey) return;
    event.stopImmediatePropagation();
  }
  document.addEventListener("mouseup", blockOnAlt, {capture: true});
  document.addEventListener("mousedown", blockOnAlt, {capture: true});
})();
