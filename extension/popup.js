const defaultBtn = document.getElementById("defaultBtn");
const userBtn = document.getElementById("userBtn");
const lightBtn = document.getElementById("lightBtn");
const darkBtn = document.getElementById("darkBtn");

const LIGHT_THEME_URL = "https://chromewebstore.google.com/detail/white-theme/eidfmlhkekofhlcimbdfmnbnlmoejdjj";
const DARK_THEME_URL = "https://chromewebstore.google.com/detail/dark-mode/dmghijelimhndkbmpgbldicpogfkceaj";

function openThemeStorePage(url) {
  window.open(url, "_blank");
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
                theme.name !== "Light Apperance" &&
                theme.name !== "Dark Apperance"
            ){
                userTheme = theme;
            }
        });

        if (userTheme) {
            userBtn.textContent = userTheme.name;

            userBtn.onclick = () => enableThemeById(userTheme.id);
        } else {
            userBtn.textContent = "No User Theme Installed";
            userBtn.disabled = true;
        }

        lightBtn.textContent = "Save Theme";
        lightBtn.disabled = false;
        lightBtn.onclick = () => openThemeStorePage(LIGHT_THEME_URL);

        darkBtn.textContent = "Save Theme";
        darkBtn.disabled = false;
        darkBtn.onclick = () => openThemeStorePage(DARK_THEME_URL);
    });
}

defaultBtn.onclick = () => disableAllThemes();

findThemes();
