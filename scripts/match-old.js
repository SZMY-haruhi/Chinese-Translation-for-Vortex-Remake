"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CATALOG = path.join(ROOT, "catalogs", "en-catalog.json");
const OLD_DIRS = [
  path.join(ROOT, "vendor", "old-zh-installed", "zh"),
  path.join(ROOT, "vendor", "old-zh", "zh"),
];
const OUT = path.join(ROOT, "catalogs");
const ZH = path.join(ROOT, "zh");

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

function unflatten(flat) {
  const out = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".");
    let cur = out;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      const looksIndex = false;
      if (cur[p] == null || typeof cur[p] !== "object") cur[p] = {};
      cur = cur[p];
    }
    cur[parts[parts.length - 1]] = value;
  }
  return out;
}

function loadJson(file) {
  try {
    let text = fs.readFileSync(file, "utf8");
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function loadTMs() {
  const byNs = {};
  const byEnglishValue = new Map();
  for (const dir of OLD_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".json")) continue;
      const ns = name.slice(0, -5);
      const data = loadJson(path.join(dir, name));
      const flat = flatten(data);
      if (!byNs[ns]) byNs[ns] = {};
      for (const [k, v] of Object.entries(flat)) {
        if (typeof v !== "string") continue;
        if (byNs[ns][k] === undefined) byNs[ns][k] = v;
        if (typeof k === "string" && k !== v && !byEnglishValue.has(k)) {
          byEnglishValue.set(k, v);
        }
        if (!byEnglishValue.has(v) && /[A-Za-z]/.test(String(v)) === false) {
          // value is already Chinese; skip reverse index by value
        }
      }
    }
  }
  return { byNs, byEnglishValue };
}

function isChinese(str) {
  return typeof str === "string" && /[\u4e00-\u9fff]/.test(str);
}

function pickTranslation(ns, key, english, tms) {
  const nsMap = tms.byNs[ns] || {};
  if (typeof nsMap[key] === "string" && nsMap[key] !== key) {
    return { value: nsMap[key], how: "exact-key" };
  }
  if (tms.byNs.common && typeof tms.byNs.common[key] === "string" && tms.byNs.common[key] !== key) {
    return { value: tms.byNs.common[key], how: "common-key" };
  }
  if (typeof english === "string" && tms.byEnglishValue.has(english)) {
    const v = tms.byEnglishValue.get(english);
    if (v !== english) return { value: v, how: "english-value" };
  }
  if (typeof english === "string" && tms.byNs.common && tms.byNs.common[english] && tms.byNs.common[english] !== english) {
    return { value: tms.byNs.common[english], how: "common-english" };
  }
  return null;
}

function sortObject(obj) {
  if (obj == null || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const out = {};
  for (const k of Object.keys(obj).sort((a, b) => a.localeCompare(b))) {
    out[k] = typeof obj[k] === "object" && obj[k] != null && !Array.isArray(obj[k])
      ? sortObject(obj[k])
      : obj[k];
  }
  return out;
}

function main() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const tms = loadTMs();
  const reused = [];
  const pending = [];
  const stale = [];

  const zhFiles = {};

  function apply(ns, key, english, treeWriter) {
    if (typeof english !== "string") return;
    if (key === "_comment") {
      treeWriter(key, english, "comment");
      return;
    }
    const hit = pickTranslation(ns, key, english, tms);
    if (hit) {
      treeWriter(key, hit.value, hit.how);
      reused.push({ ns, key, en: english, zh: hit.value, how: hit.how });
    } else {
      treeWriter(key, english, "pending");
      pending.push({ ns, key, en: english });
    }
  }

  for (const [ns, tree] of Object.entries(catalog.official || {})) {
    if (!zhFiles[ns]) zhFiles[ns] = {};
    const flat = flatten(tree);
    for (const [key, english] of Object.entries(flat)) {
      apply(ns, key, english, (k, v) => {
        const parts = k.split(".");
        let cur = zhFiles[ns];
        for (let i = 0; i < parts.length - 1; i++) {
          if (cur[parts[i]] == null || typeof cur[parts[i]] !== "object") cur[parts[i]] = {};
          cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = v;
      });
    }
  }

  for (const [ns, map] of Object.entries(catalog.literals || {})) {
    if (!zhFiles[ns]) zhFiles[ns] = {};
    for (const [key, english] of Object.entries(map)) {
      if (zhFiles[ns][key] !== undefined) continue;
      apply(ns, key, english, (k, v) => {
        zhFiles[ns][k] = v;
      });
    }
  }

  for (const [ns, map] of Object.entries(tms.byNs)) {
    if (ns.includes("${") || ns.includes("statics")) continue;
    if (!zhFiles[ns]) zhFiles[ns] = {};
    for (const [key, zh] of Object.entries(map)) {
      if (typeof zh !== "string") continue;
      if (key.includes("${") || key.length > 400) continue;
      if (/\\|\/[A-Za-z]:/.test(key) && key.length > 80) continue;
      const exists = zhFiles[ns][key] !== undefined
        || (catalog.literals[ns] && catalog.literals[ns][key] !== undefined)
        || (catalog.literals.common && catalog.literals.common[key] !== undefined);
      if (!exists) {
        zhFiles[ns][key] = zh;
        stale.push({ ns, key, zh });
      }
    }
  }

  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(ZH, { recursive: true });
  fs.writeFileSync(path.join(OUT, "reused.json"), JSON.stringify(reused, null, 2));
  fs.writeFileSync(path.join(OUT, "pending.json"), JSON.stringify(pending, null, 2));
  fs.writeFileSync(path.join(OUT, "stale.json"), JSON.stringify(stale, null, 2));
  fs.writeFileSync(
    path.join(OUT, "match-summary.json"),
    JSON.stringify(
      {
        reused: reused.length,
        pending: pending.length,
        stale: stale.length,
        files: Object.keys(zhFiles).length,
      },
      null,
      2,
    ),
  );

  for (const [ns, tree] of Object.entries(zhFiles)) {
    const file = path.join(ZH, `${ns}.json`);
    fs.writeFileSync(file, JSON.stringify(sortObject(tree), null, 2) + "\n", "utf8");
  }

  console.log(JSON.stringify({
    reused: reused.length,
    pending: pending.length,
    stale: stale.length,
    files: Object.keys(zhFiles).length,
  }, null, 2));
}

main();
