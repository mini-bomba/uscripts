// ==UserScript==
// @name        sejm.gov.pl livestream shortcuts
// @namespace   uscripts.minibomba.pro
// @description Adds keyboard shortcut support to sejm.gov.pl live streams
// @match       *://sejm-embed.redcdn.pl/Sejm10.nsf/VideoFrame.xsp/*
// @match       https://uscripts.minibomba.pro/sejm-shortcuts
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @version     1.2.0
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
  const DEFAULT_SETTINGS = {
    "volume-scroll-mult": 0.025,
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

  GM_registerMenuCommand("Open settings", () => GM_openInTab("https://uscripts.minibomba.pro/sejm-shortcuts"));
  if (window.location == "https://uscripts.minibomba.pro/sejm-shortcuts") {
    window.addEventListener("mbusc-sejm-shortcuts", e => e.preventDefault()); // Config page uses this to verify the script is installed
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
    return;
  }

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
    player.setVolume(current_vol + ev.deltaY*getSetting("volume-scroll-mult"));
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
