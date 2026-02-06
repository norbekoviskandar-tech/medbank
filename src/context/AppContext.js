"use client";

import { createContext, useEffect, useState } from "react";

export const AppContext = createContext();

export default function AppProvider({ children }) {
  const [theme, setTheme] = useState("light"); // Default to light

  useEffect(() => {
    // Initial theme setup
    const savedTheme = localStorage.getItem("medbank-theme");
    if (savedTheme) {
      queueMicrotask(() => setTheme(savedTheme));
    }
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem("medbank_cart");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        queueMicrotask(() => setCart(parsed));
      } catch (e) {
        console.error("Failed to parse cart JSON", e);
      }
    }
  }, []);

  const addToCart = (product) => {
    console.log('[Cart] Adding product to cart:', product);
    setCart(prev => {
      // Check if product already exists
      const existingItemIndex = prev.findIndex(item => item.id === product.id);
      
      let newCart;
      if (existingItemIndex >= 0) {
        // Increment quantity
        console.log('[Cart] Product exists, incrementing quantity');
        newCart = [...prev];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: (newCart[existingItemIndex].quantity || 1) + 1
        };
      } else {
        // Add new item with quantity 1
        // Store only serializable data
        const serializableProduct = {
          id: product.id,
          title: product.title,
          subtitle: product.subtitle,
          description: product.description,
          color: product.color,
          price: product.price,
          duration: product.duration,
          features: product.features,
          quantity: 1
        };
        console.log('[Cart] Adding new item:', serializableProduct);
        newCart = [...prev, serializableProduct];
      }
      
      console.log('[Cart] New cart state:', newCart);
      localStorage.setItem("medbank_cart", JSON.stringify(newCart));
      return newCart;
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.id !== productId);
      localStorage.setItem("medbank_cart", JSON.stringify(newCart));
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("medbank_cart");
    console.log('[Cart] Cart cleared');
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("medbank-theme", newTheme);
  };

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  const [selectedAuthorProduct, setSelectedAuthorProduct] = useState(null);

  useEffect(() => {
    // Persist selected author product
    const saved = localStorage.getItem("medbank_author_product_context");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        queueMicrotask(() => setSelectedAuthorProduct(parsed));
      } catch (e) {
        console.error("Failed to parse saved product context");
      }
    }
  }, []);

  const setGlobalAuthorProduct = (product) => {
    setSelectedAuthorProduct(product);
    if (product) {
      localStorage.setItem("medbank_author_product_context", JSON.stringify(product));
    } else {
      localStorage.removeItem("medbank_author_product_context");
    }
  };

  // --- Student Product Context ---
  const [selectedStudentProduct, setSelectedStudentProduct] = useState(null);
  const [availableStudentProducts, setAvailableStudentProducts] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("medbank_focused_product");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed !== 'default') queueMicrotask(() => setSelectedStudentProduct(parsed));
      } catch (e) {
        console.error("Failed to parse student product context");
      }
    }
  }, []);

  const setGlobalStudentProduct = (product) => {
    setSelectedStudentProduct(product);
    if (product) {
      localStorage.setItem("medbank_focused_product", JSON.stringify(product));
      // Trigger a custom event for legacy components still using listeners
      window.dispatchEvent(new Event("medbank_product_change"));
    } else {
      localStorage.removeItem("medbank_focused_product");
      window.dispatchEvent(new Event("medbank_product_change"));
    }
  };

  return (
    <AppContext.Provider value={{ 
      theme, toggleTheme, 
      sidebarCollapsed, setSidebarCollapsed, toggleSidebar,
      cart, setCart, isCartOpen, setIsCartOpen, addToCart, removeFromCart, clearCart,
      selectedAuthorProduct, setGlobalAuthorProduct,
      selectedStudentProduct, setSelectedStudentProduct, setGlobalStudentProduct,
      availableStudentProducts, setAvailableStudentProducts
    }}>
      {children}
    </AppContext.Provider>
  );
}
