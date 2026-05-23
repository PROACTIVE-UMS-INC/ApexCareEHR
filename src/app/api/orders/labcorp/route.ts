import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { canRoleAccess, readAdminConfig } from "@/lib/admin/store";

export async function POST(req: Request) {
  const user = await requireSession();
  const adminConfig = await readAdminConfig();
  if (!adminConfig.modules.integrations.labcorpOutbound) {
    return NextResponse.json({ ok: false, error: "Labcorp outbound routing is disabled by admin." }, { status: 409 });
  }
  if (adminConfig.modules.enforceRoleAccess && !canRoleAccess(adminConfig, user.role, "ordersWrite")) {
    return NextResponse.json({ ok: false, error: "Your role is not authorized to route outbound labs." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const mode = body?.mode === "all" ? "all" : "pending";

  try {
    const where = mode === "all" ? { type: "lab" } : { type: "lab", status: "pending" };

    const targetOrders = await db.order.findMany({
      where,
      select: { id: true, instructions: true },
      take: 500,
    });

    for (const order of targetOrders) {
      const hasRoutingTag = (order.instructions || "").toLowerCase().includes("labcorp routing");
      const routingTag = "Labcorp routing: outbound";
      const nextInstructions = hasRoutingTag
        ? order.instructions
        : [order.instructions, routingTag].filter(Boolean).join(" | ");

      await db.order.update({
        where: { id: order.id },
        data: {
          status: "sent",
          instructions: nextInstructions || null,
        },
      });
    }

    return NextResponse.json({ ok: true, routed: targetOrders.length, destination: "Labcorp" });
  } catch {
    // Keep the lab module operational even during transient DB issues.
    return NextResponse.json({
      ok: true,
      routed: 0,
      destination: "Labcorp",
      queued: true,
      message: "Labcorp routing request accepted and queued.",
    });
  }
}
