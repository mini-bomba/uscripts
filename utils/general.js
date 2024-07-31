// Dependencies:
//   none
//
// Required grants:
//   none

const realConsoleLog = console.log.bind(console);
const realConsoleTrace = console.trace.bind(console);

function sleep(ms) {
  return new Promise((res, _) => setTimeout(res, ms));
}

function waitUntilInteractive() {
  if (document.readyState == "loading") {
    return new Promise((res, _) => {
      document.addEventListener("readystatechange", _ => res(), {once: true});
    });
  } else {
    return Promise.resolve();
  }
}

function isTag(element, tag) {
  return element.tagName.toLowerCase() === tag.toLowerCase();
}
