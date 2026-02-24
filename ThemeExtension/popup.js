// Wait for the popup to load, then add logic (等待弹出窗口加载，然后添加逻辑)
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.btn-module');
    const colorPicker = document.getElementById('font-color-picker');
    const colorDisplay = document.getElementById('color-hex-display');

    // 1. Load saved state on startup (在启动时加载保存的状态)
    chrome.storage.local.get(['currentTheme', 'customFontColor'], (result) => {
        const currentTheme = result.currentTheme || 'default';
        setActiveModule(currentTheme);

        if (colorPicker && colorDisplay && result.customFontColor) {
            colorPicker.value = result.customFontColor;
            colorDisplay.textContent = result.customFontColor.toUpperCase();
        }
    });

    // 2. Add click listeners to all module buttons (为所有模块按钮添加点击监听器)
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const themeName = btn.getAttribute('data-theme');
            applyTheme(themeName);
            setActiveModule(themeName);
        });
    });

    // 3. Color Picker Logic (颜色选择器逻辑)
    if (colorPicker && colorDisplay) {
        colorPicker.addEventListener('input', (e) => {
            const newColor = e.target.value;
            colorDisplay.textContent = newColor.toUpperCase();
            chrome.storage.local.set({ customFontColor: newColor });

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const currentTab = tabs[0];
                if (currentTab && currentTab.url && !currentTab.url.startsWith("chrome://") && !currentTab.url.startsWith("edge://")) {
                    chrome.tabs.sendMessage(currentTab.id, { action: "setCustomColor", color: newColor });
                }
            });
        });
    }
});

// Function to handle the ACTIVE MODULE animation and text swap
// (处理 ACTIVE MODULE 动画和文本切换的函数)
function setActiveModule(activeThemeName) {
    const buttons = document.querySelectorAll('.btn-module');
    
    buttons.forEach(btn => {
        const themeName = btn.getAttribute('data-theme');
        const labelSpan = btn.querySelector('.btn-label');
        const originalLabel = btn.getAttribute('data-label'); // e.g. "MODULE_03"

        if (themeName === activeThemeName) {
            btn.classList.add('active');
            labelSpan.textContent = "ACTIVE MODULE";
        } else {
            btn.classList.remove('active');
            labelSpan.textContent = originalLabel; // Reverts back to normal number (恢复到正常编号)
        }
    });
}

// Function to send the theme change command to the webpage
// (将主题更改命令发送到网页的函数)
function applyTheme(themeName) {
    chrome.storage.local.set({ currentTheme: themeName });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        
        if (currentTab && currentTab.url && !currentTab.url.startsWith("chrome://") && !currentTab.url.startsWith("edge://")) {
            chrome.tabs.sendMessage(currentTab.id, { action: "setTheme", theme: themeName }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn("Theme switch failed:", chrome.runtime.lastError.message);
                    alert("Please refresh this webpage to use the theme switcher! \n(请刷新此网页以使用主题切换器！)");
                }
            });
        } else {
            alert("Extensions cannot run on Chrome settings pages or New Tab pages. Try opening Wikipedia or Google! \n(扩展程序无法在 Chrome 设置页面或新标签页上运行。请尝试打开维基百科或谷歌！)");
        }
    });
}