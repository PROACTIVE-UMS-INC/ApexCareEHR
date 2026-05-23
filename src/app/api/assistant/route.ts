import { NextResponse } from "next/server";
import { readAdminConfig } from "@/lib/admin/store";

function classifyIntent(message: string) {
  const text = message.toLowerCase();

  if (/(reschedule|move\s+my\s+appointment|change\s+my\s+appointment)/.test(text)) return "reschedule" as const;
  if (/(cancel\s+my\s+appointment|cancel\s+appointment|remove\s+appointment)/.test(text)) return "cancel" as const;
  if (/(schedule|book|new\s+appointment)/.test(text)) return "schedule" as const;
  if (/(my\s+appointments|next\s+appointment|upcoming\s+appointment|show\s+appointments)/.test(text)) return "lookup" as const;
  return "faq" as const;
}

async function faqReply(message: string) {
  const config = await readAdminConfig();
  const text = message.toLowerCase();

  if (/(phone|call|number)/.test(text)) {
    return `You can reach ${config.org.orgName} at ${config.branding.supportPhone}.`;
  }

  if (/(email|support)/.test(text)) {
    return `For support, email ${config.branding.supportEmail}.`;
  }

  if (/(website|site|url)/.test(text)) {
    return `Our website is ${config.org.website}.`;
  }

  if (/(hours|open|close)/.test(text)) {
    return "Office hours vary by provider and location. Please contact support for exact hours.";
  }

  return "I can answer practice questions here. For appointment scheduling, rescheduling, cancellation, and upcoming appointment lookup, sign in to the patient portal.";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const message = String(body?.message || "").trim();

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const intent = classifyIntent(message);
  if (intent !== "faq") {
    return NextResponse.json({
      reply: "To manage appointments, please sign in to the patient portal assistant. I can still help with general practice information here.",
      action: {
        type: intent,
        status: "needs-input",
        note: "Portal login required for appointment actions",
      },
    });
  }

  const reply = await faqReply(message);
  return NextResponse.json({
    reply,
    action: {
      type: "faq",
      status: "ok",
      note: "Answered public FAQ",
    },
  });
}
