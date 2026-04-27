"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthReturnPage() {
  const router = useRouter();
  const [isStandalone, setIsStandalone] = useState<boolean | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
    if (standalone) {
      router.replace("/");
    }
  }, [router]);

  if (isStandalone === null || isStandalone === true) {
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-black text-white">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div
          className="w-20 h-20 rounded-3xl bg-white text-black flex items-center justify-center text-4xl font-bold mx-auto"
          aria-hidden
        >
          C
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Du är inloggad!</h1>
          <p className="text-sm text-[#8a8a8a]">
            Öppna Carspotting från hemskärmen för att fortsätta.
          </p>
        </div>
        <div className="rounded-3xl bg-[#0d0d0d] border border-[#1f1f1f] p-5 text-sm text-[#8a8a8a] space-y-1">
          <p>Tryck på hemknappen →</p>
          <p>Sedan på Carspotting-ikonen.</p>
        </div>
      </div>
    </main>
  );
}
