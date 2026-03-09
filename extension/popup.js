const defaultBtn = document.getElementById("defaultBtn");
const userBtn = document.getElementById("userBtn");
const lightBtn = document.getElementById("lightBtn");
const darkBtn = document.getElementById("darkBtn");


function openThemeStorePage(url) {
  window.open(url, "_blank");
}

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

function saveCurrentThemeLink(storageKey, successLabel) {
  getCurrentTab((tab) => {
    if (!tab || !isChromeWebStoreThemeUrl(tab.url)) {
      alert("Open a Chrome Web Store theme page first.");
      return;
    }

    chrome.storage.local.set({ [storageKey]: tab.url }, () => {
      alert(`${successLabel} theme link saved.`);
    });
  });
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

        lightBtn.textContent = "Save Theme";
        lightBtn.disabled = false;
        lightBtn.onclick = () => {
            saveCurrentThemeLink("savedThemeUrl" , "1");
        }

        darkBtn.textContent = "Save Theme";
        darkBtn.disabled = false;
        darkBtn.onclick = () => {
            saveCurrentThemeLink("savedThemeUrl" , "1");
        }
    });
}

defaultBtn.onclick = () => disableAllThemes();

findThemes();
