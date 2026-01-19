"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QBankPage() {
  const router = useRouter();

  useEffect(() => {
    // Check for last visited page in qbank section
    const lastPage = localStorage.getItem("medbank_last_qbank_view") || "/app/qbank/create-test";
    router.replace(lastPage);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#004e92] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-bold text-[#64748b] uppercase tracking-widest">Restoring Session...</p>
      </div>
    </div>
  );
}
