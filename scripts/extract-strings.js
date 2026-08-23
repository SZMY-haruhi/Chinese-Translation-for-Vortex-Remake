"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const VORTEX_SRC = path.join(ROOT, "vendor", "vortex-src");
const EN_LOCALES = path.join(VORTEX_SRC, "locales", "en");
const BUNDLED = "G:\\Program Files\\Vortex\\resources\\app.asar.unpacked\\bundledPlugins";
const OUT_DIR = path.join(ROOT, "catalogs");

const SKIP_DIR = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  "__tests__",
  "test",
  "tests",
  ".storybook",
]);

const CALL_RE =
  /(?:\b(?:t|laterT|translate)\b)\s*\(\s*(['"`])((?:\\.|(?!\1).)*?)\1/g;

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIR.has(name)) continue;
    const full = path.join(dir, name);
    let stat;
    try {
      stat = fs.statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/i.test(name) && !name.endsWith(".map")) {
      if (/\.(test|spec|stories)\./i.test(name)) continue;
      acc.push(full);
    }
  }
  return acc;
}

function unescape(str, quote) {
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r")
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\`/g, "`")
    .replace(/\\\\/g, "\\");
}

function isUsefulKey(key) {
  if (typeof key !== "string") return false;
  const trimmed = key.trim();
  if (trimmed.length < 2) return false;
  if (/^\$\{/.test(trimmed)) return false;
  if (trimmed.includes("${")) return false;
  if (/^[\d.\-]+$/.test(trimmed)) return false;
  if (/^(undefined|null|true|false)$/.test(trimmed)) return false;
  if (/^https?:\/\//i.test(trimmed)) return false;
  if (/^[./\\]/.test(trimmed) && trimmed.length < 8) return false;
  return true;
}

function looksNamespaced(key) {
  if (!/^[a-z0-9_]+:[a-zA-Z0-9_.]+$/.test(key)) return false;
  const ns = key.split(":")[0];
  return [
    "common",
    "collection",
    "mod_management",
    "download_management",
    "profile_management",
    "nexus_integration",
    "gamemode_management",
    "extension_manager",
    "health_check",
  ].includes(ns);
}

function setDeep(obj, dotted, value) {
  const parts = dotted.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] == null || typeof cur[parts[i]] !== "object") {
      cur[parts[i]] = {};
    }
    cur = cur[parts[i]];
  }
  if (cur[parts[parts.length - 1]] === undefined) {
    cur[parts[parts.length - 1]] = value;
  }
}

function namespaceFromFile(file, roots) {
  const norm = file.replace(/\\/g, "/");
  const bundledIdx = norm.toLowerCase().indexOf("/bundledplugins/");
  if (bundledIdx !== -1) {
    const rest = norm.slice(bundledIdx + "/bundledplugins/".length);
    return rest.split("/")[0];
  }
  const gamesIdx = norm.indexOf("/extensions/games/");
  if (gamesIdx !== -1) {
    const rest = norm.slice(gamesIdx + "/extensions/games/".length);
    const folder = rest.split("/")[0];
    if (folder) return folder;
  }
  const extIdx = norm.indexOf("/extensions/");
  if (extIdx !== -1) {
    const rest = norm.slice(extIdx + "/extensions/".length);
    const folder = rest.split("/")[0];
    if (folder && folder !== "src" && folder !== "games") return folder;
  }
  return "common";
}

function extractFromFile(file, nsHint) {
  const text = fs.readFileSync(file, "utf8");
  const found = [];
  CALL_RE.lastIndex = 0;
  let m;
  while ((m = CALL_RE.exec(text))) {
    const key = unescape(m[2], m[1]);
    if (!isUsefulKey(key)) continue;
    found.push({ key, nsHint });
  }
  return found;
}

function loadOfficialEn() {
  const result = {};
  if (!fs.existsSync(EN_LOCALES)) return result;
  for (const name of fs.readdirSync(EN_LOCALES)) {
    if (!name.endsWith(".json")) continue;
    const ns = name.slice(0, -5);
    result[ns] = JSON.parse(fs.readFileSync(path.join(EN_LOCALES, name), "utf8"));
  }
  return result;
}

function flatten(obj, prefix = "", out = {}) {
  if (obj == null || typeof obj !== "object" || Array.isArray(obj)) {
    if (prefix) out[prefix] = obj;
    return out;
  }
  const keys = Object.keys(obj);
  if (keys.length === 0 && prefix) {
    out[prefix] = obj;
    return out;
  }
  for (const k of keys) {
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
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const official = loadOfficialEn();
  const literals = { common: {} };
  const sources = { official: 0, src: 0, bundled: 0 };

  for (const [ns, tree] of Object.entries(official)) {
    const flat = flatten(tree);
    sources.official += Object.keys(flat).length;
  }

  const srcFiles = [
    ...walk(path.join(VORTEX_SRC, "src")),
    ...walk(path.join(VORTEX_SRC, "extensions")),
  ];
  for (const file of srcFiles) {
    const nsHint = namespaceFromFile(file);
    for (const { key } of extractFromFile(file, nsHint)) {
      if (looksNamespaced(key)) {
        const [ns, rest] = key.split(":");
        if (!official[ns]) official[ns] = {};
        setDeep(official[ns], rest, rest.split(".").pop());
        continue;
      }
      if (literals.common[key] === undefined) {
        literals.common[key] = key;
        sources.src += 1;
      }
      if (nsHint && nsHint !== "common") {
        if (!literals[nsHint]) literals[nsHint] = {};
        if (literals[nsHint][key] === undefined) literals[nsHint][key] = key;
      }
    }
  }

  const bundledFiles = walk(BUNDLED);
  for (const file of bundledFiles) {
    const ns = namespaceFromFile(file);
    for (const { key } of extractFromFile(file, ns)) {
      if (looksNamespaced(key)) continue;
      if (literals.common[key] === undefined) {
        literals.common[key] = key;
        sources.bundled += 1;
      }
      if (ns && ns !== "common") {
        if (!literals[ns]) literals[ns] = {};
        if (literals[ns][key] === undefined) literals[ns][key] = key;
      }
    }
  }

  const catalog = {
    generatedAt: new Date().toISOString(),
    vortexVersion: "2.5.0",
    counts: {
      officialNamespaces: Object.keys(official).length,
      officialKeys: sources.official,
      literalCommon: Object.keys(literals.common).length,
      extraNamespaces: Object.keys(literals).filter((n) => n !== "common").length,
      srcHits: sources.src,
      bundledHits: sources.bundled,
    },
    official,
    literals,
  };

  fs.writeFileSync(
    path.join(OUT_DIR, "en-catalog.json"),
    JSON.stringify(catalog, null, 2),
    "utf8",
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "extract-summary.json"),
    JSON.stringify(catalog.counts, null, 2),
    "utf8",
  );
  console.log(JSON.stringify(catalog.counts, null, 2));
}

main();
