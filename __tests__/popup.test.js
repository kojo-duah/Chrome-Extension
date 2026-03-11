const path = require("path");

describe("popup.js", () => {
  let popup;
  let buttons;

  beforeEach(() => {
    jest.resetModules();

    buttons = {
      defaultBtn: { onclick: null, disabled: false, textContent: "" },
      userBtn: { onclick: null, disabled: false, textContent: "" },
      firstBtn: { onclick: null, disabled: false, textContent: "" },
      secondBtn: { onclick: null, disabled: false, textContent: "" },
      clearFirstBtn: { onclick: null, disabled: false, textContent: "" },
      clearSecondBtn: { onclick: null, disabled: false, textContent: "" }
    };

    global.document = {
      getElementById: jest.fn((id) => buttons[id] || null)
    };

    global.alert = jest.fn();

    global.chrome = {
      tabs: {
        query: jest.fn(),
        create: jest.fn()
      },
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn(),
          remove: jest.fn()
        }
      },
      management: {
        getAll: jest.fn((callback) => callback([])),
        setEnabled: jest.fn()
      }
    };

    popup = require(path.join(process.cwd(), "extension", "popup.js"));
  });

  afterEach(() => {
    delete global.document;
    delete global.alert;
    delete global.chrome;
  });

  test("isChromeWebStoreThemeUrl returns true for chromewebstore.google.com URL", () => {
    expect(
      popup.isChromeWebStoreThemeUrl(
        "https://chromewebstore.google.com/detail/some-theme/abc123"
      )
    ).toBe(true);
  });

  test("isChromeWebStoreThemeUrl returns true for chrome.google.com webstore URL", () => {
    expect(
      popup.isChromeWebStoreThemeUrl(
        "https://chrome.google.com/webstore/detail/some-theme/abc123"
      )
    ).toBe(true);
  });

  test("isChromeWebStoreThemeUrl returns false for non-store URL", () => {
    expect(popup.isChromeWebStoreThemeUrl("https://google.com")).toBe(false);
  });

  test("isChromeWebStoreThemeUrl returns false for empty URL", () => {
    expect(popup.isChromeWebStoreThemeUrl("")).toBe(false);
  });

  test("extractThemeNameFromTabTitle removes Chrome Web Store suffix", () => {
    expect(
      popup.extractThemeNameFromTabTitle("Dark Space - Chrome Web Store")
    ).toBe("Dark Space");
  });

  test("extractThemeNameFromTabTitle returns fallback name when title is empty", () => {
    expect(popup.extractThemeNameFromTabTitle("")).toBe("Saved Theme");
  });

  test("openSavedTheme opens saved URL when one exists", () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ savedFirstThemeUrl: "https://chromewebstore.google.com/detail/theme1" });
    });

    popup.openSavedTheme("savedFirstThemeUrl");

    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: "https://chromewebstore.google.com/detail/theme1"
    });
    expect(alert).not.toHaveBeenCalled();
  });

  test("openSavedTheme alerts when no saved URL exists", () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    popup.openSavedTheme("savedFirstThemeUrl");

    expect(alert).toHaveBeenCalledWith("No saved theme link found.");
    expect(chrome.tabs.create).not.toHaveBeenCalled();
  });

  test("updateSavedThemeLabels updates button labels from storage", () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        savedFirstThemeName: "Ocean Blue",
        savedSecondThemeName: "Midnight Black"
      });
    });

    popup.updateSavedThemeLabels();

    expect(buttons.firstBtn.textContent).toBe("Ocean Blue");
    expect(buttons.secondBtn.textContent).toBe("Midnight Black");
  });

  test("clearSavedTheme removes saved keys", () => {
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

  test("disableAllThemes disables only theme extensions", () => {
    chrome.management.getAll.mockImplementation((callback) => {
      callback([
        { id: "theme1", type: "theme" },
        { id: "ext1", type: "extension" },
        { id: "theme2", type: "theme" }
      ]);
    });

    popup.disableAllThemes();

    expect(chrome.management.setEnabled).toHaveBeenCalledWith("theme1", false);
    expect(chrome.management.setEnabled).toHaveBeenCalledWith("theme2", false);
    expect(chrome.management.setEnabled).not.toHaveBeenCalledWith("ext1", false);
  });

  test("enableThemeById disables themes first then enables selected theme", () => {
    chrome.management.getAll.mockImplementation((callback) => {
      callback([
        { id: "theme1", type: "theme" },
        { id: "theme2", type: "theme" }
      ]);
    });

    popup.enableThemeById("theme2");

    expect(chrome.management.setEnabled).toHaveBeenCalledWith("theme1", false);
    expect(chrome.management.setEnabled).toHaveBeenCalledWith("theme2", false);
    expect(chrome.management.setEnabled).toHaveBeenCalledWith("theme2", true);
  });

  test("findThemes sets user button when a user theme exists", () => {
    chrome.management.getAll.mockImplementation((callback) => {
      callback([
        { id: "first", name: "First Appearance", type: "theme" },
        { id: "user123", name: "Galaxy Theme", type: "theme" }
      ]);
    });

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    popup.findThemes();

    expect(buttons.userBtn.textContent).toBe("Galaxy Theme");
    expect(buttons.userBtn.disabled).toBe(false);
    expect(typeof buttons.userBtn.onclick).toBe("function");
  });

  test("findThemes disables user button when no user theme exists", () => {
    chrome.management.getAll.mockImplementation((callback) => {
      callback([
        { id: "first", name: "First Appearance", type: "theme" },
        { id: "second", name: "Second Appearance", type: "theme" }
      ]);
    });

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    popup.findThemes();

    expect(buttons.userBtn.textContent).toBe("No User Theme Installed");
    expect(buttons.userBtn.disabled).toBe(true);
  });
  test("getCurrentTab calls chrome.tabs.query", () => {

  chrome.tabs.query.mockImplementation((opts, cb) => {
    cb([{ id: 1 }]);
  });

  popup.getCurrentTab(() => {});

  expect(chrome.tabs.query).toHaveBeenCalled();

});


test("saveThemeAndOpen opens saved when not store URL", () => {

  chrome.tabs.query.mockImplementation((opts, cb) => {
    cb([{ url: "https://google.com", title: "Google" }]);
  });

  chrome.storage.local.get.mockImplementation((k, cb) => {
    cb({ savedFirstThemeUrl: "https://chromewebstore.google.com/detail/a" });
  });

  popup.saveThemeAndOpen(
    "savedFirstThemeUrl",
    "savedFirstThemeName"
  );

  expect(chrome.tabs.create).toHaveBeenCalled();

});


test("enableThemeById enables theme", () => {

  chrome.management.getAll.mockImplementation(cb => {
    cb([
      { id: "a", type: "theme" },
      { id: "b", type: "theme" }
    ]);
  });

  popup.enableThemeById("b");

  expect(
    chrome.management.setEnabled
  ).toHaveBeenCalled();

});
});