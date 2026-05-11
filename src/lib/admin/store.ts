import fs from "node:fs/promises";
import path from "node:path";

export type StaffRole = "provider" | "nurse" | "frontdesk" | "billing" | "admin";

export type RolePermissionSet = {
  dashboard: boolean;
  scheduling: boolean;
  patientsRead: boolean;
  patientsWrite: boolean;
  encountersWrite: boolean;
  ordersWrite: boolean;
  billingRead: boolean;
  billingWrite: boolean;
  messaging: boolean;
  adminAccess: boolean;
};

export type BrandingConfig = {
  appName: string;
  slogan: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  supportEmail: string;
  supportPhone: string;
};

export type LandingConfig = {
  heroTitle: string;
  heroSubtitle: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  featureCards: Array<{ title: string; description: string }>;
};

export type OrgConfig = {
  orgName: string;
  legalName: string;
  website: string;
  defaultTimezone: string;
  dateFormat: string;
  intakeMode: "digital-first" | "hybrid" | "in-person";
  allowSelfScheduling: boolean;
};

export type SecurityConfig = {
  mfaRequiredForAdmins: boolean;
  sessionTimeoutMinutes: number;
  passwordRotationDays: number;
  auditRetentionDays: number;
  bruteForceLockMinutes: number;
};

export type PortalConfig = {
  portalEnabled: boolean;
  allowDocumentDownload: boolean;
  allowDirectMessaging: boolean;
  allowOnlinePayments: boolean;
  showLabResultsAfterDays: number;
};

export type AdminConfig = {
  branding: BrandingConfig;
  landing: LandingConfig;
  org: OrgConfig;
  security: SecurityConfig;
  portal: PortalConfig;
  roles: Record<StaffRole, RolePermissionSet>;
};

const DEFAULTS: AdminConfig = {
  branding: {
    appName: "ApexCare",
    slogan: "Connected care for clinic, home, and virtual visits",
    logoUrl: "/logoehr.png",
    primaryColor: "#0f8a85",
    secondaryColor: "#0b1e35",
    accentColor: "#14b8a6",
    supportEmail: "support@apexcare.health",
    supportPhone: "+1 (305) 555-0148",
  },
  landing: {
    heroTitle: "Modern Care, Human First.",
    heroSubtitle:
      "A complete care experience with integrated scheduling, messaging, documentation, and patient self-service.",
    ctaPrimaryLabel: "Patient Portal",
    ctaPrimaryHref: "/portal/login",
    ctaSecondaryLabel: "Staff Login",
    ctaSecondaryHref: "/login",
    featureCards: [
      { title: "Care Anywhere", description: "In-office, home, and telehealth workflows in one platform." },
      { title: "Live Clinical Ops", description: "Real-time dashboards for encounters, orders, and patient throughput." },
      { title: "Patient Self-Service", description: "Patients can view visits, documents, and send secure messages." },
    ],
  },
  org: {
    orgName: "ApexCare Health",
    legalName: "ApexCare Health Services, Inc.",
    website: "https://www.apexcare.health",
    defaultTimezone: "America/New_York",
    dateFormat: "MM/dd/yyyy",
    intakeMode: "hybrid",
    allowSelfScheduling: true,
  },
  security: {
    mfaRequiredForAdmins: true,
    sessionTimeoutMinutes: 60,
    passwordRotationDays: 90,
    auditRetentionDays: 365,
    bruteForceLockMinutes: 15,
  },
  portal: {
    portalEnabled: true,
    allowDocumentDownload: true,
    allowDirectMessaging: true,
    allowOnlinePayments: false,
    showLabResultsAfterDays: 2,
  },
  roles: {
    provider: {
      dashboard: true,
      scheduling: true,
      patientsRead: true,
      patientsWrite: true,
      encountersWrite: true,
      ordersWrite: true,
      billingRead: true,
      billingWrite: false,
      messaging: true,
      adminAccess: false,
    },
    nurse: {
      dashboard: true,
      scheduling: true,
      patientsRead: true,
      patientsWrite: true,
      encountersWrite: true,
      ordersWrite: false,
      billingRead: false,
      billingWrite: false,
      messaging: true,
      adminAccess: false,
    },
    frontdesk: {
      dashboard: true,
      scheduling: true,
      patientsRead: true,
      patientsWrite: true,
      encountersWrite: false,
      ordersWrite: false,
      billingRead: true,
      billingWrite: false,
      messaging: true,
      adminAccess: false,
    },
    billing: {
      dashboard: true,
      scheduling: false,
      patientsRead: true,
      patientsWrite: false,
      encountersWrite: false,
      ordersWrite: false,
      billingRead: true,
      billingWrite: true,
      messaging: true,
      adminAccess: false,
    },
    admin: {
      dashboard: true,
      scheduling: true,
      patientsRead: true,
      patientsWrite: true,
      encountersWrite: true,
      ordersWrite: true,
      billingRead: true,
      billingWrite: true,
      messaging: true,
      adminAccess: true,
    },
  },
};

const ADMIN_CONFIG_PATH = path.join(process.cwd(), "lfs", "tmp", "admin-console.json");

async function ensureConfigDir() {
  const dir = path.dirname(ADMIN_CONFIG_PATH);
  await fs.mkdir(dir, { recursive: true });
}

export async function readAdminConfig(): Promise<AdminConfig> {
  try {
    const raw = await fs.readFile(ADMIN_CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<AdminConfig>;
    return {
      ...DEFAULTS,
      ...parsed,
      branding: { ...DEFAULTS.branding, ...(parsed.branding ?? {}) },
      landing: { ...DEFAULTS.landing, ...(parsed.landing ?? {}) },
      org: { ...DEFAULTS.org, ...(parsed.org ?? {}) },
      security: { ...DEFAULTS.security, ...(parsed.security ?? {}) },
      portal: { ...DEFAULTS.portal, ...(parsed.portal ?? {}) },
      roles: {
        ...DEFAULTS.roles,
        ...(parsed.roles ?? {}),
      },
    };
  } catch {
    return DEFAULTS;
  }
}

export async function writeAdminConfig(nextConfig: AdminConfig): Promise<AdminConfig> {
  await ensureConfigDir();
  await fs.writeFile(ADMIN_CONFIG_PATH, JSON.stringify(nextConfig, null, 2), "utf8");
  return nextConfig;
}

export async function patchAdminConfig<K extends keyof AdminConfig>(section: K, value: AdminConfig[K]) {
  const current = await readAdminConfig();
  const next: AdminConfig = {
    ...current,
    [section]: value,
  };
  return await writeAdminConfig(next);
}
