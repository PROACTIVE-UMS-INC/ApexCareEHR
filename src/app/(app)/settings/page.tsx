import { requireSession, roleLabel } from "@/lib/auth";
import { db } from "@/lib/db";
import Shell from "@/components/Shell";
import JellyBeans from "@/components/JellyBeans";

export default async function Settings() {
  const user = await requireSession();
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
