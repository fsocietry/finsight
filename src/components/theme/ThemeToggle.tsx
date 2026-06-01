"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Aktifkan tema terang" : "Aktifkan tema gelap"}
      title={isDark ? "Tema terang" : "Tema gelap"}
      className={cn("btn-icon h-9 w-9", className)}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
