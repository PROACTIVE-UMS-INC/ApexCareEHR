import Shell from "@/components/Shell";
import AdminTabs from "@/components/admin/AdminTabs";
import AdminOpsSettings from "@/components/admin/AdminOpsSettings";
import { requireAdminSession } from "@/lib/admin/auth";
import { readAdminConfig } from "@/lib/admin/store";

export default async function AdminSettingsPage() {
  const user = await requireAdminSession();
  const config = await readAdminConfig();

  return (
    <Shell user={user} pageTitle="Admin · Operational Settings">
      <div className="space-y-4">
        <AdminTabs active="/admin/settings" />
        <AdminOpsSettings
          initialOrg={config.org}
          initialSecurity={config.security}
          initialPortal={config.portal}
        />
      </div>
    </Shell>
  );
}
