"use client";

import { useRouter, usePathname } from "next/navigation";

export default function JuristenLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/juristen/login";

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/juristen/login");
  };

  if (isLogin) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: "#2d7a4f" }}>
            Z
          </div>
          <span className="font-semibold text-gray-900 text-sm">ZekerbijOntslag</span>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-500">Juristen portaal</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-800 transition"
        >
          Uitloggen
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
