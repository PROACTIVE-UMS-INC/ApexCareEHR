import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import PatientChart, { loadPatientCtx } from "@/components/PatientChart";
import { fmtDateTime } from "@/lib/utils";

export default async function PtDocs({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireSession();
  const ctx = await loadPatientCtx(id);
  const docs = await db.document.findMany({ where: { patientId: id }, orderBy: { createdAt: "desc" } });

  return (
    <PatientChart user={user} {...ctx} active="documents">
      <section className="card">
        <header className="px-4 py-3 border-b border-slate-200 font-semibold">Documents ({docs.length})</header>
        {docs.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No documents on file.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {docs.map(d => (
              <li key={d.id} className="p-4">
                <div className="font-medium">{d.title}</div>
                <div className="text-xs text-slate-500">{d.category || "—"} · {fmtDateTime(d.createdAt)}</div>
                {d.body && <div className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{d.body}</div>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </PatientChart>
  );
}
