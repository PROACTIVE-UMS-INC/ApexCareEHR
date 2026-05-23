import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Shell from "@/components/Shell";
import JellyBeans from "@/components/JellyBeans";
import { fmtDateTime } from "@/lib/utils";
import LabcorpRoutingControls from "@/components/orders/LabcorpRoutingControls";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ type?: string; status?: string }> }) {
  const sp = await searchParams;
  const user = await requireSession();
  let orders: Array<{
    id: string;
    type: string;
    patientId: string;
    itemName: string;
    rxStrength: string | null;
    rxSig: string | null;
    instructions: string | null;
    status: string;
    createdAt: Date;
    patient: { firstName: string; lastName: string };
    provider: { firstName: string; lastName: string };
  }> = [];
  let dataUnavailable = false;

  try {
    orders = await db.order.findMany({
      where: { ...(sp.type ? { type: sp.type } : {}), ...(sp.status ? { status: sp.status } : {}) },
      include: { patient: true, provider: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  } catch {
    dataUnavailable = true;
  }

  const pendingLabCount = orders.filter((order) => order.type === "lab" && order.status === "pending").length;
  const sentLabCount = orders.filter((order) => order.type === "lab" && order.status === "sent").length;

  return (
    <Shell user={user} pageTitle="Orders" jellyBeans={<JellyBeans />}>
      {dataUnavailable && (
        <div className="card card-pad mb-3 border-amber-200 bg-amber-50 text-amber-900">
          Orders data is temporarily unavailable. Try again in a moment.
        </div>
      )}
      {(sp.type === "lab" || !sp.type) && (
        <div className="card card-pad mb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">Lab module</div>
              <div className="font-semibold text-slate-900">Labcorp routing is enabled for outbound lab orders.</div>
              <div className="mt-1 text-xs text-slate-600">Outbound routing endpoint is active for all lab orders.</div>
            </div>
            <span className="chip bg-emerald-100 text-emerald-800 ring-emerald-200">Labcorp</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="chip bg-amber-100 text-amber-800 ring-amber-200">Pending: {pendingLabCount}</span>
            <span className="chip bg-emerald-100 text-emerald-800 ring-emerald-200">Sent: {sentLabCount}</span>
          </div>
          <LabcorpRoutingControls pendingLabCount={pendingLabCount} />
        </div>
      )}
      <div className="card">
        <header className="px-4 py-3 border-b border-slate-200 flex flex-wrap gap-2">
          <Link href="/orders" className={`chip ring-1 ring-inset ${!sp.type && !sp.status ? "bg-brand-100 text-brand-800 ring-brand-200" : "bg-slate-100 text-slate-700 ring-slate-200"}`}>All</Link>
          {["rx", "lab", "imaging", "referral", "procedure"].map(t => (
            <Link key={t} href={`/orders?type=${t}`} className={`chip ring-1 ring-inset ${sp.type === t ? "bg-brand-100 text-brand-800 ring-brand-200" : "bg-slate-100 text-slate-700 ring-slate-200"}`}>{t.toUpperCase()}</Link>
          ))}
          <Link href="/orders?status=pending" className={`chip ring-1 ring-inset ml-auto ${sp.status === "pending" ? "bg-amber-100 text-amber-800 ring-amber-200" : "bg-slate-100 text-slate-700 ring-slate-200"}`}>Pending</Link>
          <Link href="/orders?status=completed" className={`chip ring-1 ring-inset ${sp.status === "completed" ? "bg-emerald-100 text-emerald-800 ring-emerald-200" : "bg-slate-100 text-slate-700 ring-slate-200"}`}>Completed</Link>
        </header>
        <table className="data">
          <thead><tr><th>Type</th><th>Patient</th><th>Item</th><th>Sig / instructions</th><th>Provider</th><th>Status</th><th>Created</th></tr></thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-10">No orders.</td></tr>}
            {orders.map(o => (
              <tr key={o.id}>
                <td className="uppercase text-xs font-semibold text-slate-600">{o.type}</td>
                <td><Link href={`/patients/${o.patientId}`} className="text-brand-700 hover:underline">{o.patient.lastName}, {o.patient.firstName}</Link></td>
                <td className="font-medium">{o.itemName}{o.rxStrength ? ` ${o.rxStrength}` : ""}</td>
                <td className="text-xs text-slate-600 max-w-[260px] truncate">{o.rxSig || o.instructions || "—"}</td>
                <td className="text-xs">{o.provider.firstName} {o.provider.lastName}</td>
                <td><span className="chip bg-slate-100 text-slate-700 ring-slate-200">{o.status}</span></td>
                <td className="text-xs text-slate-500">{fmtDateTime(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
