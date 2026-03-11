/**
 * background.js
 * Handles automatic theme rotation
 */

/**
 * Calculates next theme index
 */
function getNextThemeIndex(currentIndex, total) {
    if (total === 0) return -1;

    if (currentIndex === -1) {
        return 0;
    }

    return (currentIndex + 1) % total;
}


/**
 * Rotates themes given extension list
 */
function rotateThemes(extensions) {

    const themes = extensions.filter(ext => ext.type === "theme");

    if (themes.length === 0) return;

    const enabledTheme = themes.find(t => t.enabled);

    let currentIndex = themes.findIndex(
        t => t.id === enabledTheme?.id
    );

    const nextIndex = getNextThemeIndex(
        currentIndex,
        themes.length
    );

    themes.forEach(t => {
        chrome.management.setEnabled(t.id, false);
    });

    chrome.management.setEnabled(
        themes[nextIndex].id,
        true
    );
}


/**
 * Alarm listener
 */
chrome.alarms.onAlarm.addListener((alarm) => {

    if (alarm.name === "rotateTheme") {

        chrome.management.getAll((extensions) => {
            rotateThemes(extensions);
        });

    }

});


if (typeof module !== "undefined") {
    module.exports = {
        getNextThemeIndex,
        rotateThemes
    };
}