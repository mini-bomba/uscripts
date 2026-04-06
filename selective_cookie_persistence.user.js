// ==UserScript==
// @name        selective cookie persistence
// @description allows selected cookie and localStorage entries to be set whenever a website is loaded with no prior data (incognito/temp containers/automatic cookie clearing)
// @namespace   uscripts.minibomba.pro
// @match       https://*/*
// @grant       GM_registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_getResourceURL
// @run-at      document-start
// @resource    configSource ./utils/selective_cookie_persistence_config.html
// @require     ./utils/general.js
// @version     1.0
// @top-level-await
// @author      mini_bomba
// @updateURL     https://raw.githubusercontent.com/mini-bomba/uscripts/master/selective_cookie_persistence.user.js
// @downloadURL   https://raw.githubusercontent.com/mini-bomba/uscripts/master/selective_cookie_persistence.user.js
// ==/UserScript==


const FLAG_ENTRY_KEY = "selectiveCookiePersistenceCheck";
const host = document.location.host;

if (host.length === 0 || document.location.protocol !== "https:") {
  console.warn("[selective cookie persistence] invalid document.location (non-https), aborting");
  return;
}

function getSiteData() {
  return GM_getValue(host, {cookies: [], localStorage: []});
}

function unpersistCookie(siteData, name) {
  siteData.cookies = siteData.cookies.filter(c => c.name !== name)
}

function unpersistStorage(siteData, key) {
  siteData.localStorage = siteData.localStorage.filter(c => c.key !== key)
}

async function prepareData() {
  const cookies = await cookieStore.getAll();
  const siteData = getSiteData();
  const cookieKeys = new Set([
    ...siteData.cookies.map((e) => e.name),
    ...cookies.map((e) => e.name),
  ]);
  const storageKeys = new Set([
    ...siteData.localStorage.map((e) => e.key),
    ...Object.keys(localStorage),
  ]);
  storageKeys.delete(FLAG_ENTRY_KEY);

  return {
    cookies: Array.from(cookieKeys).sort().map(k => ({
      name: k,
      current: cookies.find(e => e.name === k),
      persisted: siteData.cookies.find(e => e.name === k),
    })),
    localStorage: Array.from(storageKeys).sort().map(k => ({
      key: k,
      current: localStorage.getItem(k),
      persisted: siteData.localStorage.find(e => e.key === k),
    })),
  };
}

function renderValue(value) {
  if (value != null) {
    const editor = document.createElement("textarea");
    editor.disabled = true;
    editor.rows = 1;
    editor.value = value;
    return editor
  } else {
    const placeholder = document.createElement("em");
    placeholder.innerText = "none";
    return placeholder
  }
}

function createRow({table, name, current, persisted, callbacks: {set, unset}}) {
  const row = table.insertRow();
  row.insertCell().innerText = name;
  row.insertCell().appendChild(renderValue(current));
  const cell = row.insertCell()
  cell.appendChild(renderValue(persisted));
  const setButton = document.createElement("button");
  setButton.innerText = "set";
  setButton.onclick = () => set(name);
  cell.appendChild(setButton);
  const unsetButton = document.createElement("button");
  unsetButton.innerText = "unset";
  unsetButton.onclick = () => unset(name);
  cell.appendChild(unsetButton);
}

async function rerenderPopup(popup, cookieCallbacks, storageCallbacks) {
  const cookieTable = popup.document.getElementById("table_cookies");
  const storageTable = popup.document.getElementById("table_storage");
  const data = await prepareData();

  for (const row of popup.document.querySelectorAll("tr:not([data-header])")) {
    row.remove()
  }

  for (const {name, current, persisted} of data.cookies) {
    createRow({
      table: cookieTable,
      name,
      current: current?.value,
      persisted: persisted?.value,
      callbacks: cookieCallbacks,
    })
  }
  for (const {key, current, persisted} of data.localStorage) {
    createRow({
      table: storageTable,
      name: key,
      current: current,
      persisted: persisted?.value,
      callbacks: storageCallbacks,
    })
  }
}

GM_registerMenuCommand("Edit persisted entries", () => {
  // popup blocking workaround
  document.addEventListener("click", async ev => {
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    const newWindow = window.open(GM_getResourceURL("configSource"));
    await waitUntilInteractive(newWindow.document);
    await sleep(100);
    let cookieCallbacks, storageCallbacks;
    cookieCallbacks = {
      set: async (name) => {
        const value = await cookieStore.get(name);
        const siteData = getSiteData();
        unpersistCookie(siteData, name);
        if (value != null) {
          siteData.cookies.push(value);
        }
        GM_setValue(host, siteData);
        rerenderPopup(newWindow, cookieCallbacks, storageCallbacks);
      },
      unset: (name) => {
        const siteData = getSiteData();
        unpersistCookie(siteData, name);
        GM_setValue(host, siteData);
        rerenderPopup(newWindow, cookieCallbacks, storageCallbacks);
      },
    };
    storageCallbacks = {
      set: key => {
        const siteData = getSiteData();
        const value = localStorage.getItem(key);
        unpersistStorage(siteData, key);
        if (value != null) {
          siteData.localStorage.push({key, value});
        }
        GM_setValue(host, siteData);
        rerenderPopup(newWindow, cookieCallbacks, storageCallbacks);
      },
      unset: key => {
        const siteData = getSiteData();
        unpersistStorage(siteData, key);
        GM_setValue(host, siteData);
        rerenderPopup(newWindow, cookieCallbacks, storageCallbacks);
      }
    }

    rerenderPopup(newWindow, cookieCallbacks, storageCallbacks);
  }, {once: true, capture: true})
})

// check if we've already restored the cookies/storage for this site
if (localStorage.getItem(FLAG_ENTRY_KEY) != null) {
  return;
}

// look up the site in our script storage
const data = GM_getValue(host, null);
// set the flag
localStorage.setItem(FLAG_ENTRY_KEY, "æ");

if (data == null) {
  return;
}

// local storage restoration
for (const {key, value} of data.localStorage) {
  localStorage.setItem(key, value);
}

// cookies
await Promise.all(
  data.cookies.map(entry => {
    console.log(entry);
    if (!("expires" in entry || "maxAge" in entry)) {
      entry.maxAge = 365 * 24 * 60 * 60;
    }
    return cookieStore.set(entry);
  }),
);

// refresh
window.location.reload();
