"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SessionUser, roleLabel } from "@/lib/auth-types";
import { initials } from "@/lib/utils";
import GlobalSearch from "./GlobalSearch";
import LogoutButton from "./LogoutButton";
import TopUtilityBar from "./TopUtilityBar";
import { CLINICAL_MODULES } from "@/lib/modules";

export default function Shell({
  user,
  children,
  pageTitle,
  jellyBeans,
  patientHeader,
}: {
  user: SessionUser;
  children: React.ReactNode;
  pageTitle?: string;
  jellyBeans?: React.ReactNode;
  patientHeader?: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const NAV: { label: string; href: string; icon: React.ReactNode; children?: Array<{ label: string; href: string }> }[] = [
    { label: "Dashboard", href: "/dashboard", icon: <Icon.Home /> },
    { label: "Schedule", href: "/schedule", icon: <Icon.Calendar /> },
    { label: "Patients", href: "/patients", icon: <Icon.Users /> },
    { label: "Encounters", href: "/encounters", icon: <Icon.Clipboard /> },
    { label: "Orders", href: "/orders", icon: <Icon.Beaker /> },
    { label: "Billing", href: "/billing", icon: <Icon.Dollar /> },
    { label: "Messages", href: "/messages", icon: <Icon.Mail /> },
    {
      label: "Modules",
      href: "/modules",
      icon: <Icon.Stethoscope />,
      children: [
        { label: "Module Hub", href: "/modules" },
        ...CLINICAL_MODULES.map((module) => ({ label: module.sidebarLabel, href: `/modules/${module.slug}` })),
      ],
    },
    { label: "Services", href: "/services", icon: <Icon.Sparkle /> },
    { label: "Settings", href: "/settings", icon: <Icon.Cog /> },
  ];
  if (user.role === "admin") {
    NAV.splice(9, 0, { label: "Admin", href: "/admin", icon: <Icon.Shield /> });
  }

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-30">
        <TopUtilityBar
          firstName={user.firstName}
          lastName={user.lastName}
          credential={user.credential}
          roleLabel={roleLabel(user.role)}
        />
        {/* TOP HEADER */}
        <header className="h-[var(--header-h)] bg-white/95 backdrop-blur border-b border-teal-100 flex items-center px-3 sm:px-4 gap-2 sm:gap-3">
          {/* MOBILE MENU TOGGLE */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-md hover:bg-slate-100 text-slate-700"
            title="Toggle menu"
          >
            {mobileMenuOpen ? <Icon.X /> : <Icon.Menu />}
          </button>

          <Link href="/dashboard" className="flex items-center mr-0 sm:mr-2" title="ApexCare EHR">
            <img
              src="/logoehr.png"
              alt="ApexCare EHR"
              className="h-10 w-auto max-w-[180px] sm:max-w-[260px] object-contain"
              loading="lazy"
            />
          </Link>

          <div className="flex-1 hidden sm:block max-w-2xl">
            <GlobalSearch />
          </div>

          <div className="hidden lg:flex items-center gap-1.5">{jellyBeans}</div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link href="/messages" className="relative h-9 w-9 rounded-full hover:bg-slate-100 grid place-items-center text-slate-500" title="Messages">
              <Icon.Mail />
            </Link>
            <Link href="/dashboard?view=tasks" className="h-9 w-9 rounded-full hover:bg-slate-100 grid place-items-center text-slate-500" title="Tasks">
              <Icon.Bell />
            </Link>
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
              <div className="h-8 w-8 rounded-full bg-brand-600 grid place-items-center text-white text-xs font-semibold">
                {initials(user.firstName, user.lastName)}
              </div>
              <div className="hidden sm:block leading-tight">
                <div className="text-xs font-semibold text-slate-900">{user.firstName} {user.lastName}{user.credential ? `, ${user.credential}` : ""}</div>
                <div className="text-[10px] text-slate-500">{roleLabel(user.role)}</div>
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>
      </div>

      <div className="flex flex-1 relative">
        {/* MOBILE MENU OVERLAY */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 md:hidden z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* SIDEBAR - DESKTOP */}
        <aside className="w-[var(--sidebar-w)] shrink-0 bg-gradient-to-b from-[var(--navy-900)] to-[var(--navy-800)] border-r border-sky-900/50 sticky top-[var(--chrome-h)] h-[calc(100vh-var(--chrome-h))] hidden md:flex flex-col">
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto no-scrollbar">
            {NAV.map(item => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition ${active ? "bg-teal-400/20 text-white" : "text-slate-100 hover:bg-teal-400/20 hover:text-white"}`}
                  >
                    <span className="text-slate-300">{item.icon}</span>
                    {item.label}
                  </Link>
                  {item.children && active && (
                    <div className="ml-8 mt-1 mb-1 space-y-0.5 border-l border-sky-800/60 pl-2">
                      {item.children.map((child) => {
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`block rounded-md px-2 py-1 text-xs transition ${childActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          <div className="p-3 border-t border-sky-900/50">
            <a
              href="https://www.proactivemtech.com"
              target="_blank"
              rel="noreferrer"
              className="group block rounded-md p-0 bg-white/5 ring-1 ring-white/10 hover:bg-white/10 hover:ring-teal-300/40 transition overflow-hidden"
              title="Powered by ProActive UMS"
            >
              <div className="px-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-100/90 group-hover:text-white">
                Powered By
              </div>
              <div className="px-1 pb-2">
                <img
                  src="/powered-by-proactiveums-attached.png"
                  alt="ProActive UMS Unified MedTech Systems"
                  className="mt-1 block w-full h-auto object-contain object-center"
                  loading="lazy"
                />
              </div>
            </a>
          </div>
        </aside>

        {/* SIDEBAR - MOBILE DRAWER */}
        <aside
          className={`fixed md:hidden inset-y-[var(--chrome-h)] left-0 w-[232px] bg-gradient-to-b from-[var(--navy-900)] to-[var(--navy-800)] border-r border-sky-900/50 flex flex-col transition-transform duration-200 z-40 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto no-scrollbar">
            {NAV.map(item => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition ${active ? "bg-teal-400/20 text-white" : "text-slate-100 hover:bg-teal-400/20 hover:text-white"}`}
                  >
                    <span className="text-slate-300">{item.icon}</span>
                    {item.label}
                  </Link>
                  {item.children && active && (
                    <div className="ml-8 mt-1 mb-1 space-y-0.5 border-l border-sky-800/60 pl-2">
                      {item.children.map((child) => {
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={closeMobileMenu}
                            className={`block rounded-md px-2 py-1 text-xs transition ${childActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          <div className="p-3 border-t border-sky-900/50">
            <a
              href="https://www.proactivemtech.com"
              target="_blank"
              rel="noreferrer"
              className="group block rounded-md p-0 bg-white/5 ring-1 ring-white/10 hover:bg-white/10 hover:ring-teal-300/40 transition overflow-hidden"
              title="Powered by ProActive UMS"
            >
              <div className="px-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-100/90 group-hover:text-white">
                Powered By
              </div>
              <div className="px-1 pb-2">
                <img
                  src="/powered-by-proactiveums-attached.png"
                  alt="ProActive UMS Unified MedTech Systems"
                  className="mt-1 block w-full h-auto object-contain object-center"
                  loading="lazy"
                />
              </div>
            </a>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 min-w-0 bg-gradient-to-b from-[var(--teal-100)]/35 via-white to-white overflow-x-hidden">
          {patientHeader}
          {pageTitle && (
            <div className="px-3 sm:px-6 pt-5 pb-2 flex items-center gap-3">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">{pageTitle}</h1>
            </div>
          )}
          <div className="p-3 sm:p-6 sm:pt-3">{children}</div>
        </main>
      </div>
    </div>
  );
}

const Icon = {
  Home: () => svgPath("M3 11.5L12 4l9 7.5M5 10v10h14V10"),
  Calendar: () => svgPath("M4 6h16M4 6v14h16V6M4 6V4m16 2V4M8 2v4m8-4v4"),
  Users: () => svgPath("M16 14a4 4 0 10-8 0M3 20c0-3 3-5 9-5s9 2 9 5"),
  Clipboard: () => svgPath("M9 4h6v3H9zM6 7h12v14H6zM9 12h6M9 16h6"),
  Beaker: () => svgPath("M9 3v6L4 19a2 2 0 002 3h12a2 2 0 002-3l-5-10V3M9 3h6"),
  Dollar: () => svgPath("M12 3v18M17 7H9.5a2.5 2.5 0 000 5h5a2.5 2.5 0 010 5H7"),
  Mail: () => svgPath("M3 7l9 6 9-6M3 7v10h18V7M3 7l9-4 9 4"),
  Stethoscope: () => svgPath("M6 3v6a6 6 0 0012 0V3M6 9l-2 2a4 4 0 000 6 4 4 0 006 0l2-2M18 9l2 2a4 4 0 010 6 4 4 0 01-6 0l-2-2M12 15v6"),
  Sparkle: () => svgPath("M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5zM18 15l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"),
  Cog: () => svgPath("M12 8a4 4 0 100 8 4 4 0 000-8zM4 12h2M18 12h2M12 4v2M12 18v2M6 6l1.5 1.5M16.5 16.5L18 18M6 18l1.5-1.5M16.5 7.5L18 6"),
  Shield: () => svgPath("M12 3l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3zM9 12l2 2 4-4"),
  Bell: () => svgPath("M6 16V11a6 6 0 1112 0v5l1 2H5l1-2zM10 21a2 2 0 004 0"),
  Menu: () => svgPath("M3 6h18M3 12h18M3 18h18"),
  X: () => svgPath("M18 6L6 18M6 6l12 12"),
};

function svgPath(d: string) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
