"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductStreamHeader() {
  const router = useRouter();
  const [productName, setProductName] = useState("Loading Stream...");

  useEffect(() => {
    const updateProduct = () => {
      const stored = localStorage.getItem("medbank_focused_product");
      if (stored === 'default' || !stored) {
        setProductName("Standard QBank");
      } else {
        try {
          const p = JSON.parse(stored);
          setProductName(p.name || "Premium Stream");
        } catch (e) {
          setProductName("Standard QBank");
        }
      }
    };

    updateProduct();
    
    // Listen for both native storage events (other tabs) and custom events (current tab)
    window.addEventListener("storage", updateProduct);
    window.addEventListener("medbank_product_change", updateProduct);
    
    return () => {
      window.removeEventListener("storage", updateProduct);
      window.removeEventListener("medbank_product_change", updateProduct);
    };
  }, []);

  return (
    <div className="mb-10 flex flex-col gap-1 select-none">
      <div className="flex items-center gap-2 text-[11px] font-[1000] text-[#3b82f6] uppercase tracking-[0.4em] mb-1">
        <div className="w-2 h-2 rounded-full bg-[#3b82f6] shadow-[0_0_8px_#3b82f6] animate-pulse" />
        Stream_Active
      </div>
      <h1 className="text-5xl font-[1000] text-slate-900 dark:text-white italic uppercase tracking-tighter leading-none drop-shadow-sm">
        {productName}
      </h1>
    </div>
  );
}
