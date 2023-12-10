// ==UserScript==
// @name        SBB verified locks
// @namespace   uscripts.minibomba.pro
// @match       https://sb.ltn.fi/*
// @grant       none
// @version     1.0
// @author      mini_bomba
// @description Replaces the 🔒 icon in the votes column with a verified icon
// @homepageURL https://github.com/mini-bomba/uscripts
// @updateURL   https://raw.githubusercontent.com/mini-bomba/uscripts/master/sb.ltn.fi-verified-locks.user.js
// @downloadURL https://raw.githubusercontent.com/mini-bomba/uscripts/master/sb.ltn.fi-verified-locks.user.js
// ==/UserScript==
(function (){
  const verifiedIcon = document.createElement("img");
  verifiedIcon.classList.add("mb-verifiedicon");
  verifiedIcon.src = "https://cdn.discordapp.com/emojis/1041978575659741214.webp?size=96&quality=lossless";
  const styles = document.createElement("style");
  styles.id = "mbsbbvl-styles";
  styles.innerHTML = `
  img.mb-verifiedicon {
    height: 1em;
    margin-left: 0.2em;
  }
  `
  document.head.appendChild(styles)
  function replaceIcons() {
    for (const lock of document.querySelectorAll('span[title="This segment is locked by a VIP"]')) {
      if (lock.querySelector("img.mb-verifiedicon") == null) {
        lock.innerText = "";
        lock.appendChild(verifiedIcon.cloneNode());
      }
    }
  }
  document.addEventListener("newSegments", replaceIcons);
  replaceIcons();
})()