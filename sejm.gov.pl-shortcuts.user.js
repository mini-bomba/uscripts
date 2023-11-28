// ==UserScript==
// @name        sejm.gov.pl livestream shortcuts
// @namespace   uscripts.minibomba.pro
// @description Adds keyboard shortcut support to sejm.gov.pl live streams
// @match       *://sejm-embed.redcdn.pl/Sejm10.nsf/VideoFrame.xsp/*
// @grant       none
// @version     1.0.0
// @homepageURL https://github.com/mini-bomba/uscripts
// @updateURL   https://raw.githubusercontent.com/mini-bomba/uscripts/master/sejm.gov.pl-shortcuts.user.js
// @downloadURL https://raw.githubusercontent.com/mini-bomba/uscripts/master/sejm.gov.pl-shortcuts.user.js
// @author      mini_bomba
// ==/UserScript==
//
// Available shortcuts:
// Number keys:      Switch cameras
// Left/Right arrow: seek (5s)
// Up/Down arrow:    volume up/down
// M:                mute/unmute
// Space/K:          pause/unpause
// F:                toggle fullscreen
let saved_player_volume = 0;
document.addEventListener("keydown", ev => {
  ev.preventDefault();
  const numberkey_value = parseInt(ev.key);
  if (!isNaN(numberkey_value)) {
    ev.preventDefault();
    ev.stopImmediatePropagation();
    return playVideo((numberkey_value === 0 ? 10 : numberkey_value)-1);
  }
  switch (ev.key) {
    case "ArrowLeft":
      ev.preventDefault();
      ev.stopImmediatePropagation();
      seek(-5);
      break;
    case "ArrowRight":
      ev.preventDefault();
      ev.stopImmediatePropagation();
      seek(5);
      break;
    case "ArrowUp":
      ev.preventDefault();
      ev.stopImmediatePropagation();
      volUp();
      break;
    case "ArrowDown":
      ev.preventDefault();
      ev.stopImmediatePropagation();
      volDown();
      break;
    case " ":
    case "k":
    case "K":
      ev.preventDefault();
      ev.stopImmediatePropagation();
      if (player.isPaused()) play();
      else pause();
      break;
    case "f":
    case "F":
      ev.preventDefault();
      ev.stopImmediatePropagation();
      fullscreen();
      break;
    case "m":
    case "M":
      ev.preventDefault();
      ev.stopImmediatePropagation();
      let vol = player.getVolume();
      if (vol == 0) {
        player.setVolume(saved_player_volume);
      } else {
        saved_player_volume = vol;
        player.setVolume(0);
      }
  }
}, {capture: true});