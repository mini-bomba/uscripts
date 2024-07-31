// ==UserScript==
// @name        SBB verified locks
// @namespace   uscripts.minibomba.pro
// @match       https://sb.ltn.fi/*
// @grant       GM_getResourceURL
// @resource    verifiedIcon https://cdn.discordapp.com/emojis/1041978575659741214.webp?size=96&quality=lossless
// @version     1.0.3
// @author      mini_bomba
// @description Replaces the 🔒 icon in the votes column with a verified icon
// @homepageURL https://github.com/mini-bomba/uscripts
// @updateURL   https://raw.githubusercontent.com/mini-bomba/uscripts/master/sb.ltn.fi-verified-locks.user.js
// @downloadURL https://raw.githubusercontent.com/mini-bomba/uscripts/master/sb.ltn.fi-verified-locks.user.js
// ==/UserScript==
(function (){
  // Verified icon
  const verifiedIcon = document.createElement("img");
  verifiedIcon.classList.add("mb-verifiedicon");
  verifiedIcon.src = GM_getResourceURL("verifiedIcon", true);
  // Fake 🔒 to stop the refresh script from recreating the lock icon
  const fakeIcon = document.createElement("span");
  fakeIcon.classList.add("mb-fakeicon");
  fakeIcon.innerText = "🔒";
  // Extra CSS
  const styles = document.createElement("style");
  styles.id = "mbsbbvl-styles";
  styles.innerHTML = `
  img.mb-verifiedicon {
    height: 1em;
    margin-left: 0.2em;
  }
  span.mb-fakeicon {
    font-size: 0;
  }
  `
  document.head.appendChild(styles)
  function replaceIcons() {
    for (const lock of document.querySelectorAll('span[title="This segment is locked by a VIP"]')) {
      if (lock.querySelector("img.mb-verifiedicon") == null) {
        lock.innerText = "";
        lock.appendChild(fakeIcon.cloneNode(true));
        lock.appendChild(verifiedIcon.cloneNode());
      }
    }
  }
  document.addEventListener("newSegments", replaceIcons);
  replaceIcons();
})()
