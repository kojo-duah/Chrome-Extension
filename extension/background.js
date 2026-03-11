/**
 * background.js
 * 
 * Background script for the Chrome Theme Switcher extension.
 * Handles automatic theme rotation using Chrome alarms API.
 */

/**
 * Alarm listener used to rotate installed Chrome themes.
 * Triggered when the "rotateTheme" alarm fires.
 */
chrome.alarms.onAlarm.addListener((alarm) => {
    /**
   * Handles alarm events.
   * @param {chrome.alarms.Alarm} alarm - Alarm object fired by Chrome.
   */
    if (alarm.name === "rotateTheme") {

        /**
         * Retrieves all installed extensions and filters themes.
         * @param {Array<object>} extensions - List of installed extensions.
         */
        chrome.management.getAll((extensions) => {

            const themes = extensions.filter(ext => ext.type === "theme");

            if (themes.length === 0) return;

            const enabledTheme = themes.find(t => t.enabled);

            let currentIndex = themes.findIndex(t => t.id === enabledTheme?.id);

            if (currentIndex === -1) {
                currentIndex = 0;
            }

            const nextIndex = (currentIndex + 1) % themes.length;

            // Disable all
            themes.forEach(t => {
                chrome.management.setEnabled(t.id, false);
            });

            // Enable next
            chrome.management.setEnabled(themes[nextIndex].id, true);
        });
    }
});
