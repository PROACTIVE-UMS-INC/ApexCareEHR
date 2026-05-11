import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Shell from "@/components/Shell";
import JellyBeans from "@/components/JellyBeans";
import { fmtDateTime, fmtMoney } from "@/lib/utils";

export default async function BillingPage() {
  const user = await requireSession();
  const enc = await db.encounter.findMany({
    where: { charges: { some: {} } },
    include: { patient: true, provider: true, charges: true, diagnoses: true },
    orderBy: { startedAt: "desc" },
    take: 200,
  });

  const grand = enc.flatMap(e => e.charges).reduce((s, c) => s + c.feeCents * c.units, 0);
  const signedTotal = enc.filter(e => e.status === "signed").flatMap(e => e.charges).reduce((s, c) => s + c.feeCents * c.units, 0);
  const draftTotal = enc.filter(e => e.status !== "signed").flatMap(e => e.charges).reduce((s, c) => s + c.feeCents * c.units, 0);

  return (
    <Shell user={user} pageTitle="Billing" jellyBeans={<JellyBeans />}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Stat label="Total billed" value={fmtMoney(grand)} accent="brand" />
        <Stat label="Ready to submit (signed)" value={fmtMoney(signedTotal)} accent="emerald" />
        <Stat label="Draft / unsigned" value={fmtMoney(draftTotal)} accent="amber" />
      </div>
      <div className="card">
        <header className="px-4 py-3 border-b border-slate-200 font-semibold">Encounters with charges</header>
        <table className="data">
          <thead><tr><th>Date</th><th>Patient</th><th>Provider</th><th>Dx</th><th>CPT</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {enc.map(e => {
              const total = e.charges.reduce((s, c) => s + c.feeCents * c.units, 0);
              return (
                <tr key={e.id}>
                  <td className="text-xs">{fmtDateTime(e.startedAt)}</td>
                  <td><Link href={`/patients/${e.patientId}`} className="text-brand-700 hover:underline">{e.patient.lastName}, {e.patient.firstName}</Link></td>
                  <td className="text-xs">{e.provider.firstName} {e.provider.lastName}</td>
                  <td className="text-xs">{e.diagnoses.map(d => d.icd10).join(", ") || "—"}</td>
                  <td className="text-xs">{e.charges.map(c => c.cpt).join(", ")}</td>
                  <td className="font-semibold">{fmtMoney(total)}</td>
                  <td><span className={`chip ${e.status === "signed" ? "bg-emerald-100 text-emerald-800 ring-emerald-200" : "bg-amber-100 text-amber-800 ring-amber-200"}`}>{e.status}</span></td>
                </tr>
              );
            })}
            {enc.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-10">No charges yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: "brand" | "emerald" | "amber" }) {
  const grad = { brand: "from-brand-100", emerald: "from-emerald-100", amber: "from-amber-100" }[accent];
  return (
    <div className={`card card-pad bg-gradient-to-br ${grad} to-white`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
