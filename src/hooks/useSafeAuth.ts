"use client";

import { useState, useEffect } from "react";
import { SafeAuthConfig, SafeAuthInitOptions } from "@safe-global/auth-kit";

export function useSafeAuth() {
  // Specify the type of state as SafeAuthPack | null
  const [safeAuthPack, setSafeAuthPack] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // This ensures code execution only happens in the client-side environment
    if (typeof window === "undefined") return;

    async function initSafeAuth() {
      // Dynamic import for SafeAuthPack inside the useEffect to ensure it's client-side
      const { SafeAuthPack } = await import("@safe-global/auth-kit");

      const safeAuthConfig: SafeAuthConfig = {
        txServiceUrl: "https://safe-transaction-mainnet.safe.global",
      };

      const safeAuthInitOptions: SafeAuthInitOptions = {
        enableLogging: true,
        showWidgetButton: false,
        chainConfig: {
          chainId: "0x1",
          rpcTarget: "YOUR_RPC_URL_HERE",
        },
      };

      const authPack = new SafeAuthPack(safeAuthConfig);
      await authPack.init(safeAuthInitOptions);
      setSafeAuthPack(authPack);

      // Example: Subscribe to accountsChanged event
      authPack.subscribe("accountsChanged", (accounts: string[]) => {
        console.log("Accounts Changed:", accounts);
        setIsAuthenticated(accounts && accounts.length > 0);
      });
    }

    initSafeAuth();
  }, []);

  return { safeAuthPack, isAuthenticated };
}
