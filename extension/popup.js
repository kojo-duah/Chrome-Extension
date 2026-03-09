const defaultBtn = document.getElementById("defaultBtn");
const userBtn = document.getElementById("userBtn");
const lightBtn = document.getElementById("lightBtn");
const darkBtn = document.getElementById("darkBtn");
const clearLightBtn = document.getElementById("clearLightBtn");
const clearDarkBtn = document.getElementById("clearDarkBtn");

function getCurrentTab(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    callback(tabs[0]);
  });
}

function isChromeWebStoreThemeUrl(url) {
  if (!url) return false;

  return (
    url.startsWith("https://chromewebstore.google.com/detail/") ||
    url.startsWith("https://chrome.google.com/webstore/detail/")
  );
}

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

function extractThemeNameFromTabTitle(title) {
  if (!title) return "Saved Theme";

  return title.replace(/\s*-\s*Chrome Web Store\s*$/, "").trim();
}

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

function updateSavedThemeLabels() {
  chrome.storage.local.get(
    ["savedWhiteThemeName", "savedBlackThemeName"],
    (result) => {
      lightBtn.textContent = result.savedWhiteThemeName || "Save Theme";
      darkBtn.textContent = result.savedBlackThemeName || "Save Theme";
    }
  );
}

function clearSavedTheme(urlKey, nameKey) {
  chrome.storage.local.remove([urlKey, nameKey], () => {
    updateSavedThemeLabels();
  });
}

function disableAllThemes(callback) {
    chrome.management.getAll((extensions) => {
        const themes = extensions.filter(ext => ext.type === "theme");

        themes.forEach(theme => {
            chrome.management.setEnabled(theme.id, false);
        });

        if (callback) callback(themes);
    });
}

function enableThemeById(id) {
    disableAllThemes(() => {
        chrome.management.setEnabled(id, true);
    });
}

function findThemes() {
    chrome.management.getAll((extensions) => {
        const themes = extensions.filter(ext => ext.type === "theme");

        let userTheme = null;

        themes.forEach(theme => {
            if (
                theme.name !== "Light Appearance" &&
                theme.name !== "Dark Appearance"
            ){
                userTheme = theme;
            }
        });

        if (userTheme) {
            userBtn.textContent = userTheme.name;
            userBtn.disabled = false;
            userBtn.onclick = () => enableThemeById(userTheme.id);
        } else {
            userBtn.textContent = "No User Theme Installed";
            userBtn.disabled = true;
        }

        lightBtn.disabled = false;
        lightBtn.onclick = () => {
            saveThemeAndOpen("savedWhiteThemeUrl" , "savedWhiteThemeName");
        }

        darkBtn.disabled = false;
        darkBtn.onclick = () => {
            saveThemeAndOpen("savedBlackThemeUrl" , "savedBlackThemeName");
        }
    });

    updateSavedThemeLabels();
}

defaultBtn.onclick = () => disableAllThemes();

clearLightBtn.onclick = () => {
  clearSavedTheme("savedWhiteThemeUrl", "savedWhiteThemeName");
};

clearDarkBtn.onclick = () => {
  clearSavedTheme("savedBlackThemeUrl", "savedBlackThemeName");
};

findThemes();
