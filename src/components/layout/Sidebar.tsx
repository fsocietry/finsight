"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, BarChart3, MessageSquareText, Smartphone, LogOut, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/theme/ThemeToggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/analytics", label: "Analitik", icon: BarChart3 },
  { href: "/chat", label: "AI Chat", icon: MessageSquareText },
  { href: "/whatsapp", label: "WhatsApp", icon: Smartphone },
];

export default function Sidebar({
  open = false,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside
      className={cn(
        "glass fixed inset-y-3 left-3 z-40 flex w-60 flex-col rounded-3xl transition-transform duration-300",
        // Desktop: always visible. Mobile: slide in/out as a drawer.
        "lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-[110%]"
      )}
    >
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">FinSight</h1>
            <p className="text-xs text-ink/45">Smart Finance Tracker</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={onClose}
          className="btn-icon h-8 w-8 lg:hidden"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
              pathname === href
                ? "bg-ink/12 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                : "text-ink/55 hover:bg-ink/8 hover:text-ink"
            )}
          >
            <Icon size={19} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-ink/10 p-4">
        {session?.user && (
          <div className="mb-3 flex items-center gap-3">
            {session.user.image ? (
              <img src={session.user.image} alt="" className="h-9 w-9 rounded-full" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/10 text-sm font-medium">
                {session.user.name?.[0] || "U"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{session.user.name}</p>
              <p className="truncate text-xs text-ink/45">{session.user.email}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex flex-1 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm text-ink/60 transition-colors hover:bg-ink/10 hover:text-ink"
          >
            <LogOut size={18} />
            Keluar
          </button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
