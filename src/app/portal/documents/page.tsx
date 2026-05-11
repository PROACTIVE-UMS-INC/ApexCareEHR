import PortalShell from "@/components/portal/PortalShell";
import { db } from "@/lib/db";
import { requirePortalSession } from "@/lib/portalAuth";

export default async function PortalDocumentsPage() {
  const session = await requirePortalSession();
  const docs = await db.document.findMany({
    where: { patientId: session.patientId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PortalShell session={session} active="/portal/documents">
      <section className="card">
        <header className="px-4 py-3 border-b border-slate-200 font-semibold">Clinical Documents</header>
        <table className="data">
          <thead>
            <tr><th>Title</th><th>Category</th><th>Date</th><th>Content</th></tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.id}>
                <td className="font-medium">{doc.title}</td>
                <td>{doc.category || "document"}</td>
                <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                <td className="text-xs max-w-[420px] truncate">{doc.body || "No attached text"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </PortalShell>
  );
}
