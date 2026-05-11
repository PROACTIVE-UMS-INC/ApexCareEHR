import { redirect } from "next/navigation";
import PortalLoginForm from "@/components/portal/PortalLoginForm";
import { getPortalSession } from "@/lib/portalAuth";

export default async function PortalLoginPage() {
  const session = await getPortalSession();
  if (session) redirect("/portal/dashboard");

  return (
    <main className="min-h-screen grid place-items-center bg-gradient-to-br from-teal-50 via-white to-brand-50 p-4 sm:p-5">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">ApexCare Patient Portal</h1>
          <p className="text-sm text-slate-500 px-2">Secure access to your appointments, messages, and care documents.</p>
        </div>
        <section className="card card-pad">
          <PortalLoginForm />
        </section>
      </div>
    </main>
  );
}
