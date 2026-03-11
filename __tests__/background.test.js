const fs = require("fs");
const path = require("path");

describe("Background tests", () => {

  const bgPath = path.join(
    process.cwd(),
    "extension",
    "background.js"
  );

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("background.js exists", () => {
    expect(fs.existsSync(bgPath)).toBe(true);
  });

  test("background.js contains alarm listener registration", () => {
    const bgCode = fs.readFileSync(bgPath, "utf8");
    expect(bgCode).toContain("chrome.alarms.onAlarm.addListener");
  });

  test("background.js uses chrome.management.getAll", () => {
    const bgCode = fs.readFileSync(bgPath, "utf8");
    expect(bgCode).toContain("chrome.management.getAll");
  });

  test("background.js filters themes correctly", () => {
    const bgCode = fs.readFileSync(bgPath, "utf8");
    expect(bgCode).toContain('ext.type === "theme"');
  });

  test("background.js handles rotateTheme alarm", () => {
    const bgCode = fs.readFileSync(bgPath, "utf8");
    expect(bgCode).toContain('alarm.name === "rotateTheme"');
  });

  test("background.js finds enabled theme", () => {
    const bgCode = fs.readFileSync(bgPath, "utf8");
    expect(bgCode).toContain("enabled");
  });

  test("background.js rotates to next theme", () => {
    const bgCode = fs.readFileSync(bgPath, "utf8");
    expect(bgCode).toContain("nextIndex");
    expect(bgCode).toContain("currentIndex");
  });

  test("background.js wraps theme rotation with modulo", () => {
    const bgCode = fs.readFileSync(bgPath, "utf8");
    expect(bgCode).toContain("%");
  });

  test("background.js disables all themes using forEach", () => {
    const bgCode = fs.readFileSync(bgPath, "utf8");
    expect(bgCode).toContain("forEach");
    expect(bgCode).toContain("setEnabled");
  });

  test("background.js manages theme via setEnabled API", () => {
    const bgCode = fs.readFileSync(bgPath, "utf8");
    expect(bgCode).toContain("chrome.management.setEnabled");
  });

  test("background.js has proper structure for rotateTheme", () => {
    const bgCode = fs.readFileSync(bgPath, "utf8");
    expect(bgCode).toMatch(/alarm\.name\s*===\s*["']rotateTheme["']/);
  });

  test("background.js initializes currentIndex to 0 if not found", () => {
    const bgCode = fs.readFileSync(bgPath, "utf8");
    expect(bgCode).toContain("currentIndex = 0");
  });

  test("background.js handles themes length greater than 0", () => {
    const bgCode = fs.readFileSync(bgPath, "utf8");
    expect(bgCode).toContain("themes.length");
  });

  test("alarm listener is registered when background.js is loaded", () => {
    global.chrome = {
      alarms: {
        onAlarm: {
          addListener: jest.fn()
        }
      },
      management: {
        getAll: jest.fn(),
        setEnabled: jest.fn()
      }
    };

    require("../extension/background.js");

    expect(global.chrome.alarms.onAlarm.addListener).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  test("alarm listener handles rotateTheme correctly", () => {
    global.chrome = {
      alarms: {
        onAlarm: {
          addListener: jest.fn()
        }
      },
      management: {
        getAll: jest.fn(),
        setEnabled: jest.fn()
      }
    };

    require("../extension/background.js");

    const callback = global.chrome.alarms.onAlarm.addListener.mock.calls[0][0];
    const mockThemes = [
      { id: "theme1", type: "theme", enabled: true },
      { id: "theme2", type: "theme", enabled: false }
    ];

    global.chrome.management.getAll.mockImplementation((cb) => {
      cb(mockThemes);
    });

    callback({ name: "rotateTheme" });

    expect(global.chrome.management.getAll).toHaveBeenCalled();
  });

  test("alarm listener ignores non-rotateTheme alarms", () => {
    global.chrome = {
      alarms: {
        onAlarm: {
          addListener: jest.fn()
        }
      },
      management: {
        getAll: jest.fn(),
        setEnabled: jest.fn()
      }
    };

    require("../extension/background.js");

    const callback = global.chrome.alarms.onAlarm.addListener.mock.calls[0][0];

    callback({ name: "otherAlarm" });

    expect(global.chrome.management.getAll).not.toHaveBeenCalled();
  });

  test("theme rotation disables all and enables next", () => {
    global.chrome = {
      alarms: {
        onAlarm: {
          addListener: jest.fn()
        }
      },
      management: {
        getAll: jest.fn(),
        setEnabled: jest.fn()
      }
    };

    require("../extension/background.js");

    const callback = global.chrome.alarms.onAlarm.addListener.mock.calls[0][0];
    const mockThemes = [
      { id: "theme1", type: "theme", enabled: true },
      { id: "theme2", type: "theme", enabled: false },
      { id: "theme3", type: "theme", enabled: false }
    ];

    global.chrome.management.getAll.mockImplementation((cb) => {
      cb(mockThemes);
    });

    callback({ name: "rotateTheme" });

    expect(global.chrome.management.setEnabled).toHaveBeenCalledWith("theme1", false);
    expect(global.chrome.management.setEnabled).toHaveBeenCalledWith("theme2", false);
    expect(global.chrome.management.setEnabled).toHaveBeenCalledWith("theme3", false);
    expect(global.chrome.management.setEnabled).toHaveBeenCalledWith("theme2", true);
  });

  test("theme rotation wraps to first theme", () => {
    global.chrome = {
      alarms: {
        onAlarm: {
          addListener: jest.fn()
        }
      },
      management: {
        getAll: jest.fn(),
        setEnabled: jest.fn()
      }
    };

    require("../extension/background.js");

    const callback = global.chrome.alarms.onAlarm.addListener.mock.calls[0][0];
    const mockThemes = [
      { id: "theme1", type: "theme", enabled: false },
      { id: "theme2", type: "theme", enabled: true }
    ];

    global.chrome.management.getAll.mockImplementation((cb) => {
      cb(mockThemes);
    });

    callback({ name: "rotateTheme" });

    expect(global.chrome.management.setEnabled).toHaveBeenCalledWith("theme1", true);
  });

  test("theme rotation handles no enabled theme", () => {
    global.chrome = {
      alarms: {
        onAlarm: {
          addListener: jest.fn()
        }
      },
      management: {
        getAll: jest.fn(),
        setEnabled: jest.fn()
      }
    };

    require("../extension/background.js");

    const callback = global.chrome.alarms.onAlarm.addListener.mock.calls[0][0];
    const mockThemes = [
      { id: "theme1", type: "theme", enabled: false },
      { id: "theme2", type: "theme", enabled: false }
    ];

    global.chrome.management.getAll.mockImplementation((cb) => {
      cb(mockThemes);
    });

    callback({ name: "rotateTheme" });

    expect(global.chrome.management.setEnabled).toHaveBeenCalledWith("theme2", true);
  });

  test("theme rotation handles empty themes array", () => {
    global.chrome = {
      alarms: {
        onAlarm: {
          addListener: jest.fn()
        }
      },
      management: {
        getAll: jest.fn(),
        setEnabled: jest.fn()
      }
    };

    require("../extension/background.js");

    const callback = global.chrome.alarms.onAlarm.addListener.mock.calls[0][0];

    global.chrome.management.getAll.mockImplementation((cb) => {
      cb([]);
    });

    callback({ name: "rotateTheme" });

    expect(global.chrome.management.setEnabled).not.toHaveBeenCalled();
  });

});