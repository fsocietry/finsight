"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";

export default function AppShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] flex-col lg:pl-64">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      {/* Mobile / tablet top bar with burger */}
      <header className="flex items-center gap-3 px-4 py-3 lg:hidden">
        <button
          type="button"
          aria-label="Buka menu"
          onClick={() => setOpen(true)}
          className="btn-icon h-10 w-10"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Logo size={30} />
          <span className="text-lg font-semibold tracking-tight">FinSight</span>
        </div>
        <ThemeToggle className="ml-auto" />
      </header>

      {/* Backdrop for the drawer */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <main className={cn("flex flex-1 flex-col", className)}>{children}</main>
    </div>
  );
}
