import { NextResponse } from "next/server";
import { addMinutes, isValid, parse, parseISO } from "date-fns";
import { db } from "@/lib/db";
import { requirePortalSession } from "@/lib/portalAuth";
import { readAdminConfig } from "@/lib/admin/store";

type AssistantAction = {
  type: "schedule" | "reschedule" | "cancel" | "lookup" | "faq";
  status: "ok" | "needs-input" | "failed";
  note: string;
};

function parseDateTimeFromText(input: string) {
  const text = input.toLowerCase();

  const isoDateMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  const timeMatch = text.match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b|\b([01]?\d|2[0-3]):([0-5]\d)\b/);

  if (!isoDateMatch || !timeMatch) return null;

  const datePart = isoDateMatch[1];
  let hours = 9;
  let minutes = 0;

  if (timeMatch[1]) {
    const h12 = Number(timeMatch[1]);
    const mm = Number(timeMatch[2] || "0");
    const meridiem = timeMatch[3];
    hours = h12 % 12 + (meridiem === "pm" ? 12 : 0);
    minutes = mm;
  } else if (timeMatch[4]) {
    hours = Number(timeMatch[4]);
    minutes = Number(timeMatch[5]);
  }

  const dt = parse(`${datePart} ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`, "yyyy-MM-dd HH:mm", new Date());
  return isValid(dt) ? dt : null;
}

function inferLocation(input: string) {
  const text = input.toLowerCase();
  if (text.includes("telehealth") || text.includes("virtual") || text.includes("video")) return "telehealth";
  if (text.includes("home") || text.includes("house")) return "home-visit";
  return "in-office";
}

async function pickProvider(input: string) {
  const providers = await db.user.findMany({
    where: { role: "provider", active: true },
    orderBy: { lastName: "asc" },
    take: 25,
  });
  if (providers.length === 0) return null;

  const text = input.toLowerCase();
  const matched = providers.find(
    (p) => text.includes(p.lastName.toLowerCase()) || text.includes(p.firstName.toLowerCase()),
  );

  return matched || providers[0];
}

async function pickService(input: string) {
  const services = await db.serviceType.findMany({ where: { active: true }, orderBy: { name: "asc" }, take: 50 });
  if (services.length === 0) return null;

  const text = input.toLowerCase();
  const matched = services.find((s) => text.includes(s.name.toLowerCase()) || text.includes(s.category.toLowerCase()));
  return matched || null;
}

async function providerHasConflict(providerId: string, startsAt: Date, endsAt: Date) {
  const conflict = await db.appointment.findFirst({
    where: {
      providerId,
      status: { notIn: ["cancelled", "completed", "no-show"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    select: { id: true },
  });

  return !!conflict;
}

function classifyIntent(message: string) {
  const text = message.toLowerCase();

  if (/(reschedule|move\s+my\s+appointment|change\s+my\s+appointment)/.test(text)) return "reschedule" as const;
  if (/(cancel\s+my\s+appointment|cancel\s+appointment|remove\s+appointment)/.test(text)) return "cancel" as const;
  if (/(schedule|book|new\s+appointment)/.test(text)) return "schedule" as const;
  if (/(my\s+appointments|next\s+appointment|upcoming\s+appointment|show\s+appointments)/.test(text)) return "lookup" as const;
  return "faq" as const;
}

async function scheduleForPatient(message: string, patientId: string): Promise<{ reply: string; action: AssistantAction }> {
  try {
    const start = parseDateTimeFromText(message);
    if (!start) {
      return {
        reply:
          "I can schedule this for you. Please include date and time like: schedule PT on 2026-05-28 at 3:30 PM.",
        action: { type: "schedule", status: "needs-input", note: "Missing date/time" },
      };
    }

    const provider = await pickProvider(message);
    if (!provider) {
      return {
        reply: "Scheduling is currently unavailable because no active providers are available.",
        action: { type: "schedule", status: "failed", note: "No active providers" },
      };
    }

    const service = await pickService(message);
    const durationMin = service?.durationMin ?? 30;
    const end = addMinutes(start, durationMin);

    const conflict = await providerHasConflict(provider.id, start, end);
    if (conflict) {
      let suggestion = addMinutes(start, 30);
      let suggestionText = "";
      for (let i = 0; i < 8; i++) {
        const suggestionEnd = addMinutes(suggestion, durationMin);
        if (!(await providerHasConflict(provider.id, suggestion, suggestionEnd))) {
          suggestionText = ` Next available with ${provider.firstName} ${provider.lastName} is ${suggestion.toLocaleString()}.`;
          break;
        }
        suggestion = addMinutes(suggestion, 30);
      }

      return {
        reply: `That time is not available.${suggestionText || " Please provide another time."}`,
        action: { type: "schedule", status: "failed", note: "Provider conflict" },
      };
    }

    const reason = message.length > 180 ? message.slice(0, 180) : message;
    const appointment = await db.appointment.create({
      data: {
        patientId,
        providerId: provider.id,
        serviceTypeId: service?.id ?? null,
        startsAt: start,
        endsAt: end,
        location: inferLocation(message),
        reason,
        status: "scheduled",
      },
      include: { provider: true, serviceType: true },
    });

    return {
      reply: `Scheduled. Your appointment is set for ${appointment.startsAt.toLocaleString()} with ${appointment.provider.firstName} ${appointment.provider.lastName}${appointment.serviceType ? ` (${appointment.serviceType.name})` : ""}.`,
      action: { type: "schedule", status: "ok", note: `Created ${appointment.id}` },
    };
  } catch (error) {
    return {
      reply: "I could not complete scheduling right now. Please try a different time or try again shortly.",
      action: {
        type: "schedule",
        status: "failed",
        note: error instanceof Error ? error.message : "Scheduling runtime error",
      },
    };
  }
}

async function rescheduleForPatient(message: string, patientId: string): Promise<{ reply: string; action: AssistantAction }> {
  try {
    const start = parseDateTimeFromText(message);
    if (!start) {
      return {
        reply:
          "I can reschedule your appointment. Please include the new date and time, for example: reschedule to 2026-05-30 at 10:00 AM.",
        action: { type: "reschedule", status: "needs-input", note: "Missing new date/time" },
      };
    }

    const target = await db.appointment.findFirst({
      where: {
        patientId,
        status: { in: ["scheduled", "checked-in", "in-room"] },
        startsAt: { gte: new Date() },
      },
      orderBy: { startsAt: "asc" },
      include: { serviceType: true, provider: true },
    });

    if (!target) {
      return {
        reply: "I could not find an upcoming appointment to reschedule.",
        action: { type: "reschedule", status: "failed", note: "No upcoming appointment" },
      };
    }

    const durationMin = target.serviceType?.durationMin ?? 30;
    const end = addMinutes(start, durationMin);

    const conflict = await db.appointment.findFirst({
      where: {
        providerId: target.providerId,
        id: { not: target.id },
        status: { notIn: ["cancelled", "completed", "no-show"] },
        startsAt: { lt: end },
        endsAt: { gt: start },
      },
      select: { id: true },
    });

    if (conflict) {
      return {
        reply: "That new time is not available for your provider. Please send another time.",
        action: { type: "reschedule", status: "failed", note: "Provider conflict" },
      };
    }

    const updated = await db.appointment.update({
      where: { id: target.id },
      data: { startsAt: start, endsAt: end, status: "scheduled" },
    });

    return {
      reply: `Done. Your appointment was rescheduled to ${updated.startsAt.toLocaleString()}.`,
      action: { type: "reschedule", status: "ok", note: `Updated ${updated.id}` },
    };
  } catch (error) {
    return {
      reply: "I could not complete rescheduling right now. Please try again shortly.",
      action: {
        type: "reschedule",
        status: "failed",
        note: error instanceof Error ? error.message : "Rescheduling runtime error",
      },
    };
  }
}

async function cancelForPatient(patientId: string): Promise<{ reply: string; action: AssistantAction }> {
  try {
    const target = await db.appointment.findFirst({
      where: {
        patientId,
        status: { in: ["scheduled", "checked-in", "in-room"] },
        startsAt: { gte: new Date() },
      },
      orderBy: { startsAt: "asc" },
    });

    if (!target) {
      return {
        reply: "I could not find an upcoming appointment to cancel.",
        action: { type: "cancel", status: "failed", note: "No upcoming appointment" },
      };
    }

    await db.appointment.update({ where: { id: target.id }, data: { status: "cancelled" } });

    return {
      reply: `Your appointment on ${target.startsAt.toLocaleString()} has been cancelled.`,
      action: { type: "cancel", status: "ok", note: `Cancelled ${target.id}` },
    };
  } catch (error) {
    return {
      reply: "I could not complete cancellation right now. Please try again shortly.",
      action: {
        type: "cancel",
        status: "failed",
        note: error instanceof Error ? error.message : "Cancellation runtime error",
      },
    };
  }
}

async function lookupForPatient(patientId: string): Promise<{ reply: string; action: AssistantAction }> {
  const upcoming = await db.appointment.findMany({
    where: { patientId, startsAt: { gte: new Date() }, status: { not: "cancelled" } },
    include: { provider: true, serviceType: true },
    orderBy: { startsAt: "asc" },
    take: 3,
  });

  if (upcoming.length === 0) {
    return {
      reply: "You do not have any upcoming appointments right now.",
      action: { type: "lookup", status: "ok", note: "No upcoming appointments" },
    };
  }

  const lines = upcoming.map(
    (a, idx) => `${idx + 1}. ${a.startsAt.toLocaleString()} with ${a.provider.firstName} ${a.provider.lastName}${a.serviceType ? ` (${a.serviceType.name})` : ""}`,
  );

  return {
    reply: `Here are your upcoming appointments:\n${lines.join("\n")}`,
    action: { type: "lookup", status: "ok", note: `Returned ${upcoming.length} appointments` },
  };
}

async function faqReply(message: string) {
  const config = await readAdminConfig();
  const text = message.toLowerCase();

  if (/(phone|call|number)/.test(text)) {
    return {
      reply: `You can reach ${config.org.orgName} at ${config.branding.supportPhone}.`,
      action: { type: "faq", status: "ok", note: "Answered phone question" } as AssistantAction,
    };
  }

  if (/(email|support)/.test(text)) {
    return {
      reply: `For support, email ${config.branding.supportEmail}.`,
      action: { type: "faq", status: "ok", note: "Answered email question" } as AssistantAction,
    };
  }

  if (/(website|site|url)/.test(text)) {
    return {
      reply: `Our website is ${config.org.website}.`,
      action: { type: "faq", status: "ok", note: "Answered website question" } as AssistantAction,
    };
  }

  if (/(portal|documents|download)/.test(text)) {
    return {
      reply: config.portal.allowDocumentDownload
        ? "You can view and download documents in the Documents section of the portal."
        : "Document download is currently disabled in the portal. You can still view your records.",
      action: { type: "faq", status: "ok", note: "Answered portal documents question" } as AssistantAction,
    };
  }

  if (/(pay|payment|bill)/.test(text)) {
    return {
      reply: config.portal.allowOnlinePayments
        ? "Online payments are enabled. You can complete payment in the Billing section."
        : "Online payments are not enabled yet. Please contact the front desk for payment assistance.",
      action: { type: "faq", status: "ok", note: "Answered billing question" } as AssistantAction,
    };
  }

  return {
    reply:
      "I can help with practice info and appointment tasks. Try: 'show my next appointment', 'schedule on 2026-05-30 at 2:00 PM', 'reschedule to 2026-06-01 at 10:30 AM', or 'cancel my appointment'.",
    action: { type: "faq", status: "ok", note: "Returned capability help" } as AssistantAction,
  };
}

export async function POST(req: Request) {
  const session = await requirePortalSession();
  const body = await req.json().catch(() => ({}));
  const message = String(body?.message || "").trim();

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const intent = classifyIntent(message);

  if (intent === "schedule") {
    const result = await scheduleForPatient(message, session.patientId);
    return NextResponse.json(result);
  }

  if (intent === "reschedule") {
    const result = await rescheduleForPatient(message, session.patientId);
    return NextResponse.json(result);
  }

  if (intent === "cancel") {
    const result = await cancelForPatient(session.patientId);
    return NextResponse.json(result);
  }

  if (intent === "lookup") {
    const result = await lookupForPatient(session.patientId);
    return NextResponse.json(result);
  }

  const result = await faqReply(message);
  return NextResponse.json(result);
}
