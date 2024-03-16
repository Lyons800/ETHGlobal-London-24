import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ethers } from "ethers";
import { SafeAuthInitOptions, SafeAuthPack } from "@safe-global/auth-kit";
import getChain from "@/lib/getChain";
import isMoneriumRedirect from "@/lib/isMoneriumRedirect";
import { initialChain } from "@/constants/chains";
import dynamicImportSafeAuthPack from "./dynamic";

// Define the context type.
interface AccountAbstractionContextType {
  isAuthenticated: boolean;
  loginWeb3Auth: () => Promise<void>;
  // Add other necessary types as needed
}

// Initialize your context
export const AccountAbstractionContext = createContext<
  AccountAbstractionContextType | undefined
>(undefined);

export const AccountAbstractionProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Initialize the SafeAuthPack here or in a useEffect if dependent on dynamic values
  const [safeAuthPack, setSafeAuthPack] = useState<SafeAuthPack | null>(null);

  // chain selected
  const [chainId, setChainId] = useState<string>(() => {
    if (isMoneriumRedirect()) {
      return "0x5";
    }

    return initialChain.id;
  });

  const chain = getChain(chainId) || initialChain;

  const options: SafeAuthInitOptions = {
    enableLogging: true,
    showWidgetButton: false,
    chainConfig: {
      chainId: chain.id,
      rpcTarget: chain.rpcUrl,
    },
  };

  useEffect(() => {
    // if (typeof window === "undefined") return;

    const initSafeAuth = async () => {
      // Actual initialization logic here
      const authPack =  dynamicImportSafeAuthPack(/* your configuration here */);
      await authPack?.init?.(options);
      setSafeAuthPack(authPack);
    };
    initSafeAuth();
  }, []);

  const loginWeb3Auth = useCallback(async () => {
    console.log("Attempting to login via loginWeb3Auth");
    if (!safeAuthPack) {
      console.log("SafeAuthPack is not initialized");
      return;
    }

    // Logic to handle the login process
    try {
      const { safes, eoa } = await safeAuthPack.signIn();
      const provider = safeAuthPack.getProvider();

      // Update isAuthenticated and other relevant state based on the login result
      setIsAuthenticated(true);
      console.log("Successfully logged in with SafeAuthPack");
      // Additional state updates as needed
    } catch (error) {
      console.error("Login error:", error);
      setIsAuthenticated(false);
    }
  }, [safeAuthPack]);

  // Define the context value
  const value = {
    isAuthenticated,
    loginWeb3Auth,
    // Add other values as needed
  };

  return (
    <AccountAbstractionContext.Provider value={value}>
      {children}
    </AccountAbstractionContext.Provider>
  );
};

// Custom hook for using this context
export const useAccountAbstraction = (): AccountAbstractionContextType => {
  const context = useContext(AccountAbstractionContext);
  if (context === undefined) {
    throw new Error(
      "useAccountAbstraction must be used within a AccountAbstractionProvider"
    );
  }
  return context;
};
