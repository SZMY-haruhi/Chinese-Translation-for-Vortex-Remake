"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const ZIP = path.join(DIST, "Chinese-Translation-for-Vortex-2.5.0.zip");

function validate() {
  const zh = path.join(ROOT, "zh");
  const files = fs.readdirSync(zh).filter((n) => n.endsWith(".json"));
  const errors = [];
  for (const name of files) {
    if (name.includes("${")) {
      errors.push(`illegal filename: ${name}`);
      continue;
    }
    const raw = fs.readFileSync(path.join(zh, name), "utf8").replace(/^\uFEFF/, "");
    try {
      JSON.parse(raw);
    } catch (err) {
      errors.push(`${name}: ${err.message}`);
    }
  }
  return { files: files.length, errors };
}

function main() {
  execFileSync(process.execPath, [path.join(__dirname, "branding.js")], { stdio: "inherit" });
  const { files, errors } = validate();
  if (errors.length) {
    console.error(JSON.stringify({ files, errors }, null, 2));
    process.exit(1);
  }
  fs.mkdirSync(DIST, { recursive: true });
  if (fs.existsSync(ZIP)) fs.unlinkSync(ZIP);
  const staging = path.join(DIST, "_staging");
  fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(path.join(staging, "zh"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "readme.txt"), path.join(staging, "readme.txt"));
  for (const name of fs.readdirSync(path.join(ROOT, "zh"))) {
    if (!name.endsWith(".json") || name.includes("${")) continue;
    fs.copyFileSync(path.join(ROOT, "zh", name), path.join(staging, "zh", name));
  }
  execFileSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-File",
      path.join(__dirname, "package-zip.ps1"),
      "-Staging",
      staging,
      "-ZipPath",
      ZIP,
    ],
    { stdio: "inherit" },
  );
  fs.rmSync(staging, { recursive: true, force: true });
  const stat = fs.statSync(ZIP);
  console.log(JSON.stringify({ files, zip: ZIP, bytes: stat.size }, null, 2));
}

main();
