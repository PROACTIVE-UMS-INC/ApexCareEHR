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
run("npx", ["prisma", "db", "push", "--skip-generate"]);
run("npm", ["run", "db:seed"]);
console.log(`Netlify SQLite database is ready at ${dbPath}`);
