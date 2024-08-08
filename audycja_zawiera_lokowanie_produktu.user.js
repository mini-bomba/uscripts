// ==UserScript==
// @name        Audycja zawiera(ła) lokowanie produktu
// @namespace   uscripts.minibomba.pro
// @match       https://www.youtube.com/*
// @match       https://uscripts.minibomba.pro/audycja_zawiera_lokowanie_produktu
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @grant       GM_openInTab
// @require     https://raw.githubusercontent.com/mini-bomba/uscripts/master/utils/general.js
// @require     https://raw.githubusercontent.com/mini-bomba/uscripts/master/utils/settings.js
// @version     1.0.3
// @homepageURL https://github.com/mini-bomba/uscripts
// @updateURL   https://raw.githubusercontent.com/mini-bomba/uscripts/master/audycja_zawiera_lokowanie_produktu.user.js
// @downloadURL https://raw.githubusercontent.com/mini-bomba/uscripts/master/audycja_zawiera_lokowanie_produktu.user.js
// @author      mini_bomba
// ==/UserScript==
(async function (){
  // Configs
  const { SETTINGS, on_the_config_page } = settingsSetup({
    default_settings: {
      trigger_sponsor: true,
      trigger_exclusive_access: true,
      trigger_selfpromo: false,
      start_image_url: "https://uscripts.minibomba.pro/sponsor_begin.png",
      end_image_url: "https://uscripts.minibomba.pro/sponsor_end.png",
    },
    settings_page_name: "audycja_zawiera_lokowanie_produktu",
    settings_event_name: "mbusc-azlp",
    stop_execution_on_config_page: true,
  });

  if (on_the_config_page) return;

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
    if (!category_pill || !category_pill.checkVisibility()) return;

    if (!(
      (category_pill.style.backgroundColor.includes("sponsor") && SETTINGS.trigger_sponsor)
      || (category_pill.style.backgroundColor.includes("exclusive_access") && SETTINGS.trigger_exclusive_access)
      || (category_pill.style.backgroundColor.includes("selfpromo") && SETTINGS.trigger_selfpromo)
    )) return;

    animation.finish();
    image.src = SETTINGS.start_image_url;
    animation.play();
  });
  player.addEventListener("pause", () => {
    const category_pill = document.querySelector(".sponsorBlockCategoryPill");
    if (!category_pill || !category_pill.checkVisibility()) return;

    if (!(
      (category_pill.style.backgroundColor.includes("sponsor") && SETTINGS.trigger_sponsor)
      || (category_pill.style.backgroundColor.includes("exclusive_access") && SETTINGS.trigger_exclusive_access)
      || (category_pill.style.backgroundColor.includes("selfpromo") && SETTINGS.trigger_selfpromo)
    )) return;

    animation.finish();
    image.src = SETTINGS.end_image_url;
    animation.play();
  });
})();
