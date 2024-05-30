// ==UserScript==
// @name        Audycja zawiera(ła) lokowanie produktu
// @namespace   uscripts.minibomba.pro
// @match       https://www.youtube.com/*
// @match       https://uscripts.minibomba.pro/audycja_zawiera_lokowanie_produktu
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @grant       GM_openInTab
// @version     1.0.1
// @homepageURL https://github.com/mini-bomba/uscripts
// @updateURL   https://raw.githubusercontent.com/mini-bomba/uscripts/master/audycja_zawiera_lokowanie_produktu.user.js
// @downloadURL https://raw.githubusercontent.com/mini-bomba/uscripts/master/audycja_zawiera_lokowanie_produktu.user.js
// @author      mini_bomba
// ==/UserScript==
(async function (){
  // Configs
  const DEFAULT_SETTINGS = {
    "trigger-sponsor": true,
    "trigger-exclusive-access": true,
    "trigger-selfpromo": false,
    "start-image-url": "https://uscripts.minibomba.pro/sponsor_begin.png",
    "end-image-url": "https://uscripts.minibomba.pro/sponsor_end.png",
  }
  function getSetting(key) {
    return GM_getValue(key, DEFAULT_SETTINGS[key]);
  }
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

  function handleSettingsPage() {
    const settings = document.getElementById("settings");
    for (const setting of settings.querySelectorAll("input")) {
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
  function sleep(ms) {
    return new Promise((res, _) => setTimeout(res, ms));
  }

  GM_registerMenuCommand("Open settings", () => GM_openInTab("https://uscripts.minibomba.pro/audycja_zawiera_lokowanie_produktu"));
  if (window.location == "https://uscripts.minibomba.pro/audycja_zawiera_lokowanie_produktu") {
    window.addEventListener("mbusc-azlp", e => e.preventDefault()); // Config page uses this to verify the script is installed
    return handleSettingsPage();
  }

  const style = document.createElement("style");
  style.innerHTML = `
    .mbusc-azlp-img {
      opacity: 0;
      max-width: 80%;
      max-height: 100%;
      flex-grow: 1;
    }
    .mbusc-azlp-container {
      height: 10%;
      width: 100%;
      position: absolute;
      z-index: 50;
      bottom: 1%;
      display: flex;
      flex-direction: column-reverse;
      align-items: center;
    }
    }
  `;
  document.head.appendChild(style);
  const animation_frames = {
    opacity: [0, 1, 1, 0],
    offset: [0, 0.1, 0.9, 1],
    easing: ["ease-in", "linear", "ease-out"],
  }

  let player_div = null;
  for (i=0;i<20;i++) {
    player_div = document.getElementById("movie_player");
    if (player_div != null) break;
    await sleep(250);
  }
  const player = player_div.querySelector("video");

  const image_div = document.createElement("div");
  image_div.classList.add("mbusc-azlp-container");
  const image = document.createElement("img");
  image.classList.add("mbusc-azlp-img");

  image_div.appendChild(image);
  player_div.appendChild(image_div);

  const animation = image.animate(animation_frames, 10000);

  player.addEventListener("play", () => {
    const category_pill = document.querySelector(".sponsorBlockCategoryPill");
    if (!category_pill) return;

    if (!(
      (category_pill.style.backgroundColor.includes("sponsor") && getSetting("trigger-sponsor"))
      || (category_pill.style.backgroundColor.includes("exclusive_access") && getSetting("trigger-exclusive-access"))
      || (category_pill.style.backgroundColor.includes("selfpromo") && getSetting("trigger-selfpromo"))
    )) return;

    animation.finish();
    image.src = getSetting("start-image-url");
    animation.play();
  });
  player.addEventListener("pause", () => {
    const category_pill = document.querySelector(".sponsorBlockCategoryPill");
    if (!category_pill) return;

    if (!(
      (category_pill.style.backgroundColor.includes("sponsor") && getSetting("trigger-sponsor"))
      || (category_pill.style.backgroundColor.includes("exclusive_access") && getSetting("trigger-exclusive-access"))
      || (category_pill.style.backgroundColor.includes("selfpromo") && getSetting("trigger-selfpromo"))
    )) return;

    animation.finish();
    image.src = getSetting("end-image-url");
    animation.play();
  });
})();