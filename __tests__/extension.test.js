const fs = require("fs");
const path = require("path");

describe("Extension file tests", () => {

  const extensionPath = path.join(process.cwd(), "extension");

  test("manifest.json exists", () => {
    const file = path.join(extensionPath, "manifest.json");
    expect(fs.existsSync(file)).toBe(true);
  });

  test("popup.html exists", () => {
    const file = path.join(extensionPath, "popup.html");
    expect(fs.existsSync(file)).toBe(true);
  });

  test("popup.js exists", () => {
    const file = path.join(extensionPath, "popup.js");
    expect(fs.existsSync(file)).toBe(true);
  });

  test("background.js exists", () => {
    const file = path.join(extensionPath, "background.js");
    expect(fs.existsSync(file)).toBe(true);
  });

});