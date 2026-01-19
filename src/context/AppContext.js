"use client";

import { createContext, useEffect, useState } from "react";
import { getAllUsers } from "@/services/user.service";
import { registerUser } from "@/auth/auth.logic";

export const AppContext = createContext();

export default function AppProvider({ children }) {
  const [theme, setTheme] = useState("dark"); // Default to dark for high-end look

  useEffect(() => {
    // Initial theme setup
    const savedTheme = localStorage.getItem("medbank-theme");
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      document.documentElement.classList.add("dark");
    }

    async function init() {
      const users = await getAllUsers();

      if (users.length === 0) {
        await registerUser("Admin", "admin@medbank.local", "admin123", "admin");
        await registerUser("Student", "student@medbank.local", "student123", "student");
        console.log("Demo users created");
      }
    }
    init();
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem("medbank_cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const addToCart = (product) => {
    setCart(prev => {
      // Prevent duplicates since we only have one product for now
      if (prev.find(item => item.id === product.id)) return prev;
      
      // Store only serializable data (exclude React elements like icon)
      const serializableProduct = {
        id: product.id,
        title: product.title,
        subtitle: product.subtitle,
        description: product.description,
        color: product.color,
        features: product.features
      };
      
      const newCart = [...prev, serializableProduct];
      localStorage.setItem("medbank_cart", JSON.stringify(newCart));
      return newCart;
    });
    // Don't auto-open cart - just show count badge
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.id !== productId);
      localStorage.setItem("medbank_cart", JSON.stringify(newCart));
      return newCart;
    });
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("medbank-theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  return (
    <AppContext.Provider value={{ 
      theme, toggleTheme, 
      sidebarCollapsed, setSidebarCollapsed, toggleSidebar,
      cart, setCart, isCartOpen, setIsCartOpen, addToCart, removeFromCart
    }}>
      {children}
    </AppContext.Provider>
  );
}
