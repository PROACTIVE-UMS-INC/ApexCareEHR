import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSession();
  const { id } = await params;
  const b = await req.json();
  if (!b.type || !b.itemName) return NextResponse.json({ error: "type and itemName required" }, { status: 400 });

  const providerId = user.role === "provider" ? user.id : (await db.user.findFirst({ where: { role: "provider", active: true } }))!.id;

  const created = await db.order.create({
    data: {
      patientId: id,
      providerId,
      type: b.type,
      itemName: b.itemName,
      itemCode: b.itemCode || null,
      instructions: b.instructions || null,
      priority: b.priority || "routine",
      rxStrength: b.rxStrength || null,
      rxForm: b.rxForm || null,
      rxSig: b.rxSig || null,
      rxQty: b.rxQty || null,
      rxRefills: typeof b.rxRefills === "number" ? b.rxRefills : null,
      diagnosisCode: b.diagnosisCode || null,
      encounterId: b.encounterId || null,
    },
  });
  // mirror Rx orders into the medications list
  if (b.type === "rx") {
    await db.medication.create({
      data: {
        patientId: id,
        name: b.itemName,
        strength: b.rxStrength || null,
        sig: b.rxSig || null,
        prescriberId: providerId,
        startDate: new Date(),
      },
    });
  }
  return NextResponse.json({ ok: true, order: created });
}
