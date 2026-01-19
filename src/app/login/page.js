"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser } from "@/auth/auth.logic";
import { BookOpen, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");

  async function handleLogin(e) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const user = await loginUser(email, password);
      if (!user) {
        setError("Invalid email or password. Please try again.");
        setIsLoading(false);
        return;
      }

      // Handle redirect parameter
      if (redirectPath) {
        router.push(redirectPath);
        return;
      }

      // Role-based redirect
      if (user.role === "admin") {
        router.push("/author/manage-questions");
      } else {
        router.push("/portal");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-black">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex items-center justify-center cursor-pointer" onClick={() => router.push('/')}>
            <span className="text-4xl font-black text-[#1d46af] tracking-tight">Isky</span>
            <div className="relative ml-2 w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[3px] border-[#1d46af]"></div>
              <div className="absolute inset-[4px] rounded-full border border-amber-400 opacity-80"></div>
              <div className="absolute top-[4px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400"></div>
              <div className="absolute bottom-[4px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400"></div>
              <span className="text-[#1d46af] font-black text-[18px] tracking-tighter">MD</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Sign in to continue your medical journey.
          </p>
        </div>

        <div className="glass rounded-[2.5rem] p-8 shadow-2xl shadow-primary/5 sm:p-10">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-600 dark:bg-rose-500/10">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                <input
                  type="email"
                  required
                  placeholder="name@university.edu"
                  className="w-full rounded-2xl border bg-background py-4 pl-12 pr-4 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Password</label>
                <a href="#" className="text-sm font-medium text-primary hover:underline">Forgot?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-2xl border bg-background py-4 pl-12 pr-4 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-lg font-bold text-white shadow-xl shadow-primary/30 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? "Signing in..." : "Sign In"}
              {!isLoading && <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Don't have an account?</span>{" "}
            <a 
              href={redirectPath ? `/signup?redirect=${redirectPath}` : "/signup"} 
              className="font-bold text-primary hover:underline"
            >
              Create one free
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

