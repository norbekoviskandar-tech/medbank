"use client";

import dynamic from "next/dynamic";

const AuthComponent = dynamic(() => import("./AuthComponent"), {
  ssr: false,
});

export default function AuthPage() {
  return <AuthComponent />;
}
