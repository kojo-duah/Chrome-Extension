const themes = ['default', 'matrix', 'zzz', 'lofi'];

// Listen for the keyboard shortcut (监听键盘快捷键)
chrome.commands.onCommand.addListener((command) => {
    if (command === "toggle-theme") {
        chrome.storage.local.get(['currentTheme'], function(result) {
            let current = result.currentTheme || 'default';
            let nextIndex = (themes.indexOf(current) + 1) % themes.length;
            let nextTheme = themes[nextIndex];
            
            // Save the new theme (保存新主题)
            chrome.storage.local.set({ currentTheme: nextTheme });
            
            // Send the command to the webpage (将命令发送到网页)
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0] && !tabs[0].url.startsWith("chrome://") && !tabs[0].url.startsWith("edge://")) {
                    chrome.tabs.sendMessage(tabs[0].id, {action: "setTheme", theme: nextTheme});
                }
            });
        });
    }
});