"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ZH = path.join(ROOT, "zh");

const BRAND = {
  Language: "语言 (汉化版本：2.5.0)",
  "When you select a language for the first time you may have to restart Vortex.":
    "第一次选择语言时可能需要重启 Vortex。本翻译：SZMY-haruhi、Grok",
};

function main() {
  let changed = 0;
  for (const name of ["common.json", "settings_interface.json"]) {
    const file = path.join(ZH, name);
    if (!fs.existsSync(file)) continue;
    const data = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
    for (const [key, value] of Object.entries(BRAND)) {
      if (data[key] !== value) {
        data[key] = value;
        changed += 1;
      }
    }
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
  }
  console.log(JSON.stringify({ updated: changed }));
}

main();
