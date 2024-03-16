"use client";

import React, { ReactNode, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useAccountAbstraction } from "@/store/accountAbstractionContext";
import { useRouter } from "next/router";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { isAuthenticated, ownerAddress } = useAccountAbstraction();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is authenticated. Address:", isAuthenticated);

      // Additional actions upon successful sign-in, if necessary
    } else {
      router.push("/signin");
    }
  }, [isAuthenticated, ownerAddress]);

  // If not authenticated, you can choose to return null or a loading indicator instead of the layout structure.
  // This prevents a flash of the layout before the redirection occurs.
  if (!isAuthenticated) {
    return null; // or <LoadingIndicator /> if you have a loading component
  }

  return (
    <div className="flex">
      <aside className="w-64" aria-label="Sidebar">
        <div>
          <p>Logged in as: {ownerAddress}</p>
        </div>
        <Sidebar />
      </aside>
      <main className="flex-1 py-10 px-4">{children}</main>
    </div>
  );
};

export default MainLayout;
