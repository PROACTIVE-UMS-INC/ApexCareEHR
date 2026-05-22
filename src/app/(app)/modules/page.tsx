import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Shell from "@/components/Shell";
import JellyBeans from "@/components/JellyBeans";
import { colorForCategory, fmtDateTime } from "@/lib/utils";

const MODULES = [
  {
    key: "physical-therapy",
    title: "Physical Rehabilitation",
    lead: "Devon Jones, DPT",
    specialtyHint: "Rehab, mobility, pain reduction, post-op recovery",
    overview: "Structured therapy plans, home exercise programs, and progressive functional rehab for orthopedic and pain management cases.",
    focus: ["Initial evaluations", "Therapeutic exercise", "Manual therapy", "Post-operative rehab", "Physical rehabilitation programs"],
    patientUse: ["Low back pain", "Joint recovery", "Mobility deficits", "Chronic pain support"],
  },
  {
    key: "wound-care",
    title: "Wound Care",
    lead: "Aaron Smith, MD",
    specialtyHint: "Chronic ulcers, acute wounds, home wound visits",
    overview: "In-clinic and home-based wound management with dressing changes, infection prevention, and debridement workflows.",
    focus: ["Chronic wound follow-up", "Acute wound care", "Home evaluation", "Debridement and dressing"],
    patientUse: ["Diabetic ulcers", "Pressure injuries", "Post-surgical wounds", "Homebound patients"],
  },
  {
    key: "aesthetic-medicine",
    title: "Aesthetic Medicine",
    lead: "Linh Tan, NP",
    specialtyHint: "Injectables, lasers, RF microneedling, and regenerative aesthetics",
    overview: "Elective aesthetic services with consult-to-treatment workflows for injectables, laser treatments, and regenerative procedures.",
    focus: ["Botox", "Dermal fillers", "Endolaser (Endolift)", "Laser skin rejuvenation", "Laser hair removal", "Morpheus8 (RF + microneedling)", "Facial and capillary PRP"],
    patientUse: ["Cosmetic consults", "Facial rejuvenation", "Hair reduction", "Skin tightening", "Maintenance visits"],
  },
] as const;

export default async function ModulesPage() {
  const user = await requireSession();

  const [providers, serviceTypes, appointments, encounters] = await Promise.all([
    db.user.findMany({ where: { active: true, role: "provider" }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    db.serviceType.findMany({ where: { active: true, category: { in: MODULES.map(m => m.key) } }, orderBy: [{ category: "asc" }, { name: "asc" }] }),
    db.appointment.findMany({
      where: { startsAt: { gte: new Date() } },
      include: { patient: true, provider: true, serviceType: true },
      orderBy: { startsAt: "asc" },
      take: 24,
    }),
    db.encounter.findMany({
      where: { status: { in: ["open", "signed"] } },
      include: { patient: true, provider: true },
      orderBy: { startedAt: "desc" },
      take: 24,
    }),
  ]);

  return (
    <Shell user={user} pageTitle="Clinical Modules" jellyBeans={<JellyBeans />}>
      <div className="space-y-4">
        <section className="card card-pad bg-gradient-to-br from-white to-slate-50">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl space-y-2">
              <div className="chip bg-brand-100 text-brand-800 ring-brand-200 font-semibold">Hybrid clinic modules</div>
              <h2 className="text-2xl font-bold text-slate-900">Specialty landing zones for physical rehabilitation, wound care, and aesthetics</h2>
              <p className="text-sm text-slate-600">
                These sections are provisioned with matching providers, service types, and seeded encounters so the clinic can work the way each specialty actually runs.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm min-w-[240px]">
              <Stat label="Providers" value={providers.length} />
              <Stat label="Services" value={serviceTypes.length} />
              <Stat label="Upcoming" value={appointments.length} />
              <Stat label="Open notes" value={encounters.filter(e => e.status === "open").length} />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {MODULES.map(module => {
            const moduleServices = serviceTypes.filter(service => service.category === module.key);
            const moduleAppointments = appointments.filter(appointment => appointment.serviceType?.category === module.key);
            const moduleEncounters = encounters.filter(encounter => encounter.provider?.specialty?.toLowerCase().includes(module.key === "physical-therapy" ? "physical therapy" : module.key === "wound-care" ? "wound care" : "aesthetic") || encounter.chiefComplaint?.toLowerCase().includes(module.key === "physical-therapy" ? "pt" : module.key === "wound-care" ? "wound" : "aesthetic"));
            const lead = providers.find(provider => provider.specialty?.toLowerCase().includes(module.key === "physical-therapy" ? "physical therapy" : module.key === "wound-care" ? "wound care" : "aesthetic"));

            return (
              <section key={module.key} className="card overflow-hidden">
                <header className={`px-4 py-4 border-b border-slate-200 ${colorForCategory(module.key)} bg-opacity-40`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Module</div>
                      <h3 className="text-lg font-bold text-slate-900">{module.title}</h3>
                    </div>
                    <span className={`chip ${colorForCategory(module.key)} font-semibold`}>{moduleServices.length} services</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{module.overview}</p>
                </header>

                <div className="p-4 space-y-4">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Provisioned lead</div>
                    <div className="font-semibold text-slate-900">{lead ? `${lead.firstName} ${lead.lastName}${lead.credential ? `, ${lead.credential}` : ""}` : module.lead}</div>
                    <div className="text-xs text-slate-500">{module.specialtyHint}</div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Service set</div>
                    <div className="flex flex-wrap gap-2">
                      {moduleServices.map(service => (
                        <span key={service.id} className="chip bg-slate-100 text-slate-700 ring-slate-200">
                          {service.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Stat label="Scheduled" value={moduleAppointments.length} />
                    <Stat label="Open notes" value={moduleEncounters.filter(e => e.status === "open").length} />
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Operational focus</div>
                    <ul className="space-y-1 text-sm text-slate-600">
                      {module.focus.map(item => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Common visit reasons</div>
                    <ul className="space-y-1 text-sm text-slate-600">
                      {module.patientUse.map(item => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Next on deck</div>
                    {moduleAppointments[0] ? (
                      <div className="rounded-md bg-slate-50 ring-1 ring-slate-200 p-3 text-sm">
                        <div className="font-medium text-slate-900">
                          <Link href={`/patients/${moduleAppointments[0].patientId}`} className="hover:underline text-brand-700">
                            {moduleAppointments[0].patient.lastName}, {moduleAppointments[0].patient.firstName}
                          </Link>
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {moduleAppointments[0].reason || moduleAppointments[0].serviceType?.name || "Visit"} · {fmtDateTime(moduleAppointments[0].startsAt)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">No upcoming module appointments.</div>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <section className="card">
          <header className="px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">Recent module activity</header>
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {MODULES.map(module => {
              const latestEncounter = encounters.find(encounter => encounter.provider?.specialty?.toLowerCase().includes(module.key === "physical-therapy" ? "physical therapy" : module.key === "wound-care" ? "wound care" : "aesthetic"));
              const latestAppointment = appointments.find(appointment => appointment.serviceType?.category === module.key);

              return (
                <div key={module.key} className="p-4 space-y-3">
                  <div className={`chip ${colorForCategory(module.key)} font-semibold`}>{module.title}</div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Latest appointment</div>
                      <div className="text-slate-900 font-medium">{latestAppointment ? `${latestAppointment.patient.lastName}, ${latestAppointment.patient.firstName}` : "None"}</div>
                      <div className="text-xs text-slate-500">{latestAppointment ? fmtDateTime(latestAppointment.startsAt) : "No future visit queued"}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Latest encounter</div>
                      <div className="text-slate-900 font-medium">{latestEncounter ? `${latestEncounter.patient.lastName}, ${latestEncounter.patient.firstName}` : "None"}</div>
                      <div className="text-xs text-slate-500">{latestEncounter?.chiefComplaint || latestEncounter?.status || "No note available"}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-white ring-1 ring-slate-200 p-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="text-lg font-bold text-slate-900">{value}</div>
    </div>
  );
}