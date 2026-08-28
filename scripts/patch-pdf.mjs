import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.join(__dirname, "..", "node_modules", "@react-pdf", "hyphenate", "package.json");

if (fs.existsSync(pkgPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    let modified = false;
    if (pkg.exports && pkg.exports["./*"] && !pkg.exports["./*"].default) {
      pkg.exports["./*"].default = "./lib/*.js";
      modified = true;
    }
    if (pkg.exports && pkg.exports["."] && !pkg.exports["."].default) {
      pkg.exports["."].default = "./lib/index.js";
      modified = true;
    }
    if (pkg.exports && !pkg.exports["./package.json"]) {
      pkg.exports["./package.json"] = "./package.json";
      modified = true;
    }
    if (modified) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
      console.log("? Patched @react-pdf/hyphenate package.json exports");
    }
  } catch (err) {
    console.warn("Could not patch @react-pdf/hyphenate:", err instanceof Error ? err.message : String(err));
  }
}
