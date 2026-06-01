import AppShell from "@/components/layout/AppShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell className="p-4 sm:p-6 lg:p-8">{children}</AppShell>;
}
