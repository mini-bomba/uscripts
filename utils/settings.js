// Dependencies:
//   utils/general.js
//
// Required grants:           - required if
//   GM_getValue              - always
//   GM_setValue              - always
//   GM_deleteValue           - `delete` keyword is used on a settings object prop
//   GM_registerMenuCommand   - always
//   GM_openInTab             - always

function settingsSetup({
  default_settings,
  validity_checks,
  settings_event_name,
  settings_page_name,
}) {
  validity_checks ??= {};
  const SETTINGS = new Proxy({}, {
    get: function (_, key, _) {
      key = key.replaceAll('-', '_');
      old_key = key.replaceAll('_', '-');
      if (!(key in default_settings)) {
        realConsoleTrace(`Attempted to get a setting key not defined in default settings: ${key}`);
      }
      return GM_getValue(key, GM_getValue(old_key, default_settings[key]));
    },
    set: function(_, key, value, _) {
      key = key.replaceAll('-', '_');
      if (!(key in default_settings)) {
        realConsoleTrace(`Attempted to set a setting key not defined in default settings: ${key}`);
        return false;
      }
      GM_setValue(key, value);
      return true;
    },
    deleteProperty: function(_, key) {
      GM_deleteValue(key);
      return true;
    },
    ownKeys: function(_) {
      return Object.keys(default_settings);
    },
    has: function (_, key) {
      return key in default_settings
    }
  });


  function handleSettingChange(event) {
    // check target type
    if (!isTag(event.target, "input") && !isTag(event.target, "select")) return;
    // extract value;
    let value;
    switch (event.target.type) {
      case "checkbox":
        value = event.target.checked;
        break;
      case "number":
        value = Number(event.target.value)
        break;
      default:
        value = event.target.value;
    }
    // run custom validity checks
    const setting_name = event.target.id.replaceAll("-", "_");
    if (setting_name in validity_checks) {
      const result = validity_checks[setting_name](value);
      if (result === false) {
        event.target.setCustomValidity("Custom check failed");
      } else if (typeof result === "string") {
        event.target.setCustomValidity(result);
      } else {
        event.target.setCustomValidity("");
      }
    }
    if (event.target.reportValidity()) SETTINGS[event.target.id] = value;
  }

  async function handleConfigPage() {
    await waitUntilInteractive(); // Wait until we've loaded the DOM

    const settingsElement = document.getElementById("settings");
    for (const setting of settingsElement.querySelectorAll("input, select")) {
      if (setting.type === "checkbox") {
        setting.checked = SETTINGS[setting.id];
      } else {
        setting.value = SETTINGS[setting.id];
      }
    }
    settingsElement.addEventListener("change", handleSettingChange);

    document.getElementById("not-installed").classList.add("hidden");
    settingsElement.classList.remove("hidden");
  }

  // settings page handling
  GM_registerMenuCommand("Open settings", () => GM_openInTab(`https://uscripts.minibomba.pro/${settings_page_name}`));
  const on_the_config_page = window.location.protocol === "https:" && window.location.host === "uscripts.minibomba.pro" && window.location.pathname === `/${settings_page_name}`
  if (on_the_config_page) {
    window.addEventListener(settings_event_name, e => e.preventDefault());
    handleConfigPage();
  }

  return {
    SETTINGS,
    on_the_config_page,
  };
}
