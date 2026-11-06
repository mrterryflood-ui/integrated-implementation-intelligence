import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const runtimePattern =
  /\bREPLIT_[A-Z0-9_]+\b|@replit\/|https?:\/\/[^/\s"'`]*replit\.(?:com|dev|co|app)\b/i;

function runtimeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return runtimeFiles(path);
    return /\.(?:js|mjs|ts|tsx|json)$/.test(entry.name) ? [path] : [];
  });
}

test("platform build and runtime have no Replit-specific requirement", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  assert.ok(packageJson.scripts.build.includes("next build"));
  assert.ok(packageJson.scripts.start.includes("next start"));
  assert.deepEqual(
    Object.keys(dependencies).filter((name) => /replit/i.test(name)),
    [],
  );
  for (const root of [process.cwd(), resolve("..", "..")]) {
    for (const config of [".replit", "replit.nix", "replit.json", "replit.toml"]) {
      assert.equal(existsSync(join(root, config)), false, join(root, config));
    }
  }

  const files = [
    ...runtimeFiles("app"),
    ...runtimeFiles("lib"),
    ...runtimeFiles("scripts"),
    "next.config.mjs",
    "proxy.ts",
    "package.json",
  ];
  for (const file of files) {
    assert.doesNotMatch(readFileSync(file, "utf8"), runtimePattern, file);
  }
});

test("environment template records names only and contains no values", () => {
  const template = readFileSync(".env.example", "utf8");
  const entries = template
    .split(/\r?\n/)
    .filter((line) => line && !line.trimStart().startsWith("#"));

  const names = [
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "DIS_DATABASE_URL",
    "AI_GATEWAY_API_KEY",
    "AI_GATEWAY_MODEL",
    "BLOB_READ_WRITE_TOKEN",
    "RPLICE_API_KEY",
    "DIS_RPLICE_METHODS_READ_KEY",
    "DIS_TRUSTED_UPLOAD_SUBJECTS",
    "DIS_ECOSYSTEM_SERVICE_BINDINGS",
    "DIS_BUSINESS_MCP_RESOURCE_TOKEN",
  ];

  assert.deepEqual(entries, names.map((name) => `${name}=`));
  assert.doesNotMatch(template, /replit\.|(?:sk|pk)_live_[A-Za-z0-9_]+/i);
});
