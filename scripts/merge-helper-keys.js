"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ZH = path.join(ROOT, "zh");
const PLUGIN_ROOT = path.join(process.env.APPDATA, "Vortex", "plugins");

function loadJson(file) {
  let text = fs.readFileSync(file, "utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return JSON.parse(text);
}

function flatten(obj, prefix = "", out = {}) {
  if (obj == null || typeof obj !== "object" || Array.isArray(obj)) {
    if (prefix) out[prefix] = obj;
    return out;
  }
  for (const k of Object.keys(obj)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (obj[k] != null && typeof obj[k] === "object" && !Array.isArray(obj[k])) {
      flatten(obj[k], next, out);
    } else {
      out[next] = obj[k];
    }
  }
  return out;
}

function main() {
  const added = [];
  if (!fs.existsSync(PLUGIN_ROOT)) {
    console.log(JSON.stringify({ added: 0, reason: "no plugins dir" }));
    return;
  }
  for (const name of fs.readdirSync(PLUGIN_ROOT)) {
    const dir = path.join(PLUGIN_ROOT, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    if (/Chinese/i.test(name)) continue;
    const langs = fs.readdirSync(dir).filter((n) => /^[a-z]{2}(-[A-Z]{2})?$/.test(n));
    for (const lang of langs) {
      const langDir = path.join(dir, lang);
      if (!fs.statSync(langDir).isDirectory()) continue;
      for (const file of fs.readdirSync(langDir)) {
        if (!file.endsWith(".json")) continue;
        const ns = file.slice(0, -5);
        if (ns.includes("${")) continue;
        const flat = flatten(loadJson(path.join(langDir, file)));
        const destFile = path.join(ZH, `${ns}.json`);
        const dest = fs.existsSync(destFile) ? loadJson(destFile) : {};
        let changed = false;
        for (const key of Object.keys(flat)) {
          if (dest[key] !== undefined) continue;
          if (key.length > 400 || key.includes("${")) continue;
          dest[key] = key;
          added.push({ ns, key, from: name });
          changed = true;
        }
        if (changed) {
          fs.writeFileSync(destFile, JSON.stringify(dest, null, 2) + "\n", "utf8");
        }
      }
    }
  }
  fs.writeFileSync(
    path.join(ROOT, "catalogs", "helper-extra-keys.json"),
    JSON.stringify(added, null, 2),
  );
  console.log(JSON.stringify({ added: added.length, packs: added.length ? "other lang packs" : "none" }));
}

main();
