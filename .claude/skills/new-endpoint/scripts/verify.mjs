import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const errors = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const read = (p) => readFileSync(p, "utf8");
const importsOf = (src) =>
  [...src.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);

// ---------- 1. Static checks ----------

const allFiles = walk("src").filter((f) => f.endsWith(".ts"));

// Leftover scaffolding anywhere in src
for (const f of allFiles) {
  const src = read(f);
  if (src.includes("{{")) fail(f, "unreplaced placeholder");
  if (/@method:|\/\/ @end/.test(src)) fail(f, "leftover template marker");
}

// Resources built with the layered layout: src/routes/<name>.routes.ts
const resources = existsSync("src/routes")
  ? readdirSync("src/routes")
      .filter((f) => f.endsWith(".routes.ts"))
      .map((f) => f.replace(/\.routes\.ts$/, ""))
  : [];

const appSrc = existsSync("src/app.ts") ? read("src/app.ts") : "";
if (!appSrc) fail("src/app.ts", "not found");

const layeredFiles = new Set();

for (const name of resources) {
  const parts = {
    routes: `src/routes/${name}.routes.ts`,
    test: `src/routes/${name}.routes.test.ts`,
    schema: `src/schemas/${name}.schema.ts`,
    service: `src/services/${name}.service.ts`,
    repository: `src/repositories/${name}.repository.ts`,
  };

  for (const p of Object.values(parts)) {
    if (!existsSync(p)) fail(p, "missing file for resource " + name);
    else layeredFiles.add(p);
  }

  // Mounted under /api/<name>, before the error middleware
  const mountIdx = appSrc.indexOf(`"/api/${name}"`);
  if (!appSrc.includes(`routes/${name}.routes`))
    fail("src/app.ts", `${name} router is not imported`);
  if (mountIdx === -1)
    fail("src/app.ts", `${name} router is not mounted at /api/${name}`);
  const errIdx = appSrc.lastIndexOf("errorHandler");
  if (mountIdx !== -1 && errIdx !== -1 && mountIdx > errIdx)
    fail("src/app.ts", `${name} router is mounted after the error middleware`);

  // Layering rules: route -> service -> repository
  const check = (p, rule, bad) => {
    if (!existsSync(p)) return;
    if (importsOf(read(p)).some(bad)) fail(p, rule);
  };
  check(parts.routes, "routes must not import repositories", (i) =>
    /repositories\//.test(i),
  );
  check(
    parts.service,
    "services must not import express",
    (i) => i === "express",
  );
  check(parts.service, "services must not import routes", (i) =>
    /routes\//.test(i),
  );
  check(
    parts.repository,
    "repositories must not import express/services/routes",
    (i) => i === "express" || /services\/|routes\//.test(i),
  );
  check(
    parts.schema,
    "schemas must not import express",
    (i) => i === "express",
  );
  check(parts.test, "tests must not import src/server.ts", (i) =>
    /(^|\/)server$/.test(i),
  );
}

// Shared infrastructure is held to the same code rules
for (const f of allFiles) {
  if (/^src[\\/](errors|middleware)[\\/]/.test(f) && !f.endsWith(".test.ts"))
    layeredFiles.add(f);
}

// Code rules on layered files only (legacy files like orders.ts are untouched)
for (const f of layeredFiles) {
  const src = read(f);
  const isTest = f.endsWith(".test.ts");
  if (/console\.log/.test(src)) fail(f, "console.log is not allowed");
  if (/:\s*any\b|\bas any\b|<any>/.test(src)) fail(f, "avoid any");
  if (/@ts-ignore|@ts-expect-error/.test(src))
    fail(f, "ts-ignore / ts-expect-error not allowed");
  if (/\beval\s*\(|new Function\s*\(/.test(src))
    fail(f, "dynamic code execution not allowed");
  if (/\bTODO\b|\bFIXME\b/.test(src)) fail(f, "leftover TODO/FIXME");
  if (!isTest && /export\s+default/.test(src))
    fail(f, "use named exports, not default");
  if (
    isTest &&
    /\b(it|describe)\.(skip|only)\b|\bxit\(|\bxdescribe\(/.test(src)
  )
    fail(f, "skipped/focused tests are not allowed");
}

if (errors.length > 0) {
  console.error("Static checks failed:\n");
  for (const e of errors) console.error(`  FAIL ${e}`);
  process.exit(1);
}
console.log(
  `OK static checks (${resources.length} layered resource(s): ${resources.join(", ") || "none"})`,
);

// ---------- 2. Definition of done ----------

const steps = [
  ["npx tsc --noEmit", "typecheck"],
  ["npm run test:run", "tests"],
  ["npm audit --omit=dev --audit-level=high", "audit"],
];

for (const [cmd, label] of steps) {
  console.log(`\n> ${cmd}`);
  const r = spawnSync(cmd, { shell: true, stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`\nFAIL ${label}`);
    process.exit(1);
  }
}

console.log("\nOK all checks passed");
