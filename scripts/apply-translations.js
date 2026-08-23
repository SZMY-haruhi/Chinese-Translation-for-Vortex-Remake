"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ZH = path.join(ROOT, "zh");
const MAP = require("./new-translations");

const JUNK_KEY = /^(?:[a-z][a-z0-9_]*)(?::{2,3}[a-z0-9_]+)+$/i;

function isJunkKey(key, value) {
  if (!JUNK_KEY.test(key)) return false;
  return value === key || typeof value !== "string";
}

function walkReplace(node) {
  if (node == null || typeof node !== "object" || Array.isArray(node)) return { replaced: 0, removed: 0 };
  let replaced = 0;
  let removed = 0;
  for (const key of Object.keys(node)) {
    const value = node[key];
    if (isJunkKey(key, value)) {
      delete node[key];
      removed += 1;
      continue;
    }
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      const inner = walkReplace(value);
      replaced += inner.replaced;
      removed += inner.removed;
      if (Object.keys(value).length === 0) delete node[key];
    } else if (typeof value === "string" && Object.prototype.hasOwnProperty.call(MAP, value)) {
      node[key] = MAP[value];
      replaced += 1;
    }
  }
  return { replaced, removed };
}

function remainingEnglish(node, acc = []) {
  if (node == null || typeof node !== "object") return acc;
  for (const [k, v] of Object.entries(node)) {
    if (v != null && typeof v === "object") remainingEnglish(v, acc);
    else if (typeof v === "string" && /[A-Za-z]{5,}/.test(v) && !/[\u4e00-\u9fff]/.test(v) && v === k) {
      acc.push(k);
    }
  }
  return acc;
}

function main() {
  let replaced = 0;
  let removed = 0;
  const leftovers = [];
  for (const name of fs.readdirSync(ZH)) {
    if (!name.endsWith(".json")) continue;
    const file = path.join(ZH, name);
    let text = fs.readFileSync(file, "utf8");
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    const data = JSON.parse(text);
    const stats = walkReplace(data);
    replaced += stats.replaced;
    removed += stats.removed;
    leftovers.push(...remainingEnglish(data).map((k) => `${name}:${k}`));
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
  }
  const summary = { replaced, removedJunk: removed, leftoverExactEnglishKeys: leftovers.length };
  fs.writeFileSync(
    path.join(ROOT, "catalogs", "translate-summary.json"),
    JSON.stringify({ ...summary, leftovers: leftovers.slice(0, 50) }, null, 2),
  );
  console.log(JSON.stringify(summary, null, 2));
}

main();
