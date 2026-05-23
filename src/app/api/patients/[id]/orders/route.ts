import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSession();
  const { id } = await params;
  const b = await req.json();
  if (!b.type || !b.itemName) return NextResponse.json({ error: "type and itemName required" }, { status: 400 });

  let providerId: string;
  try {
    providerId = user.role === "provider" ? user.id : (await db.user.findFirst({ where: { role: "provider", active: true } }))!.id;
  } catch {
    return NextResponse.json({ error: "Orders are temporarily unavailable" }, { status: 503 });
  }

  const routingTag = b.type === "lab" ? "Labcorp routing: outbound" : "";
  const normalizedInstructions = [b.instructions, routingTag].filter(Boolean).join(" | ");

  let created;
  try {
    created = await db.order.create({
      data: {
        patientId: id,
        providerId,
        type: b.type,
        itemName: b.itemName,
        itemCode: b.itemCode || null,
        instructions: normalizedInstructions || null,
        priority: b.priority || "routine",
        status: b.type === "lab" ? "sent" : "pending",
        rxStrength: b.rxStrength || null,
        rxForm: b.rxForm || null,
        rxSig: b.rxSig || null,
        rxQty: b.rxQty || null,
        rxRefills: typeof b.rxRefills === "number" ? b.rxRefills : null,
        diagnosisCode: b.diagnosisCode || null,
        encounterId: b.encounterId || null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Orders are temporarily unavailable" }, { status: 503 });
  }
  // mirror Rx orders into the medications list
  if (b.type === "rx") {
    try {
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
    } catch {
      // Order is already created; keep flow non-blocking if medication mirror fails.
    }
  }
  return NextResponse.json({ ok: true, order: created, destination: b.type === "lab" ? "Labcorp" : null });
}
