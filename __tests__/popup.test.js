const fs = require("fs");
const path = require("path");

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

  test("popup.html exists", () => {
    expect(fs.existsSync(popupHtml)).toBe(true);
  });

  test("popup.js exists", () => {
    expect(fs.existsSync(popupJs)).toBe(true);
  });

});