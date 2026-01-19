"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { AppContext } from "@/context/AppContext";
import CartDropdown from "@/components/layout/CartDropdown";
import { 
  ArrowRight, 
  ChevronRight, 
  Zap, 
  ShieldCheck, 
  Clock, 
  LayoutDashboard, 
  GraduationCap, 
  BookOpen,
  HeartPulse,
  Activity,
  CreditCard,
  UserPlus,
  ShoppingCart
} from "lucide-react";

export default function ProductsPage() {
  const router = useRouter();
  const { addToCart, cart, isCartOpen, setIsCartOpen } = useContext(AppContext);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("medbank_user");
    setIsLoggedIn(!!userId);
  }, []);

  const handleBuyNow = () => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
    } else {
      router.push("/checkout");
    }
  };

  const product = {
    id: "ecg-qbank",
    title: "ECG Qbank",
    subtitle: "Precision Electrocardiography",
    description: "Master the art of ECG interpretation with 2,000+ high-fidelity rhythm strips, complex case studies, and real-time wave analysis. Designed for medical students and cardiac specialists.",
    icon: <Activity className="text-white" size={24} />,
    color: "bg-rose-500",
    features: [
      "2,000+ Rhythm Strips",
      "Interactive Wave Analysis",
      "Dynamic Case Studies",
      "Step-by-Step Interpretations",
      "Real-time Performance Metrics"
    ]
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fcfdfe]">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
            <div className="flex items-center">
              <span className="text-2xl font-black text-[#1d46af] tracking-tight">Isky</span>
              <div className="relative ml-2 w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-[2.5px] border-[#1d46af]"></div>
                <div className="absolute inset-[3px] rounded-full border border-amber-400 opacity-80"></div>
                <div className="absolute top-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                <span className="text-[#1d46af] font-black text-[12px] tracking-tighter">MD</span>
              </div>
            </div>
          </div>
          
          <div className="hidden items-center gap-10 md:flex">
             <a href="/" className="text-sm font-bold text-slate-500 hover:text-[#1d46af] transition-colors">Home</a>
             <div className="relative">
               <button 
                 onClick={() => setIsCartOpen(!isCartOpen)} 
                 className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#1d46af] transition-colors relative"
               >
                 <div className="relative">
                   <ShoppingCart size={18} />
                   {cart.length > 0 && (
                     <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#1d46af] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                       {cart.length}
                     </span>
                   )}
                 </div>
                 Cart
               </button>
               <CartDropdown />
             </div>
             <div className="flex items-center">
              {isLoggedIn ? (
                <button 
                  onClick={() => router.push('/portal')}
                  className="rounded-full bg-[#1d46af] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-[#16368a] transition-all active:scale-95"
                >
                  My Portal
                </button>
              ) : (
                <a href="/auth" className="rounded-full bg-[#1d46af] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-[#16368a] transition-all active:scale-95">
                  Sign In
                </a>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-32 pb-24 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-20 text-center">
            <h1 className="text-5xl font-[1000] text-slate-900 tracking-tighter mb-4">Precision Mastery.</h1>
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
              Unlock the next generation of medical training. Our ECG Qbank is engineered for clinical excellence.
            </p>
          </div>

          <div className="group relative flex flex-col md:flex-row items-center gap-12 rounded-[3.5rem] bg-white border border-slate-100 p-12 shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="flex-1">
              <div className={`mb-8 flex h-16 w-16 items-center justify-center rounded-2xl ${product.color} shadow-lg shadow-rose-500/20`}>
                {product.icon}
              </div>
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{product.subtitle}</div>
              <h3 className="mb-4 text-4xl font-black text-slate-900 tracking-tight leading-tight">{product.title}</h3>
              <p className="mb-8 text-slate-500 font-medium text-lg leading-relaxed italic">
                {product.description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                      <ChevronRight size={12} strokeWidth={3} />
                    </div>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full md:w-80 flex flex-col gap-6">
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <div className="mb-6">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Enrollment</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">$199</span>
                    <span className="text-sm font-bold text-slate-400">/ 90 days</span>
                  </div>
                </div>
                <button 
                  onClick={handleBuyNow}
                  className="w-full py-4 bg-blue-50 text-[#1d46af] border-2 border-[#1d46af]/30 text-lg font-black rounded-2xl hover:bg-blue-100 transition-all active:scale-95 flex items-center justify-center gap-3 mb-3"
                >
                  <CreditCard size={20} />
                  BUY NOW
                </button>
                <button 
                  onClick={() => addToCart(product)}
                  className="w-full py-3 bg-white text-slate-500 border-2 border-slate-100 text-sm font-black rounded-xl hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={18} />
                  ADD TO CART
                </button>
              </div>
              <p className="text-center text-xs font-bold text-slate-400 px-4">
                Instantly unlock access to the complete ECG curriculum upon payment activation.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 mx-auto border border-blue-100 text-[#1d46af]">
              <UserPlus size={32} />
            </div>
            <h3 className="text-2xl font-[1000] text-slate-900 mb-2 tracking-tight">Create an Account</h3>
            <p className="text-slate-500 font-medium mb-8">
              To purchase the ECG Qbank and track your progress, you first need to create your medical profile.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => router.push('/auth?redirect=/checkout')}
                className="w-full py-4 bg-[#1d46af]/10 text-[#1d46af] border-2 border-[#1d46af]/30 text-sm font-black rounded-xl hover:bg-[#1d46af]/20 transition-all active:scale-95"
              >
                SIGN UP NOW
              </button>
              <button 
                onClick={() => router.push('/auth?redirect=/checkout')}
                className="w-full py-4 bg-white text-slate-400 border-2 border-slate-100 text-sm font-black rounded-xl hover:bg-slate-50 transition-all active:scale-95"
              >
                ALREADY HAVE AN ACCOUNT?
              </button>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-20 px-6">
        <div className="mx-auto max-w-7xl text-center">
           <div className="inline-flex items-center mb-8">
              <span className="text-2xl font-black text-[#1d46af] tracking-tight">Isky</span>
              <div className="relative ml-2 w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-[2.5px] border-[#1d46af]"></div>
                <div className="absolute inset-[3px] rounded-full border border-amber-400 opacity-80"></div>
                <span className="text-[#1d46af] font-black text-[12px] tracking-tighter">MD</span>
              </div>
           </div>
           <p className="text-slate-400 text-sm font-medium mb-10">© 2026 IskyMD Universal Systems. All rights reserved.</p>
           <div className="flex justify-center gap-8">
              <a href="#" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Privacy</a>
              <a href="#" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Terms</a>
           </div>
        </div>
      </footer>
    </div>
  );
}

