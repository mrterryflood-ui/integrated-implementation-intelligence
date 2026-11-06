import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

const runtimePattern =
  /\bREPLIT_[A-Z0-9_]+\b|@replit\/|https?:\/\/[^/\s"'`]*replit\.(?:com|dev|co|app)\b/i;

function runtimeFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return runtimeFiles(path);
    return /\.(?:js|mjs|json|html)$/.test(entry.name) ? [path] : [];
  });
}

test("static app and API functions have no Replit-specific runtime requirement", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  assert.deepEqual(
    Object.keys(dependencies).filter((name) => /replit/i.test(name)),
    [],
  );
  for (const root of [process.cwd(), resolve("..", "..")]) {
    for (const config of [".replit", "replit.nix", "replit.json", "replit.toml"]) {
      assert.equal(existsSync(join(root, config)), false, join(root, config));
    }
  }

  for (const file of [...runtimeFiles("api"), "index.html", "signin.html", "package.json"]) {
    assert.doesNotMatch(readFileSync(file, "utf8"), runtimePattern, file);
  }
});
