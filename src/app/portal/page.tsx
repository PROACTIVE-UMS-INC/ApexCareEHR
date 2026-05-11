import { redirect } from "next/navigation";
import { getPortalSession } from "@/lib/portalAuth";

export default async function PortalIndexPage() {
  const session = await getPortalSession();
  if (session) redirect("/portal/dashboard");
  redirect("/portal/login");
}
