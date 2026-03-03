chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "rotateTheme") {

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
