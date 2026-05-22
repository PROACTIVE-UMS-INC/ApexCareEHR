import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";

function resolveDatabaseUrl() {
  const configuredUrl = process.env.DATABASE_URL;

  if (process.env.NETLIFY) {
    const candidates = [
      path.join(process.cwd(), "prisma", "dev.db"),
      path.join(process.cwd(), ".netlify", "functions-internal", "___netlify-server-handler", "prisma", "dev.db"),
      path.join("/var/task", "prisma", "dev.db"),
      path.join("/var/task", ".netlify", "functions-internal", "___netlify-server-handler", "prisma", "dev.db"),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return pathToFileURL(candidate).toString();
      }
    }

    // Fallback for Netlify bundles where the DB is copied relative to the function cwd.
    return "file:./prisma/dev.db";
  }

  return configuredUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolveDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
