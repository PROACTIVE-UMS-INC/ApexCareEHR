import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  if (session) redirect(sp.next || "/dashboard");

  return (
    <main className="min-h-screen grid place-items-center bg-gradient-to-br from-brand-50 via-white to-emerald-50 p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="h-10 w-10 rounded-xl bg-brand-600 grid place-items-center text-white font-bold text-lg sm:text-xl">A</div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">ApexCare EHR</div>
            <div className="text-xs text-slate-500 leading-tight">Electronic Health Records</div>
          </div>
        </div>
        <div className="card card-pad space-y-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Sign in</h1>
            <p className="text-xs sm:text-sm text-slate-500">Use your provider credentials.</p>
          </div>
          <LoginForm next={sp.next} />
          <div className="rounded-md bg-slate-50 ring-1 ring-slate-200 p-3 text-xs text-slate-600 space-y-2">
            <div className="font-semibold text-slate-700">Demo accounts (password: <span className="font-mono">apex123</span>)</div>
            <ul className="space-y-0.5 text-[11px] sm:text-xs leading-tight">
              <li><span className="font-mono">mariuska.aristica@apexcare.health</span> — provider (MD)</li>
              <li><span className="font-mono">np.tan@apexcare.health</span> — provider (NP)</li>
              <li><span className="font-mono">dpt.jones@apexcare.health</span> — provider (DPT, PT)</li>
              <li><span className="font-mono">nurse.kim@apexcare.health</span> — nurse</li>
              <li><span className="font-mono">front.lopez@apexcare.health</span> — front desk</li>
              <li><span className="font-mono">admin@apexcare.health</span> — admin</li>
            </ul>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">© ApexCare Health, Inc. — Demo build, not for clinical use.</p>
      </div>
    </main>
  );
}
