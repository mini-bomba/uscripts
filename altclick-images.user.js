// ==UserScript==
// @name        Alt-click to open all images
// @namespace   uscripts.minibomba.pro
// @description Opens all images under in the clicked element on alt-click
// @version     1.6.9
// @match       *://*/*
// @grant       GM_openInTab
// @grant       GM_notification
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @run-at      document-start
// @homepageURL https://github.com/mini-bomba/uscripts
// @updateURL   https://raw.githubusercontent.com/mini-bomba/uscripts/master/altclick-images.user.js
// @downloadURL https://raw.githubusercontent.com/mini-bomba/uscripts/master/altclick-images.user.js
// @author      mini_bomba
// ==/UserScript==
(function (){
  const DEFAULT_SETTINGS = {
    "image-tab-behaviour": "11",
    "search-tab-behaviour": "11",
    "debug-logs": false,
    "debug-breakpoints": false,
  }
  const CSS_URL_REGEX = /url\("(.+)"\)/;
  const NUMBER_REGEX = /\d+/;
  const realConsoleLog = console.log.bind(console);
  let last_size = null;

  // == HELPER FUNCTIONS == //
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
    return element_rect.right >= body_rect.left && element_rect.bottom >= body_rect.top &&              // cut off by body's      left or top edge
           element_rect.right >= container_rect.left && element_rect.bottom >= container_rect.top &&    // cut off by container's left or top edge
          (containerStyle.overflowX !== "hidden" || element_rect.left <= container_rect.right) &&      // cut off by container's right edge when overflow-x: hidden
          (containerStyle.overflowY !== "hidden" || element_rect.top <= container_rect.bottom);        // cut off by container's bottom edge when overflow-y: hidden
  }

  function debugLog() {
    if (getSetting("debug-logs")) realConsoleLog.apply(console, arguments);
  }

  function _scanForBackgroundImage(element, results, previously_scanned) {
    if (element == previously_scanned) return;
    if (isTag(element, "picture") || isTag(element, "img") || isTag(element, "image")) {
      debugLog("Ending backgroundImage scan at picture/img/image", element);
      return;
    }
    const url = CSS_URL_REGEX.exec(window.getComputedStyle(element).backgroundImage);
    if (url != null) {
      if (checkVisible(element)) {
        results.add(url[1]);
        debugLog("Found backgroundImage URL", url[1], "on", element);
      } else debugLog("backgroundImage of", element, "discarded due to visibility checks");
    }
    for (const child of element.children) _scanForBackgroundImage(child, results, previously_scanned);
  }
  function scanForBackgroundImage(element, results, previously_scanned) {
    const before = results.size;
    try {
      _scanForBackgroundImage(element, results, previously_scanned);
    } catch (e) {
      console.error("Failed to scan for CSS images", e);
    }
    return results.size - before
  }

  function pickBestSrcset(srcset) {
    const sources = srcset.split(", ").map(x => {
      const parts = x.trim().split(" ");
      return [parts[0], parseFloat(parts[1]) ?? 1]
    })
    return sources.sort((a,b) => b[1]-a[1])[0][0];
  }

  function googleSearch(u) {
    const url = new URL("https://images.google.com/searchbyimage");
    url.searchParams.set("image_url", u);
    url.searchParams.set("client", "app");
    return url.toString();
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

  function getSetting(key) {
    return GM_getValue(key, DEFAULT_SETTINGS[key]);
  }


  // == MAIN CODE == //
  document.addEventListener("click", ev => {
    if (!ev.altKey) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    if (getSetting("debug-breakpoints")) debugger;
    let main_target = ev.target;
    debugLog("Clicked on", main_target);
    const target_rect = main_target.getBoundingClientRect()
    // If a pseudoelement is clicked, and it has absolute positioning, start search at the nearest positioned element
    if ((ev.clientX > target_rect.right || ev.clientX < target_rect.left || ev.clientY > target_rect.bottom || ev.clientY < target_rect.top) && (window.getComputedStyle(main_target, ":before").position !== "static" || window.getComputedStyle(main_target, ":after").position !== "static")) {
      debugLog("Pseudoelement clicked, going up");
      while (window.getComputedStyle(main_target).position === "static" && main_target !== document.body)
        main_target = main_target.parentElement;
      debugLog("Pseudoelement loop finished at", main_target);
    }

    // == SITE-SPECIFIC FIXES == //

    // For flickr: if .photo-notes-scrappy-view was clicked, go up and find .photo-well-media-scrappy-view
    if (main_target.classList.contains("photo-notes-scrappy-view"))
      main_target = main_target.parentElement.querySelector(":scope > .photo-well-media-scrappy-view") ?? main_target;

    // For lepictorium.fr: If we clicked under .preview-thumbnail-hover, go up to .thumb-container, then down to .preview-thumbnail
    if (document.location.host.endsWith("lepictorium.fr") && main_target.closest(".preview-thumbnail-hover"))
      main_target = main_target.closest(".thumb-container")?.querySelector(".preview-thumbnail") ?? main_target

    // == END OF SITE-SPECIFIC FIXES == //

    // If parent element has the same size as current element, but is not an image itself, go up
    while (main_target.parentElement != null && !isTag(main_target, "img") && !isTag(main_target, "picture") && !isTag(main_target, "image") && compareBoundingRects(main_target, main_target.parentElement)) {
      debugLog("Same-size element, going up");
      main_target = main_target.parentElement;
    }
    const targets = [main_target]
    // If the element has an aria-controls attribute, search these too
    const aria_controls = main_target.getAttribute("aria-controls");
    if (aria_controls != null) {
      debugLog("aria-controls found on main target, adding these to target list");
      for (const id of aria_controls.split(" ")) {
        const element = document.getElementById(id);
        if (element != null) {
          targets.push(element);
          debugLog("Added", element);
        }
      }
    }
    debugLog("Final list of targets", targets);
    // Collect URLs
    let urls = new Set();
    // For each target:
    for (let target of targets) {
      // If this is an <img> or <source> in a <picture>, start at <picture>
      if (isTag(target, "img") || isTag(target, "source")) {
        const closest_picture = target.closest("picture")
        if (closest_picture != null) {
          debugLog("Going up on target", target, "due to an enclosing <picture> element");
          target = closest_picture;
        }
      }
      // If no images found - go up one more time, or to the root of the svg element
      if (scanForBackgroundImage(target, urls) == 0 && !isTag(target, "img") && !isTag(target, "image") && !isTag(target, "picture") && target.parentElement != null && target.querySelector("img, image, picture") == null) {
        debugLog("Going up on target", target, "due to a lack of images");
        const prev_target = target;
        target = target.closest("svg") ?? target.parentElement;
        scanForBackgroundImage(target, urls, prev_target);
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
        if (i.closest("picture") == null && checkVisible(i)) {
          if (i.srcset) urls.add(pickBestSrcset(i.srcset))
          else urls.add(i.src)
        } else {
          debugLog(i, "discarded due to visibility/<picture> checks");
        }
      }
      for (const i of images) {
        if (checkVisible(i)){
          urls.add(i.href.baseVal);
          urls.add(i.href.animVal);
        } else {
          debugLog(i, "discarded due to visibility checks");
        }
      }
      for (const p of pictures) {
        if (checkVisible(p)){
          let matched = {};
          for (const s of p.querySelectorAll("source")) {
            if (!s.media || matchMedia(s.media).matches) {
              const best_url = pickBestSrcset(s.srcset);
              const media_size = Number(NUMBER_REGEX.exec(s.media)?.[0])
              if (matched[best_url] == undefined || (!isNaN(media_size) && (isNaN(matched[best_url] || matched[best_url] < media_size)))) {
                matched[best_url] = media_size
              }
            }
          }
          if (Object.keys(matched).length == 0) {
            debugLog(p, "had no <source> matches, using <img> fallback urls");
            for (const i of p.querySelectorAll("img")) {
                urls.add(i.src)
            }
          } else {
            debugLog("<source> matches for", p, matched);
            const best_url = Object.entries(matched).sort((a, b) => b[1]-a[1])[0][0];
            debugLog(`Best match: ${best_url}`);
            urls.add(best_url);
          }
        } else {
          debugLog(p, "discarded due to visibility checks");
        }
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
    urls = Array.from(urls);
    debugLog("Final list of URLs", urls);
    let first_url = undefined;
    if (getSetting(ev.ctrlKey ? "search-tab-behaviour" : "image-tab-behaviour") == "00") {
      first_url = urls.shift();
    }
    for (const u of urls) if (u != null) GM_openInTab(ev.ctrlKey ? googleSearch(u) : u, { active: getSetting(ev.ctrlKey ? "search-tab-behaviour" : "image-tab-behaviour") == "11", insert: true });
    if (first_url != undefined) window.location = ev.ctrlKey ? googleSearch(first_url) : first_url;
  }, {capture: true});
  // Block other click events on alt-click
  function blockOnAlt(event) {
    if (!event.altKey) return;
    event.stopImmediatePropagation();
  }
  document.addEventListener("mouseup", blockOnAlt, {capture: true});
  document.addEventListener("mousedown", blockOnAlt, {capture: true});

  // Configuration page
  function handleSettingChange(event) {
    if ((isTag(event.target, "input") || isTag(event.target, "select")) && event.target.checkValidity()) switch (event.target.type) {
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
  async function handleConfigPage() {
    await waitUntilInteractive(); // Wait until we've loaded the DOM

    const settings = document.getElementById("settings");
    for (const setting of settings.querySelectorAll("input, select")) {
      if (setting.type === "checkbox") {
        setting.checked = getSetting(setting.id);
      } else {
        setting.value = getSetting(setting.id);
      }
    }
    settings.addEventListener("change", handleSettingChange);

    document.getElementById("not-installed").classList.add("hidden");
    settings.classList.remove("hidden");
  }

  if (window.location == "https://uscripts.minibomba.pro/altclick-images") {
    window.addEventListener("mbusc-altclick-images", e => e.preventDefault()); // Config page uses this to verify the script is installed
    handleConfigPage();
  }
  GM_registerMenuCommand("Open settings", () => GM_openInTab("https://uscripts.minibomba.pro/altclick-images"));
})();
