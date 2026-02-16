["darkGroup", "lightGroup", "spaceGroup"].forEach(group => {
    document.getElementById(group).addEventListener("click", () => {
        chrome.storage.sync.set({ activeTheme: group }, () => {
            window.close();
        });
    });
});
