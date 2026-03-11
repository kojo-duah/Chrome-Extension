global.chrome = {
  alarms: {
    onAlarm: {
      addListener: jest.fn()
    }
  },
  management: {
    setEnabled: jest.fn()
  }
};

const bg = require("../extension/background.js");


test("getNextThemeIndex normal", () => {

    expect(
        bg.getNextThemeIndex(0, 3)
    ).toBe(1);

});


test("getNextThemeIndex wraps", () => {

    expect(
        bg.getNextThemeIndex(2, 3)
    ).toBe(0);

});


test("rotateThemes disables all and enables next", () => {

    const extensions = [
        { id: "a", type: "theme", enabled: true },
        { id: "b", type: "theme", enabled: false },
        { id: "c", type: "theme", enabled: false }
    ];

    bg.rotateThemes(extensions);

    expect(
        chrome.management.setEnabled
    ).toHaveBeenCalled();

});