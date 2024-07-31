// ==UserScript==
// @name        sejm.gov.pl livestream shortcuts
// @namespace   uscripts.minibomba.pro
// @description Adds keyboard shortcut support to sejm.gov.pl live streams
// @match       *://sejm-embed.redcdn.pl/Sejm10.nsf/VideoFrame.xsp/*
// @match       https://uscripts.minibomba.pro/sejm-shortcuts
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @require     https://raw.githubusercontent.com/mini-bomba/uscripts/master/utils/general.js
// @require     https://raw.githubusercontent.com/mini-bomba/uscripts/master/utils/settings.js
// @version     1.2.1
// @homepageURL https://github.com/mini-bomba/uscripts
// @updateURL   https://raw.githubusercontent.com/mini-bomba/uscripts/master/sejm.gov.pl-shortcuts.user.js
// @downloadURL https://raw.githubusercontent.com/mini-bomba/uscripts/master/sejm.gov.pl-shortcuts.user.js
// @author      mini_bomba
// ==/UserScript==
//
// Available shortcuts:
// Number keys:          Switch cameras
// J/L/Left/Right arrow: seek (5s)
// Up/Down arrow/scroll: volume up/down
// M:                    mute/unmute
// Space/K:              pause/unpause
// F:                    toggle fullscreen
// E:                    toggle event list visibility in fullscreen mode
(function (){
  // Configs
  const { SETTINGS, on_the_config_page } = settingsSetup({
    default_settings: {
      volume_scroll_mult: 0.025,
    },
    settings_page_name: "sejm-shortcuts",
    settings_event_name: "mbusc-sejm-shortcuts",
  });
  if (on_the_config_page) return;

  let saved_player_volume = 0;
  document.addEventListener("keydown", ev => {
    const numberkey_value = parseInt(ev.key);
    if (!isNaN(numberkey_value)) {
      return playVideo((numberkey_value === 0 ? 10 : numberkey_value)-1);
    }
    switch (ev.key) {
      case "ArrowLeft":
      case "j":
      case "J":
        seek(-5);
        break;
      case "ArrowRight":
      case "l":
      case "L":
        seek(5);
        break;
      case "ArrowUp":
        volUp();
        break;
      case "ArrowDown":
        volDown();
        break;
      case " ":
      case "k":
      case "K":
        if (player.isPaused()) play();
        else pause();
        break;
      case "f":
      case "F":
        fullscreen();
        break;
      case "m":
      case "M":
        const vol = player.getVolume();
        if (vol == 0) {
          player.setVolume(saved_player_volume);
        } else {
          saved_player_volume = vol;
          player.setVolume(0);
        }
        break;
      case "e":
      case "E":
        document.getElementById("redcdnplayer").classList.toggle("event-list-visible");
        break;
    }
  });
  document.addEventListener("wheel", ev => {
    if (ev.target.nodeName !== "VIDEO") return;
    ev.preventDefault();
    let current_vol = player.getVolume();
    if (current_vol == 0) current_vol = saved_player_volume;
    player.setVolume(current_vol + ev.deltaY*SETTINGS.volume_scroll_mult);
  }, { passive: false });
  const style_element = document.createElement("style");
  style_element.innerHTML = `
  .mode-fullscreen.event-list-visible .atdsplayer-messages {
    display: block;
  }
  .mode-fullscreen.event-list-visible .atdsplayer-messages > *:not(.atdsplayer-event-list) {
    display: none;
  }
  `;
  document.head.appendChild(style_element);
})();
