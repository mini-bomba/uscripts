// ==UserScript==
// @name        sejm.gov.pl livestream shortcuts
// @namespace   uscripts.minibomba.pro
// @description Adds keyboard shortcut support to sejm.gov.pl live streams
// @match       *://sejm-embed.redcdn.pl/Sejm10.nsf/VideoFrame.xsp/*
// @grant       none
// @version     1.1.0
// @homepageURL https://github.com/mini-bomba/uscripts
// @updateURL   https://raw.githubusercontent.com/mini-bomba/uscripts/master/sejm.gov.pl-shortcuts.user.js
// @downloadURL https://raw.githubusercontent.com/mini-bomba/uscripts/master/sejm.gov.pl-shortcuts.user.js
// @author      mini_bomba
// ==/UserScript==
//
// Available shortcuts:
// Number keys:          Switch cameras
// J/L/Left/Right arrow: seek (5s)
// Up/Down arrow:        volume up/down
// M:                    mute/unmute
// Space/K:              pause/unpause
// F:                    toggle fullscreen
// E:                    toggle event list visibility in fullscreen mode
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
      let vol = player.getVolume();
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
