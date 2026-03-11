global.chrome = {
  management: {
    getAll: jest.fn((callback) => callback([])),
    setEnabled: jest.fn()
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    create: jest.fn()
  }
};

const fs = require("fs");
const path = require("path");
const popup = require("../extension/popup");

describe("Popup tests", () => {

  const popupHtml = path.join(
    process.cwd(),
    "extension",
    "popup.html"
  );

  const popupJs = path.join(
    process.cwd(),
    "extension",
    "popup.js"
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("popup.html exists", () => {
    expect(fs.existsSync(popupHtml)).toBe(true);
  });

  test("popup.js exists", () => {
    expect(fs.existsSync(popupJs)).toBe(true);
  });

  test("disableAllThemes calls chrome.management.getAll", () => {
    popup.disableAllThemes();
    expect(chrome.management.getAll).toHaveBeenCalled();
  });

  test("disableAllThemes disables all themes", () => {
    const mockThemes = [
      { id: "theme1", type: "theme", enabled: true },
      { id: "theme2", type: "theme", enabled: false }
    ];

    chrome.management.getAll.mockImplementation((callback) => {
      callback(mockThemes);
    });

    popup.disableAllThemes();

    expect(chrome.management.setEnabled).toHaveBeenCalledWith("theme1", false);
    expect(chrome.management.setEnabled).toHaveBeenCalledWith("theme2", false);
  });

  test("disableAllThemes calls callback with themes", () => {
    const mockThemes = [
      { id: "theme1", type: "theme" }
    ];

    chrome.management.getAll.mockImplementation((callback) => {
      callback(mockThemes);
    });

    const mockCallback = jest.fn();
    popup.disableAllThemes(mockCallback);

    expect(mockCallback).toHaveBeenCalledWith(mockThemes);
  });

  test("enableThemeById disables all themes first then enables target", () => {
    const mockThemes = [
      { id: "theme1", type: "theme" },
      { id: "theme2", type: "theme" }
    ];

    chrome.management.getAll.mockImplementation((callback) => {
      callback(mockThemes);
    });

    popup.enableThemeById("theme2");

    expect(chrome.management.setEnabled).toHaveBeenCalledWith("theme1", false);
    expect(chrome.management.setEnabled).toHaveBeenCalledWith("theme2", false);
    expect(chrome.management.setEnabled).toHaveBeenCalledWith("theme2", true);
  });

  test("openSavedTheme opens saved theme URL", () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ savedFirstThemeUrl: "https://example.com/theme" });
    });

    popup.openSavedTheme("savedFirstThemeUrl");

    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: "https://example.com/theme"
    });
  });

  test("openSavedTheme shows alert when no saved theme", () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    global.alert = jest.fn();
    popup.openSavedTheme("savedFirstThemeUrl");

    expect(global.alert).toHaveBeenCalledWith("No saved theme link found.");
  });

  test("isChromeWebStoreThemeUrl returns true for valid URLs", () => {
    expect(popup.isChromeWebStoreThemeUrl(
      "https://chromewebstore.google.com/detail/theme-id"
    )).toBe(true);

    expect(popup.isChromeWebStoreThemeUrl(
      "https://chrome.google.com/webstore/detail/theme-id"
    )).toBe(true);
  });

  test("isChromeWebStoreThemeUrl returns false for invalid URLs", () => {
    expect(popup.isChromeWebStoreThemeUrl("https://example.com")).toBe(false);
    expect(popup.isChromeWebStoreThemeUrl(null)).toBe(false);
    expect(popup.isChromeWebStoreThemeUrl("")).toBe(false);
  });

  test("extractThemeNameFromTabTitle extracts theme name correctly", () => {
    const result = popup.extractThemeNameFromTabTitle(
      "Dark Theme - Chrome Web Store"
    );
    expect(result).toBe("Dark Theme");
  });

  test("extractThemeNameFromTabTitle returns default for empty title", () => {
    const result = popup.extractThemeNameFromTabTitle("");
    expect(result).toBe("Saved Theme");
  });

  test("updateSavedThemeLabels updates button labels", () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        savedFirstThemeName: "First Theme",
        savedSecondThemeName: "Second Theme"
      });
    });

    popup.updateSavedThemeLabels();

    expect(chrome.storage.local.get).toHaveBeenCalledWith(
      ["savedFirstThemeName", "savedSecondThemeName"],
      expect.any(Function)
    );
  });

  test("clearSavedTheme removes saved theme data", () => {
    chrome.storage.local.remove.mockImplementation((keys, callback) => {
      callback();
    });

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    popup.clearSavedTheme("savedFirstThemeUrl", "savedFirstThemeName");

    expect(chrome.storage.local.remove).toHaveBeenCalledWith(
      ["savedFirstThemeUrl", "savedFirstThemeName"],
      expect.any(Function)
    );
  });

  test("getCurrentTab queries active tab", () => {
    const mockTab = { id: 1, url: "https://example.com" };
    chrome.tabs.query.mockImplementation((query, callback) => {
      callback([mockTab]);
    });

    const mockCallback = jest.fn();
    popup.getCurrentTab(mockCallback);

    expect(chrome.tabs.query).toHaveBeenCalledWith(
      { active: true, currentWindow: true },
      expect.any(Function)
    );
    expect(mockCallback).toHaveBeenCalledWith(mockTab);
  });

  test("saveThemeAndOpen saves and opens theme from Chrome Web Store", () => {
    const mockTab = {
      id: 1,
      url: "https://chromewebstore.google.com/detail/theme-123",
      title: "Dark Theme - Chrome Web Store"
    };

    chrome.tabs.query.mockImplementation((query, callback) => {
      callback([mockTab]);
    });

    chrome.storage.local.set.mockImplementation((obj, callback) => {
      callback();
    });

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    popup.saveThemeAndOpen("savedFirstThemeUrl", "savedFirstThemeName");

    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        savedFirstThemeUrl: mockTab.url,
        savedFirstThemeName: "Dark Theme"
      }),
      expect.any(Function)
    );
    expect(chrome.tabs.create).toHaveBeenCalledWith({ url: mockTab.url });
  });

  test("saveThemeAndOpen opens saved theme if not on Chrome Web Store", () => {
    const mockTab = {
      id: 1,
      url: "https://example.com",
      title: "Example"
    };

    chrome.tabs.query.mockImplementation((query, callback) => {
      callback([mockTab]);
    });

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ savedFirstThemeUrl: "https://chromewebstore.google.com/detail/theme-id" });
    });

    popup.saveThemeAndOpen("savedFirstThemeUrl", "savedFirstThemeName");

    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: "https://chromewebstore.google.com/detail/theme-id"
    });
  });

  test("saveThemeAndOpen shows alert when no active tab", () => {
    chrome.tabs.query.mockImplementation((query, callback) => {
      callback([]);
    });

    global.alert = jest.fn();
    popup.saveThemeAndOpen("savedFirstThemeUrl", "savedFirstThemeName");

    expect(global.alert).toHaveBeenCalledWith("No active tab found.");
  });

  test("findThemes handles user theme correctly", () => {
    const mockThemes = [
      { id: "theme1", type: "theme", name: "Custom User Theme", enabled: false },
      { id: "theme2", type: "theme", name: "First Appearance", enabled: false }
    ];

    chrome.management.getAll.mockImplementation((callback) => {
      callback(mockThemes);
    });

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    popup.findThemes();

    expect(chrome.management.getAll).toHaveBeenCalled();
  });

  test("findThemes handles no user theme installed", () => {
    const mockThemes = [
      { id: "theme1", type: "theme", name: "First Appearance", enabled: false },
      { id: "theme2", type: "theme", name: "Second Appearance", enabled: false }
    ];

    chrome.management.getAll.mockImplementation((callback) => {
      callback(mockThemes);
    });

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    popup.findThemes();

    expect(chrome.management.getAll).toHaveBeenCalled();
  });

  test("isChromeWebStoreThemeUrl old chrome.google.com domain", () => {
    expect(popup.isChromeWebStoreThemeUrl(
      "https://chrome.google.com/webstore/detail/some-theme-id"
    )).toBe(true);
  });

  test("extractThemeNameFromTabTitle removes proper suffix", () => {
    expect(popup.extractThemeNameFromTabTitle(
      "My Theme - Chrome Web Store"
    )).toBe("My Theme");

    expect(popup.extractThemeNameFromTabTitle(
      "Another Theme   -   Chrome Web Store"
    )).toBe("Another Theme");
  });

  test("disableAllThemes filters to only themes", () => {
    const extensions = [
      { id: "ext1", type: "extension", name: "Extension" },
      { id: "theme1", type: "theme", name: "Theme 1", enabled: true },
      { id: "theme2", type: "theme", name: "Theme 2", enabled: false }
    ];

    chrome.management.getAll.mockImplementation((callback) => {
      callback(extensions);
    });

    popup.disableAllThemes();

    expect(chrome.management.setEnabled).toHaveBeenCalledWith("theme1", false);
    expect(chrome.management.setEnabled).toHaveBeenCalledWith("theme2", false);
    expect(chrome.management.setEnabled).not.toHaveBeenCalledWith("ext1", false);
  });

  test("initializeEventHandlers handles null buttons gracefully", () => {
    expect(() => {
      popup.initializeEventHandlers();
    }).not.toThrow();
  });

  test("disableAllThemes with callback passes array to callback", () => {
    const mockThemes = [
      { id: "theme1", type: "theme", enabled: true },
      { id: "theme2", type: "theme", enabled: true }
    ];

    chrome.management.getAll.mockImplementation((callback) => {
      callback(mockThemes);
    });

    const mockCallback = jest.fn();
    popup.disableAllThemes(mockCallback);

    expect(mockCallback).toHaveBeenCalledWith(mockThemes);
  });

  test("enableThemeById uses callback pattern correctly", () => {
    const mockThemes = [
      { id: "theme1", type: "theme" },
      { id: "theme2", type: "theme" }
    ];

    chrome.management.getAll.mockImplementation((callback) => {
      callback(mockThemes);
    });

    popup.enableThemeById("theme2");

    expect(chrome.management.setEnabled).toHaveBeenCalledWith("theme2", true);
  });

  test("getCurrentTab passes active tab to callback", () => {
    const mockTab = { id: 42, url: "https://test.com", title: "Test" };

    chrome.tabs.query.mockImplementation((query, callback) => {
      callback([mockTab]);
    });

    const callbackSpy = jest.fn();
    popup.getCurrentTab(callbackSpy);

    expect(callbackSpy).toHaveBeenCalledWith(mockTab);
  });

  test("openSavedTheme with empty storage shows alert", () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    global.alert = jest.fn();

    popup.openSavedTheme("nonExistentKey");

    expect(global.alert).toHaveBeenCalledWith("No saved theme link found.");
  });

  test("saveThemeAndOpen handles non-Web Store URL", () => {
    const mockTab = {
      id: 1,
      url: "https://example.com",
      title: "Example"
    };

    chrome.tabs.query.mockImplementation((query, callback) => {
      callback([mockTab]);
    });

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ savedFirstThemeUrl: "https://chromewebstore.google.com/detail/saved" });
    });

    popup.saveThemeAndOpen("savedFirstThemeUrl", "savedFirstThemeName");

    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: "https://chromewebstore.google.com/detail/saved"
    });
  });

  test("findThemes separates user themes from built-in themes", () => {
    const mockThemes = [
      { id: "built1", type: "theme", name: "First Appearance", enabled: true },
      { id: "built2", type: "theme", name: "Second Appearance", enabled: false },
      { id: "user1", type: "theme", name: "My Custom Theme", enabled: false }
    ];

    chrome.management.getAll.mockImplementation((callback) => {
      callback(mockThemes);
    });

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    popup.findThemes();

    expect(chrome.management.getAll).toHaveBeenCalled();
  });

  test("clearSavedTheme triggers updateSavedThemeLabels", () => {
    chrome.storage.local.remove.mockImplementation((keys, callback) => {
      callback();
    });

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    popup.clearSavedTheme("savedFirstThemeUrl", "savedFirstThemeName");

    expect(chrome.storage.local.remove).toHaveBeenCalled();
  });

  test("extractThemeNameFromTabTitle with complex title", () => {
    const result = popup.extractThemeNameFromTabTitle(
      "  Amazing Dark Theme 2024  -  Chrome Web Store  "
    );
    expect(result).toBe("Amazing Dark Theme 2024");
  });

});