"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BarChart3, Bot, FileText } from "lucide-react";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/theme/ThemeToggle";

const FEATURES = [
  { label: "Lacak Transaksi", icon: BarChart3 },
  { label: "Analisis AI", icon: Bot },
  { label: "Laporan Detail", icon: FileText },
];

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-4">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex">
            <Logo size={64} />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-ink">FinSight</h1>
          <p className="mt-2 text-ink/55">Kelola keuangan lebih cerdas dengan AI</p>
        </div>

        <div className="glass rounded-3xl p-8">
          <h2 className="mb-2 text-xl font-semibold text-ink">Selamat datang</h2>
          <p className="mb-8 text-sm text-ink/50">
            Masuk untuk mulai melacak dan menganalisis keuangan pribadi Anda.
          </p>

          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 font-medium text-gray-800 transition-transform hover:bg-gray-50 active:scale-[0.98]"
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Masuk dengan Google
          </button>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="rounded-2xl border border-ink/8 bg-ink/5 px-2 py-3">
                  <Icon className="mx-auto mb-2 text-ink/70" size={20} />
                  <p className="text-xs text-ink/55">{f.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
