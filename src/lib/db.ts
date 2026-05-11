import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function resolveDatabaseUrl() {
  const configuredUrl = process.env.DATABASE_URL;
  const bundledDbPath = path.join(process.cwd(), "prisma", "dev.db");
  if (process.env.NETLIFY && fs.existsSync(bundledDbPath)) {
    return `file:${bundledDbPath.replace(/\\/g, "/")}`;
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
