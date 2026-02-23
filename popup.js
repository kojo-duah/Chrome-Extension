const defaultBtn = document.getElementById("defaultBtn");
const userBtn = document.getElementById("userBtn");
const lightBtn = document.getElementById("lightBtn");
const darkBtn = document.getElementById("darkBtn");

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
        let lightTheme = null;
        let darkTheme = null;

        themes.forEach(theme => {
            if (theme.name === "Light Appearance") {
                lightTheme = theme;
            } else if (theme.name === "Dark Appearance") {
                darkTheme = theme;
            } else {
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

        if (lightTheme) {
            lightBtn.onclick = () => enableThemeById(lightTheme.id);
        }

        if (darkTheme) {
            darkBtn.onclick = () => enableThemeById(darkTheme.id);
        }
    });
}

defaultBtn.onclick = () => disableAllThemes();

findThemes();
