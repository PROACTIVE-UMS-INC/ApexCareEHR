import Shell from "@/components/Shell";
import AdminTabs from "@/components/admin/AdminTabs";
import { requireAdminSession } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { readAdminConfig } from "@/lib/admin/store";

export default async function AdminOverviewPage() {
  const user = await requireAdminSession();
  const config = await readAdminConfig();

  let users = 0;
  let activePatients = 0;
  let encounters = 0;
  let appointments = 0;
  let openOrders = 0;
  let dataUnavailable = false;

  try {
    [users, activePatients, encounters, appointments, openOrders] = await Promise.all([
      db.user.count(),
      db.patient.count({ where: { status: "active" } }),
      db.encounter.count(),
      db.appointment.count(),
      db.order.count({ where: { status: "pending" } }),
    ]);
  } catch {
    dataUnavailable = true;
  }

  return (
    <Shell user={user} pageTitle="Admin Console">
      <div className="space-y-4">
        {dataUnavailable && (
          <div className="card card-pad border-amber-200 bg-amber-50 text-amber-900">
            Admin metrics are temporarily unavailable.
          </div>
        )}
        <AdminTabs active="/admin" />
        <section className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Stat label="Staff Users" value={users} />
          <Stat label="Active Patients" value={activePatients} />
          <Stat label="Encounters" value={encounters} />
          <Stat label="Appointments" value={appointments} />
          <Stat label="Open Orders" value={openOrders} />
        </section>
        <section className="card card-pad grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="font-semibold">Brand Status</h2>
            <p className="text-sm text-slate-600 mt-2">App name: {config.branding.appName}</p>
            <p className="text-sm text-slate-600">Support: {config.branding.supportEmail}</p>
            <p className="text-sm text-slate-600">Portal enabled: {config.portal.portalEnabled ? "Yes" : "No"}</p>
          </div>
          <div>
            <h2 className="font-semibold">Compliance Snapshot</h2>
            <p className="text-sm text-slate-600 mt-2">MFA for admins: {config.security.mfaRequiredForAdmins ? "Required" : "Optional"}</p>
            <p className="text-sm text-slate-600">Session timeout: {config.security.sessionTimeoutMinutes} minutes</p>
            <p className="text-sm text-slate-600">Audit retention: {config.security.auditRetentionDays} days</p>
          </div>
        </section>
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card card-pad">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
