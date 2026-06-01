import AppShell from "@/components/layout/AppShell";

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell className="p-4 sm:p-6 lg:p-8">{children}</AppShell>;
}
