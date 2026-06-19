import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = process.cwd();
const prismaDir = path.join(projectRoot, "prisma");
const dbPath = path.join(prismaDir, "dev.db");

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      DATABASE_URL: "file:./prisma/dev.db",
      ...env,
    },
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

fs.mkdirSync(prismaDir, { recursive: true });

if (!fs.existsSync(dbPath)) {
  fs.closeSync(fs.openSync(dbPath, "w"));
}

console.log("Preparing Netlify SQLite database...");
// Regenerate the Prisma client against the current schema so the build
// environment has the query engines for all configured binaryTargets
// (e.g. debian-openssl-3.0.x). Cached node_modules may carry a client
// generated before the schema's binaryTargets changed, which makes the
// seed step fail with "could not locate the Query Engine".
run("npx", ["prisma", "generate"]);
run("npx", ["prisma", "db", "push", "--skip-generate"]);
run("npm", ["run", "db:seed"]);
console.log(`Netlify SQLite database is ready at ${dbPath}`);
