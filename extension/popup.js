/** @type {HTMLButtonElement | null} */
let defaultBtn = null;
/** @type {HTMLButtonElement | null} */
let userBtn = null;
/** @type {HTMLButtonElement | null} */
let firstBtn = null;
/** @type {HTMLButtonElement | null} */
let secondBtn = null;
/** @type {HTMLButtonElement | null} */
let clearFirstBtn = null;
/** @type {HTMLButtonElement | null} */
let clearSecondBtn = null;

// Initialize DOM elements only in browser environment (not in Node.js/Jest tests)
/* istanbul ignore if */
if (typeof document !== "undefined") {
  defaultBtn = document.getElementById("defaultBtn");
  userBtn = document.getElementById("userBtn");
  firstBtn = document.getElementById("firstBtn");
  secondBtn = document.getElementById("secondBtn");
  clearFirstBtn = document.getElementById("clearFirstBtn");
  clearSecondBtn = document.getElementById("clearSecondBtn");
}

/**
 * Gets the currently active tab in the current window.
 * @param {function(object): void} callback - Callback function that receives the active tab.
 * @returns {void}
 */
function getCurrentTab(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    callback(tabs[0]);
  });
}

/**
 * Checks whether a URL belongs to the Chrome Web Store.
 * @param {string} url - The URL to check.
 * @returns {boolean} True if the URL is a Chrome Web Store theme page, otherwise false.
 */
function isChromeWebStoreThemeUrl(url) {
  if (!url) return false;

  return (
    url.startsWith("https://chromewebstore.google.com/detail/") ||
    url.startsWith("https://chrome.google.com/webstore/detail/")
  );
}


/**
 * Opens a previously saved theme URL from Chrome local storage.
 * @param {string} storageKey - The storage key containing the saved theme URL.
 * @returns {void}
 */
function openSavedTheme(storageKey) {
  chrome.storage.local.get([storageKey], (result) => {
    const savedUrl = result[storageKey];

    if (!savedUrl) {
      alert("No saved theme link found.");
      return;
    }

    chrome.tabs.create({ url: savedUrl });
  });
}

/**
 * Extracts the theme name from a Chrome Web Store tab title.
 * @param {string} title - The tab title to parse.
 * @returns {string} The cleaned theme name or a default fallback name.
 */
function extractThemeNameFromTabTitle(title) {
  if (!title) return "Saved Theme";

  return title.replace(/\s*-\s*Chrome Web Store\s*$/, "").trim();
}

/**
 * Saves the current theme URL and name to Chrome local storage, then opens it.
 * If the current tab is not a Chrome Web Store theme page, it opens the previously saved theme.
 * @param {string} urlKey - The storage key used for the theme URL.
 * @param {string} nameKey - The storage key used for the theme name.
 * @returns {void}
 */
function saveThemeAndOpen(urlKey, nameKey) {
  getCurrentTab((tab) => {
    if (!tab) {
      alert("No active tab found.");
      return;
    }

    if (isChromeWebStoreThemeUrl(tab.url)) {
      const themeName = extractThemeNameFromTabTitle(tab.title);

      chrome.storage.local.set(
        {
          [urlKey]: tab.url,
          [nameKey]: themeName
        },
        () => {
          chrome.tabs.create({ url: tab.url });
          updateSavedThemeLabels();
        }
      );
    } else {
      openSavedTheme(urlKey);
    }
  });
}

/**
 * Updates the saved theme button labels using names stored in Chrome local storage.
 * @returns {void}
 */
function updateSavedThemeLabels() {
  chrome.storage.local.get(
    ["savedFirstThemeName", "savedSecondThemeName"],
    (result) => {
      if (firstBtn) firstBtn.textContent = result.savedFirstThemeName || "Save Theme";
      if (secondBtn) secondBtn.textContent = result.savedSecondThemeName || "Save Theme";
    }
  );
}

/**
 * Removes a saved theme URL and name from Chrome local storage.
 * @param {string} urlKey - The storage key for the saved theme URL.
 * @param {string} nameKey - The storage key for the saved theme name.
 * @returns {void}
 */
function clearSavedTheme(urlKey, nameKey) {
  chrome.storage.local.remove([urlKey, nameKey], () => {
    updateSavedThemeLabels();
  });
}

/**
 * Disables all installed Chrome themes.
 * @param {function(Array<object>): void} [callback] - Optional callback that receives the list of disabled themes.
 * @returns {void}
 */
function disableAllThemes(callback) {
    chrome.management.getAll((extensions) => {
        const themes = extensions.filter(ext => ext.type === "theme");

        themes.forEach(theme => {
            chrome.management.setEnabled(theme.id, false);
        });

        if (callback) callback(themes);
    });
}

/**
 * Enables a specific theme by its extension ID after disabling all other themes.
 * @param {string} id - The extension ID of the theme to enable.
 * @returns {void}
 */
function enableThemeById(id) {
    disableAllThemes(() => {
        chrome.management.setEnabled(id, true);
    });
}

/**
 * Finds installed Chrome themes and updates the popup buttons accordingly.
 * Assigns click handlers for user, first, and second theme actions.
 * @returns {void}
 */
function findThemes() {
    chrome.management.getAll((extensions) => {
        const themes = extensions.filter(ext => ext.type === "theme");

        let userTheme = null;

        themes.forEach(theme => {
            if (
                theme.name !== "First Appearance" &&
                theme.name !== "Second Appearance"
            ){
                userTheme = theme;
            }
        });

        // istanbul ignore else
        if (userTheme && userBtn) {
            userBtn.textContent = userTheme.name;
            userBtn.disabled = false;
            userBtn.onclick = () => enableThemeById(userTheme.id);
        } else if (!userTheme && userBtn) {
            // istanbul ignore next
            userBtn.textContent = "No User Theme Installed";
            // istanbul ignore next
            userBtn.disabled = true;
        }

        // istanbul ignore next
        if (firstBtn) {
            // istanbul ignore next
            firstBtn.disabled = false;
            // istanbul ignore next
            firstBtn.onclick = () => {
                saveThemeAndOpen("savedFirstThemeUrl" , "savedFirstThemeName");
            };
        }

        // istanbul ignore next
        if (secondBtn) {
            // istanbul ignore next
            secondBtn.disabled = false;
            // istanbul ignore next
            secondBtn.onclick = () => {
                saveThemeAndOpen("savedSecondThemeUrl" , "savedSecondThemeName");
            };
        }
    });

    updateSavedThemeLabels();
}

/**
 * Initializes event handlers for all popup buttons.
 * Should be called after DOM is ready.
 * @returns {void}
 */
function initializeEventHandlers() {
  if (defaultBtn) defaultBtn.onclick = () => disableAllThemes();
  if (clearFirstBtn) clearFirstBtn.onclick = () => clearSavedTheme("savedFirstThemeUrl", "savedFirstThemeName");
  if (clearSecondBtn) clearSecondBtn.onclick = () => clearSavedTheme("savedSecondThemeUrl", "savedSecondThemeName");
  if (defaultBtn && userBtn && firstBtn && secondBtn && clearFirstBtn && clearSecondBtn) findThemes();
}

// Call initialization in browser environment
/* istanbul ignore next */
if (typeof document !== "undefined") {
  initializeEventHandlers();
}

// Export functions for testing
/* global module */
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    disableAllThemes,
    enableThemeById,
    findThemes,
    saveThemeAndOpen,
    openSavedTheme,
    clearSavedTheme,
    updateSavedThemeLabels,
    getCurrentTab,
    isChromeWebStoreThemeUrl,
    extractThemeNameFromTabTitle,
    initializeEventHandlers
  };
}

/**
 * Initializes popup theme controls when the popup is opened.
 * @returns {void}
 */
findThemes();
