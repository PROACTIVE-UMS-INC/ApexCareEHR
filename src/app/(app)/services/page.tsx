import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Shell from "@/components/Shell";
import JellyBeans from "@/components/JellyBeans";
import { colorForCategory } from "@/lib/utils";

const CATEGORY_LABEL: Record<string, string> = {
  "physical-therapy": "Physical Rehabilitation",
  "wound-care": "Wound Care",
  "other-services": "Other Services",
  "aesthetic-medicine": "Aesthetic Medicine",
  "primary-care": "Primary Care",
};

const CATEGORY_DESC: Record<string, string> = {
  "physical-therapy": "Functional rehabilitation, pain management, and post-operative recovery plans.",
  "wound-care": "Chronic and acute wounds, infection prevention. Evaluation can be conducted at home.",
  "other-services": "Physical exams, laboratory, EKG, and weight management.",
  "aesthetic-medicine": "Botox, fillers, Endolift, laser rejuvenation, laser hair removal, Morpheus8, and PRP.",
  "primary-care": "Routine adult primary care visits.",
};

export default async function ServicesPage() {
  const user = await requireSession();
  const services = await db.serviceType.findMany({ where: { active: true }, orderBy: [{ category: "asc" }, { name: "asc" }] });
  const grouped: Record<string, typeof services> = {};
  for (const s of services) (grouped[s.category] ||= []).push(s);

  return (
    <Shell user={user} pageTitle="Service Catalog" jellyBeans={<JellyBeans />}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.keys(grouped).map(cat => (
          <section key={cat} className="card">
            <header className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
              <span className={`chip ${colorForCategory(cat)} font-semibold`}>{CATEGORY_LABEL[cat] || cat}</span>
              <p className="text-xs text-slate-500 truncate">{CATEGORY_DESC[cat]}</p>
            </header>
            <ul className="divide-y divide-slate-100">
              {grouped[cat].map(s => (
                <li key={s.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{s.name}</div>
                    {s.description && <div className="text-xs text-slate-500">{s.description}</div>}
                  </div>
                  <span className="chip bg-slate-100 text-slate-700 ring-slate-200">{s.durationMin} min</span>
                  {s.homeEligible && <span className="chip bg-emerald-100 text-emerald-800 ring-emerald-200">Home OK</span>}
                  {s.defaultCpt && <span className="chip bg-slate-100 text-slate-700 ring-slate-200 font-mono">{s.defaultCpt}</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Shell>
  );
}
