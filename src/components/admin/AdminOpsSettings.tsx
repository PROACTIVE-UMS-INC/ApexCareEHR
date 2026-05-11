"use client";

import { useState } from "react";

type Org = {
  orgName: string;
  legalName: string;
  website: string;
  defaultTimezone: string;
  dateFormat: string;
  intakeMode: "digital-first" | "hybrid" | "in-person";
  allowSelfScheduling: boolean;
};

type Security = {
  mfaRequiredForAdmins: boolean;
  sessionTimeoutMinutes: number;
  passwordRotationDays: number;
  auditRetentionDays: number;
  bruteForceLockMinutes: number;
};

type Portal = {
  portalEnabled: boolean;
  allowDocumentDownload: boolean;
  allowDirectMessaging: boolean;
  allowOnlinePayments: boolean;
  showLabResultsAfterDays: number;
};

export default function AdminOpsSettings({ initialOrg, initialSecurity, initialPortal }: { initialOrg: Org; initialSecurity: Security; initialPortal: Portal }) {
  const [org, setOrg] = useState(initialOrg);
  const [security, setSecurity] = useState(initialSecurity);
  const [portal, setPortal] = useState(initialPortal);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function saveSection(section: "org" | "security" | "portal", data: unknown) {
    const res = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ section, data }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Could not save settings");
    return json.config;
  }

  async function saveAll() {
    setSaving(true);
    setMessage(null);
    try {
      const first = await saveSection("org", org);
      setOrg(first.org);
      const second = await saveSection("security", security);
      setSecurity(second.security);
      const third = await saveSection("portal", portal);
      setPortal(third.portal);
      setMessage("Operational settings saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="card card-pad space-y-3">
        <h2 className="font-semibold">Organization Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="input" placeholder="Organization name" value={org.orgName} onChange={(e) => setOrg((v) => ({ ...v, orgName: e.target.value }))} />
          <input className="input" placeholder="Legal name" value={org.legalName} onChange={(e) => setOrg((v) => ({ ...v, legalName: e.target.value }))} />
          <input className="input" placeholder="Website" value={org.website} onChange={(e) => setOrg((v) => ({ ...v, website: e.target.value }))} />
          <input className="input" placeholder="Timezone" value={org.defaultTimezone} onChange={(e) => setOrg((v) => ({ ...v, defaultTimezone: e.target.value }))} />
          <input className="input" placeholder="Date format" value={org.dateFormat} onChange={(e) => setOrg((v) => ({ ...v, dateFormat: e.target.value }))} />
          <select className="input" value={org.intakeMode} onChange={(e) => setOrg((v) => ({ ...v, intakeMode: e.target.value as Org["intakeMode"] }))}>
            <option value="digital-first">digital-first</option>
            <option value="hybrid">hybrid</option>
            <option value="in-person">in-person</option>
          </select>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={org.allowSelfScheduling} onChange={(e) => setOrg((v) => ({ ...v, allowSelfScheduling: e.target.checked }))} />
          Allow patient self-scheduling
        </label>
      </div>

      <div className="card card-pad space-y-3">
        <h2 className="font-semibold">Security and Compliance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-xs">Session timeout (minutes)
            <input type="number" className="input" value={security.sessionTimeoutMinutes} onChange={(e) => setSecurity((v) => ({ ...v, sessionTimeoutMinutes: Number(e.target.value || 0) }))} />
          </label>
          <label className="text-xs">Password rotation (days)
            <input type="number" className="input" value={security.passwordRotationDays} onChange={(e) => setSecurity((v) => ({ ...v, passwordRotationDays: Number(e.target.value || 0) }))} />
          </label>
          <label className="text-xs">Audit retention (days)
            <input type="number" className="input" value={security.auditRetentionDays} onChange={(e) => setSecurity((v) => ({ ...v, auditRetentionDays: Number(e.target.value || 0) }))} />
          </label>
          <label className="text-xs">Lockout window (minutes)
            <input type="number" className="input" value={security.bruteForceLockMinutes} onChange={(e) => setSecurity((v) => ({ ...v, bruteForceLockMinutes: Number(e.target.value || 0) }))} />
          </label>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={security.mfaRequiredForAdmins} onChange={(e) => setSecurity((v) => ({ ...v, mfaRequiredForAdmins: e.target.checked }))} />
          Require MFA for admin users
        </label>
      </div>

      <div className="card card-pad space-y-3">
        <h2 className="font-semibold">Patient Portal Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={portal.portalEnabled} onChange={(e) => setPortal((v) => ({ ...v, portalEnabled: e.target.checked }))} /> Portal enabled</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={portal.allowDocumentDownload} onChange={(e) => setPortal((v) => ({ ...v, allowDocumentDownload: e.target.checked }))} /> Allow downloads</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={portal.allowDirectMessaging} onChange={(e) => setPortal((v) => ({ ...v, allowDirectMessaging: e.target.checked }))} /> Allow messaging</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={portal.allowOnlinePayments} onChange={(e) => setPortal((v) => ({ ...v, allowOnlinePayments: e.target.checked }))} /> Allow online payments</label>
          <label className="text-xs">Lab release delay (days)
            <input type="number" className="input" value={portal.showLabResultsAfterDays} onChange={(e) => setPortal((v) => ({ ...v, showLabResultsAfterDays: Number(e.target.value || 0) }))} />
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button className="btn-primary" onClick={saveAll} disabled={saving}>{saving ? "Saving..." : "Save All Operational Settings"}</button>
      </div>
      {message && <p className="text-xs text-slate-600">{message}</p>}
    </section>
  );
}
