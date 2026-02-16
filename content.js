function applyTheme(theme) {
    if (!theme) return;

    let styleTag = document.getElementById("one-touch-style");

    if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "one-touch-style";
        document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
    body {
      background-image: url("${chrome.runtime.getURL(theme.backgroundImage)}") !important;
      background-size: cover !important;
      background-attachment: fixed !important;
      color: ${theme.textColor} !important;
    }
  `;
}

chrome.storage.sync.get(["activeTheme"], (result) => {
    const key = result.activeTheme;
    if (key && THEMES[key]) {
        applyTheme(THEMES[key]);
    }
});
