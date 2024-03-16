import { useState, useEffect } from "react";
import {
  SafeAuthPack,
  SafeAuthConfig,
  SafeAuthInitOptions,
} from "@safe-global/auth-kit";

export function useSafeAuth() {
  const [safeAuthPack, setSafeAuthPack] = useState<SafeAuthPack | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initSafeAuth = async () => {
      const safeAuthConfig = {
        txServiceUrl: "https://safe-transaction-mainnet.safe.global",
      };
      const safeAuthInitOptions = {
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
      authPack.subscribe("accountsChanged", (accounts) => {
        console.log("Accounts Changed:", accounts);
        setIsAuthenticated(accounts && accounts.length > 0);
      });
    };

    initSafeAuth();
  }, []);

  return { safeAuthPack, isAuthenticated };
}
