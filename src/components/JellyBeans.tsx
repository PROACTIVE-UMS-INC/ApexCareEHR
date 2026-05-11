import Link from "next/link";

export default function JellyBeans({ patientId }: { patientId?: string }) {
  return (
    <>
      <Link href="/schedule" className="jb jb-blue" title="Open schedule"><Dot/>Schedule</Link>
      <Link href={patientId ? `/patients/${patientId}/encounters/new` : "/encounters"} className="jb jb-green" title="New encounter"><Dot/>Encounter</Link>
      <Link href={patientId ? `/patients/${patientId}/orders/new?type=rx` : "/orders"} className="jb jb-violet" title="New Rx"><Dot/>Rx</Link>
      <Link href={patientId ? `/patients/${patientId}/orders/new?type=lab` : "/orders"} className="jb jb-amber" title="Lab order"><Dot/>Labs</Link>
      <Link href={patientId ? `/patients/${patientId}/orders/new?type=imaging` : "/orders"} className="jb jb-rose" title="Imaging"><Dot/>Imaging</Link>
      <Link href="/billing" className="jb jb-slate" title="Billing"><Dot/>Billing</Link>
    </>
  );
}

function Dot() {
  return <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />;
}
