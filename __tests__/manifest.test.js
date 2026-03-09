const fs = require("fs");
const path = require("path");

describe("Manifest tests", () => {

  test("manifest exists", () => {
    const manifestPath = path.join(
      process.cwd(),
      "extension",
      "manifest.json"
    );

    expect(fs.existsSync(manifestPath)).toBe(true);
  });

});