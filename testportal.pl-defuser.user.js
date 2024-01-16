// ==UserScript==
// @name         TestPortal.pl Defuser
// @namespace    uscripts.minibomba.pro
// @version      1.0.0
// @description  Disable per-question timeouts & disable the "Honest Respondent" technology!
// @author       mini_bomba
// @include      https://*testportal.pl/exam/*
// @include      https://*testportal.net/test.html*
// @include      https://*testportal.net/exam/*
// @grant        none
// @homepageURL  https://github.com/mini-bomba/uscripts
// @updateURL    https://raw.githubusercontent.com/mini-bomba/uscripts/master/testportal.pl-defuser.user.js
// @downloadURL  https://raw.githubusercontent.com/mini-bomba/uscripts/master/testportal.pl-defuser.user.js
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';
  const functionToString = fn => Function.prototype.toString.call(fn);

  class FakeBlurSpy {
    constructor () {
      console.log("FakeBlurSpy constructed", arguments);
      this.maxBlursCount = arguments[2];
    }

    getBlursCount() {
      // Look at who's called us
      const stackFrames = (new Error()).stack.split("\n")

      for (const frame of stackFrames) {
        // Try to find global functions
        const functionName = frame.split("@", 1)[0];
        const fn = window[functionName];
        if (fn != null) {
          // If any function contains code to call clearInterval,
          // throw a fake error to prevent timeout code from submitting the form
          const source = functionToString(fn);
          if (source.includes("window.clearInterval")) {
            throw new SyntaxError("illegal character U+0040");
          }
        }
      }

      // Always return no blurs
      return 0;
    }

    start() {}
    onBlur() {}
    onMaxBlurs() {}
  }

  Object.defineProperty(window, "BlurSpy", {  // Prevent blur detection
    get: () => FakeBlurSpy,
    set: () => undefined,
  });
  Object.defineProperty(window, "logToServer", {  // Prevent logging errors
    get: () => () => undefined,
    set: () => undefined,
  });
  console.log("testportal defuser loaded");
})();