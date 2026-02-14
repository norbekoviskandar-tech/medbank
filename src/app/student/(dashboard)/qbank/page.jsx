"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QBankPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/student/qbank/create-test");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Loading QBank...</p>
    </div>
  );
}

