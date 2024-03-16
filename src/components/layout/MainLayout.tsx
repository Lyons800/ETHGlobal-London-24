"use client";

import React, { ReactNode, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useAccountAbstraction } from "@/store/accountAbstractionContextOld";
import { useRouter } from "next/router";
import { useSafeAuth } from "@/hooks/useSafeAuth";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { isAuthenticated } = useAccountAbstraction();

  useEffect(() => {
    if (!isAuthenticated && typeof window !== "undefined") {
      window.location.href = "/signin";
    }
  }, [isAuthenticated]);

  return (
    <div className={`flex ${!isAuthenticated ? "hidden" : ""}`}>
      <aside className="w-64" aria-label="Sidebar">
        <Sidebar />
      </aside>
      <main className="flex-1 py-10 px-4">{children}</main>
    </div>
  );
};

export default MainLayout;
