// ==UserScript==
// @name        Default to Build and Teams on prydwen.gg
// @namespace   uscripts.minibomba.pro
// @match       *://www.prydwen.gg/*
// @grant       none
// @version     1.0
// @author      mini_bomba
// @run-at      document-start
// @updateURL   https://raw.githubusercontent.com/mini-bomba/uscripts/master/prydwen_build_and_teams.user.js
// @downloadURL https://raw.githubusercontent.com/mini-bomba/uscripts/master/prydwen_build_and_teams.user.js
// @description Switches to the Build and Teams tab for characters automatically
// ==/UserScript==

let webpack_chunks = undefined;
Object.defineProperty(window, 'webpackChunkprydwen', {
  get() {
    return webpack_chunks;
  },
  set(value) {
    webpack_chunks = value;
    plugins_chunk = findWebpackChunk(webpack_chunks, 34741);
    if (plugins_chunk != undefined) {
      plugins_chunk[34741] = injectPlugins(plugins_chunk[34741])
    }
  }
});

function findWebpackChunk(chunks, module_id) {
  return chunks.find(chunk => module_id in chunk[1])?.[1];
}

function injectPlugins(original_function) {
  if (original_function.toString().startsWith('function injected(')) return original_function;
  console.log("we got em");
  function injected(module, wp_exports, wp_require) {
    window.mb_exports = wp_exports;
    window.mb_require = wp_require;
    original_function(module, wp_exports, wp_require);
    module.exports.push({
      plugin: {
        'onRouteUpdate': (props) => onLocationChanged(props)
      },
      options: {},
    });
  }
  return injected
}

function onLocationChanged({location}) {
  if (!location.pathname.startsWith('/star-rail/characters/')) return;
  const build_tab = Array.from(document.querySelectorAll('.single-tab')).find(tab => tab.children[1]?.tagName === "P" && tab.children[1].textContent.toLowerCase() === "build and teams");
  build_tab?.click();
}