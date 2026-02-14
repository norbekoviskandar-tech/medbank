"use client";

import { useContext, useEffect } from "react";
import { AppContext } from "@/context/AppContext";

export default function ThemeWrapper({ children }) {
  const { theme } = useContext(AppContext);

  useEffect(() => {
    // Apply theme to html element directly for global scope
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    // Also set color-scheme for native elements
    root.style.colorScheme = theme;
  }, [theme]);

  return <>{children}</>;
}
