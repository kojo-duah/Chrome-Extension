const fs = require("fs");
const path = require("path");

describe("Background tests", () => {

  const bgPath = path.join(
    process.cwd(),
    "extension",
    "background.js"
  );

  test("background.js exists", () => {
    expect(fs.existsSync(bgPath)).toBe(true);
  });

});