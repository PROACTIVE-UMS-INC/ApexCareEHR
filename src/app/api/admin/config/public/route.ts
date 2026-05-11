import { NextResponse } from "next/server";
import { readAdminConfig } from "@/lib/admin/store";

export async function GET() {
  const config = await readAdminConfig();
  return NextResponse.json({
    branding: config.branding,
    landing: config.landing,
    portal: config.portal,
  });
}
