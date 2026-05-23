import { requireSession, roleLabel } from "@/lib/auth";
import { db } from "@/lib/db";
import Shell from "@/components/Shell";
import JellyBeans from "@/components/JellyBeans";
import { readAdminConfig } from "@/lib/admin/store";
import { CLINICAL_MODULES } from "@/lib/modules";

export default async function Settings() {
  const user = await requireSession();
  const adminConfig = await readAdminConfig();
  let staff: Array<{
    id: string;
    firstName: string;
    lastName: string;
    credential: string | null;
    role: string;
    specialty: string | null;
    npi: string | null;
    email: string;
  }> = [];
  let counts = [0, 0, 0, 0];
  let dataUnavailable = false;

  try {
    const result = await Promise.all([
      db.user.findMany({ where: { active: true }, orderBy: [{ role: "asc" }, { lastName: "asc" }] }),
      db.$transaction([
        db.patient.count(),
        db.encounter.count(),
        db.order.count(),
        db.appointment.count(),
      ]),
    ]);
    staff = result[0];
    counts = result[1] as number[];
  } catch {
    dataUnavailable = true;
  }
  return (
    <Shell user={user} pageTitle="Settings" jellyBeans={<JellyBeans />}>
      {dataUnavailable && (
        <div className="card card-pad mb-3 border-amber-200 bg-amber-50 text-amber-900">
          Settings data is temporarily unavailable. Showing fallback totals.
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="card lg:col-span-2">
          <header className="px-4 py-3 border-b border-slate-200 font-semibold">Practice Staff</header>
          <table className="data">
            <thead><tr><th>Name</th><th>Role</th><th>Specialty</th><th>NPI</th><th>Email</th></tr></thead>
            <tbody>
              {staff.map(u => (
                <tr key={u.id}>
                  <td className="font-medium">{u.firstName} {u.lastName}{u.credential ? `, ${u.credential}` : ""}</td>
                  <td>{roleLabel(u.role as any)}</td>
                  <td>{u.specialty || "—"}</td>
                  <td className="font-mono text-xs">{u.npi || "—"}</td>
                  <td className="text-xs">{u.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card card-pad space-y-3">
          <h2 className="font-semibold">Practice Info</h2>
          <div className="text-sm text-slate-700">
            <div className="font-bold">ApexCare Health</div>
            <div className="text-xs text-slate-500">Hybrid clinic — primary care, PT, wound care, aesthetics.</div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Stat label="Patients" value={counts[0]} />
            <Stat label="Encounters" value={counts[1]} />
            <Stat label="Orders" value={counts[2]} />
            <Stat label="Appointments" value={counts[3]} />
          </div>
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
            Demo build · Not for clinical use · No PHI.
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <section className="card card-pad space-y-3">
          <h2 className="font-semibold text-slate-900">Module Activation Status</h2>
          <div className="space-y-2">
            {CLINICAL_MODULES.map((module) => {
              const config = adminConfig.modules.modules[module.key];
              return (
                <div key={module.key} className="rounded-md bg-slate-50 ring-1 ring-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-slate-900">{module.title}</div>
                    <span className={`chip ${config.enabled ? "bg-emerald-100 text-emerald-800 ring-emerald-200" : "bg-rose-100 text-rose-800 ring-rose-200"}`}>
                      {config.enabled ? "active" : "inactive"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={`chip ${config.allowScheduling ? "bg-blue-100 text-blue-800 ring-blue-200" : "bg-slate-100 text-slate-600 ring-slate-200"}`}>Scheduling</span>
                    <span className={`chip ${config.allowEncounters ? "bg-blue-100 text-blue-800 ring-blue-200" : "bg-slate-100 text-slate-600 ring-slate-200"}`}>Encounters</span>
                    <span className={`chip ${config.allowOrders ? "bg-blue-100 text-blue-800 ring-blue-200" : "bg-slate-100 text-slate-600 ring-slate-200"}`}>Orders</span>
                    <span className={`chip ${config.allowBilling ? "bg-blue-100 text-blue-800 ring-blue-200" : "bg-slate-100 text-slate-600 ring-slate-200"}`}>Billing</span>
                    <span className={`chip ${config.allowTelehealth ? "bg-violet-100 text-violet-800 ring-violet-200" : "bg-slate-100 text-slate-600 ring-slate-200"}`}>Telehealth</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Default visit {config.defaultVisitLengthMinutes} min · Max daily visits {config.maxDailyVisits}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card card-pad space-y-3">
          <h2 className="font-semibold text-slate-900">Integrations and Automation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <IntegrationBadge label="Labcorp outbound" enabled={adminConfig.modules.integrations.labcorpOutbound} />
            <IntegrationBadge label="Availity eligibility" enabled={adminConfig.modules.integrations.availityEligibility} />
            <IntegrationBadge label="Superbill automation" enabled={adminConfig.modules.integrations.superbillAutomation} />
            <IntegrationBadge label="Google Meet telehealth" enabled={adminConfig.modules.integrations.googleMeetTelehealth} />
            <IntegrationBadge label="Claim scrubber" enabled={adminConfig.modules.integrations.claimScrubber} />
            <IntegrationBadge label="Prior auth tracking" enabled={adminConfig.modules.integrations.priorAuthTracking} />
          </div>
          <div className="rounded-md bg-brand-50 ring-1 ring-brand-100 p-3 text-xs text-brand-800">
            These controls are managed in Admin Operational Settings and are now active throughout modules and orders.
          </div>
        </section>
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-50 ring-1 ring-slate-200 p-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="text-lg font-bold text-slate-900">{value}</div>
    </div>
  );
}

function IntegrationBadge({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className={`rounded-md ring-1 p-2 ${enabled ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-slate-50 text-slate-600 ring-slate-200"}`}>
      <div className="text-[11px] uppercase tracking-wider font-semibold">{label}</div>
      <div className="text-xs mt-1">{enabled ? "Enabled" : "Disabled"}</div>
    </div>
  );
}
