import PortalShell from "@/components/portal/PortalShell";
import { db } from "@/lib/db";
import { requirePortalSession } from "@/lib/portalAuth";

export default async function PortalProfilePage() {
  const session = await requirePortalSession();
  const patient = await db.patient.findUnique({ where: { id: session.patientId } });
  if (!patient) return null;

  return (
    <PortalShell session={session} active="/portal/profile">
      <section className="card card-pad">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Profile and Demographics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <Field label="Full name" value={`${patient.firstName} ${patient.lastName}`} />
          <Field label="DOB" value={new Date(patient.dob).toLocaleDateString()} />
          <Field label="MRN" value={patient.mrn} />
          <Field label="Sex" value={patient.sex} />
          <Field label="Email" value={patient.email || "-"} />
          <Field label="Phone" value={patient.phone || "-"} />
          <Field label="Address" value={[patient.addressLine1, patient.addressLine2, patient.city, patient.state, patient.postalCode].filter(Boolean).join(", ") || "-"} />
          <Field label="Language" value={patient.preferredLang || "-"} />
          <Field label="Insurance" value={[patient.insurerName, patient.insurerPlan].filter(Boolean).join(" / ") || "-"} />
          <Field label="Member ID" value={patient.memberId || "-"} />
          <Field label="Emergency Contact" value={patient.ecName || "-"} />
          <Field label="Emergency Phone" value={patient.ecPhone || "-"} />
        </div>
      </section>
    </PortalShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 ring-1 ring-slate-200 p-3">
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="text-slate-900 font-medium mt-1">{value}</div>
    </div>
  );
}
