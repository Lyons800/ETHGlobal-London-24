import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ethers } from "ethers";

import AccountAbstraction from "@safe-global/account-abstraction-kit-poc";
import {
  SafeAuthConfig,
  SafeAuthInitOptions,
  SafeAuthPack,
} from "@safe-global/auth-kit";
import { MoneriumPack, StripePack } from "@safe-global/onramp-kit";
import { GelatoRelayPack } from "@safe-global/relay-kit";
import { RelayResponse as GelatoRelayResponse } from "@gelatonetwork/relay-sdk";
import Safe, { EthersAdapter } from "@safe-global/protocol-kit";
import {
  MetaTransactionData,
  MetaTransactionOptions,
} from "@safe-global/safe-core-sdk-types";
import { initialChain } from "@/constants/chains";
import usePolling from "@/hooks/usePolling";
import { getERC20Info } from "@/lib/getERC20Info";
import getMoneriumInfo, { MoneriumInfo } from "@/lib/getMoneriumInfo";
import isMoneriumRedirect from "@/lib/isMoneriumRedirect";
import Chain from "@/models/chain";
import getChain from "@/lib/getChain";
import { ERC20Token } from "@/models/erc20token";

type accountAbstractionContextValue = {
  ownerAddress?: string;
  chainId: string;
  safes: string[];
  tokenAddress: string;
  erc20token?: ERC20Token;
  chain?: Chain;
  isAuthenticated: boolean;
  web3Provider?: ethers.BrowserProvider;
  loginWeb3Auth: () => void;
  logoutWeb3Auth: () => void;
  setChainId: (chainId: string) => void;
  safeSelected?: string;
  safeBalance?: string;
  erc20Balances?: Record<string, ERC20Token>;
  setSafeSelected: React.Dispatch<React.SetStateAction<string>>;
  setTokenAddress: React.Dispatch<React.SetStateAction<string>>;
  isRelayLoading: boolean;
  relayTransaction: () => Promise<void>;
  gelatoTaskId?: string;
  openStripeWidget: () => Promise<void>;
  closeStripeWidget: () => Promise<void>;
  startMoneriumFlow: () => Promise<void>;
  closeMoneriumFlow: () => void;
  moneriumInfo?: MoneriumInfo;
  accountAbstractionKit?: AccountAbstraction;
};

const initialState = {
  isAuthenticated: false,
  loginWeb3Auth: () => {},
  logoutWeb3Auth: () => {},
  relayTransaction: async () => {},
  setChainId: () => {},
  setSafeSelected: () => {},
  setTokenAddress: () => {},
  onRampWithStripe: async () => {},
  safes: [],
  tokenAddress: ethers.ZeroAddress,
  chainId: initialChain.id,
  isRelayLoading: true,
  openStripeWidget: async () => {},
  closeStripeWidget: async () => {},
  startMoneriumFlow: async () => {},
  closeMoneriumFlow: () => {},
};

const accountAbstractionContext =
  createContext<accountAbstractionContextValue>(initialState);

const useAccountAbstraction = () => {
  const context = useContext(accountAbstractionContext);

  if (!context) {
    throw new Error(
      "useAccountAbstraction should be used within a AccountAbstraction Provider"
    );
  }

  return context;
};

const MONERIUM_TOKEN = "monerium_token";
const MONERIUM_SELECTED_SAFE = "monerium_safe_selected";

const AccountAbstractionProvider = ({
  children,
}: {
  children: JSX.Element;
}) => {
  console.log("AccountAbstractionProvider rendering");

  // owner address from the email  (provided by web3Auth)
  const [ownerAddress, setOwnerAddress] = useState<string>("");

  // safes owned by the user
  const [safes, setSafes] = useState<string[]>([]);

  // selected token to be used for fee payments (native token by default)
  const [tokenAddress, setTokenAddress] = useState<string>(ethers.ZeroAddress);

  // chain selected
  const [chainId, setChainId] = useState<string>(() => {
    if (isMoneriumRedirect()) {
      return "0x5";
    }

    return initialChain.id;
  });

  // web3 provider to perform signatures
  const [web3Provider, setWeb3Provider] = useState<ethers.BrowserProvider>();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const chain = getChain(chainId) || initialChain;

  // reset React state when you switch the chain
  useEffect(() => {
    setOwnerAddress("");
    setSafes([]);
    setChainId(chain.id);
    setWeb3Provider(undefined);
    setSafeSelected("");
  }, [chain]);

  // authClient
  const [safeAuthPack, setSafeAuthPack] = useState<SafeAuthPack>();

  // onRampClient
  const [stripePack, setStripePack] = useState<StripePack>();

  // Inside AccountAbstractionProvider component

  useEffect(() => {
    const checkAuthStatus = async () => {
      // Your logic to check authentication status
      // For example, rehydrating from localStorage
      const authState = localStorage.getItem("isAuthenticated") === "true";
      setIsAuthenticated(authState);
      setLoading(false); // Indicate that loading/checking is complete
    };

    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      // Exit if we're server-side
      console.log("initSafeAuth: Server-side, skipping initialization.");

      return;
    }

    async function initSafeAuth() {
      try {
        // Dynamic import for SafeAuthPack inside the useEffect to ensure it's client-side
        const { SafeAuthPack } = await import("@safe-global/auth-kit");
        console.log("initSafeAuth: SafeAuthPack imported.");

        const safeAuthConfig: SafeAuthConfig = {
          txServiceUrl: "https://safe-transaction-mainnet.safe.global",
        };

        const safeAuthInitOptions: SafeAuthInitOptions = {
          enableLogging: true,
          showWidgetButton: false,
          chainConfig: {
            chainId: chain.id, // Using the dynamic chain ID from your state
            rpcTarget: chain.rpcUrl, // Using the dynamic RPC URL from your state
          },
        };

        const authPack = new SafeAuthPack(safeAuthConfig);
        await authPack.init(safeAuthInitOptions);
        setSafeAuthPack(authPack);

        // Example: Subscribe to accountsChanged event
        authPack.subscribe("accountsChanged", (accounts: string[]) => {
          console.log("Accounts Changed Event Fired", accounts);
          const isAuthenticated = accounts && accounts.length > 0;
          console.log("Setting isAuthenticated to:", isAuthenticated);
          setIsAuthenticated(isAuthenticated);
        });

        console.log("initSafeAuth: Initialization completed.");
      } catch (error) {
        console.error("initSafeAuth Error:", error);
      }
    }

    initSafeAuth();
  }, [chain.id, chain.rpcUrl]); // Dependencies for useEffect

  // auth-kit implementation
  const loginWeb3Auth = useCallback(async () => {
    if (!safeAuthPack) return;

    try {
      const { safes, eoa } = await safeAuthPack.signIn();
      const provider = safeAuthPack.getProvider()!;

      // we set react state with the provided values: owner (eoa address), chain, safes owned & web3 provider
      setChainId(chain.id);
      setOwnerAddress(eoa);
      setSafes(safes || []);
      setWeb3Provider(new ethers.BrowserProvider(provider));
      setIsAuthenticated(true);
      localStorage.setItem("isAuthenticated", "true");
    } catch (error) {
      console.log("error: ", error);
    }
  }, [chain, safeAuthPack]);

  const logoutWeb3Auth = () => {
    safeAuthPack?.signOut();
    setOwnerAddress("");
    setSafes([]);
    setChainId(chain.id);
    setWeb3Provider(undefined);
    setSafeSelected("");
    setGelatoTaskId(undefined);
    setIsAuthenticated(false);
    closeMoneriumFlow();
  };

  // current safe selected by the user
  const [safeSelected, setSafeSelected] = useState<string>("");
  const [moneriumInfo, setMoneriumInfo] = useState<MoneriumInfo>();
  const [moneriumPack, setMoneriumPack] = useState<MoneriumPack>();

  // // Initialize MoneriumPack
  // useEffect(() => {
  //   (async () => {
  //     if (!web3Provider || !safeSelected) return;

  //     const safeOwner = await web3Provider.getSigner();
  //     const ethAdapter = new EthersAdapter({
  //       ethers,
  //       signerOrProvider: safeOwner,
  //     });

  //     const safeSdk = await Safe.create({
  //       ethAdapter,
  //       safeAddress: safeSelected,
  //       isL1SafeSingleton: true,
  //     });

  //     const pack = new MoneriumPack({
  //       clientId: process.env.REACT_APP_MONERIUM_CLIENT_ID || "",
  //       environment: "sandbox",
  //       redirectUrl: process.env.REACT_APP_MONERIUM_REDIRECT_URL || "",
  //     });

  //     await pack.init({
  //       safeSdk,
  //     });

  //     setMoneriumPack(pack);
  //   })();
  // }, [web3Provider, safeSelected]);

  const startMoneriumFlow = useCallback(
    async (authCode?: string, refreshToken?: string) => {
      if (!moneriumPack) return;

      localStorage.setItem(MONERIUM_SELECTED_SAFE, safeSelected);

      const moneriumClient = await moneriumPack.open({
        // redirectUrl: process.env.REACT_APP_MONERIUM_REDIRECT_URL,
        // authCode,
        // refreshToken,
      });

      if (moneriumClient.bearerProfile) {
        localStorage.setItem(
          MONERIUM_TOKEN,
          moneriumClient.bearerProfile.refresh_token
        );

        const authContext = await moneriumClient.getAuthContext();
        const profile = await moneriumClient.getProfile(
          authContext.defaultProfile
        );
        const balances = await moneriumClient.getBalances(
          authContext.defaultProfile
        );

        setMoneriumInfo(
          getMoneriumInfo(safeSelected, authContext, profile, balances)
        );
      }
    },
    [moneriumPack, safeSelected]
  );

  const closeMoneriumFlow = useCallback(() => {
    moneriumPack?.close();
    localStorage.removeItem(MONERIUM_TOKEN);
    setMoneriumInfo(undefined);
  }, [moneriumPack]);

  useEffect(() => {
    const authCode =
      new URLSearchParams(window.location.search).get("code") || undefined;
    const refreshToken = localStorage.getItem(MONERIUM_TOKEN) || undefined;

    if (authCode || refreshToken) startMoneriumFlow(authCode, refreshToken);
  }, [startMoneriumFlow]);

  // TODO: add disconnect owner wallet logic ?

  const [accountAbstractionKit, setAccountAbstractionKit] =
    useState<AccountAbstraction>();

  // conterfactual safe Address if its not deployed yet
  useEffect(() => {
    const getSafeAddress = async () => {
      if (web3Provider) {
        const hasSafes = safes.length > 0;
        const storedSafe =
          localStorage.getItem(MONERIUM_SELECTED_SAFE) || undefined;

        const safeSelected = hasSafes
          ? storedSafe || safes[0]
          : await accountAbstractionKit?.protocolKit.getAddress();

        setSafeSelected(safeSelected || "");
      }
    };

    getSafeAddress();
  }, [accountAbstractionKit?.protocolKit, safes, web3Provider]);

  useEffect(() => {
    if (!web3Provider) return;
    (async () => {
      // Instantiate AccountAbstraction kit
      const ethAdapter = new EthersAdapter({
        ethers,
        signerOrProvider: await web3Provider.getSigner(),
      });
      const safeAccountAbstraction = new AccountAbstraction(ethAdapter);
      await safeAccountAbstraction.init();
      const gelatoRelayPack = new GelatoRelayPack({
        protocolKit: safeAccountAbstraction.protocolKit,
      });
      safeAccountAbstraction.setRelayKit(gelatoRelayPack);

      setAccountAbstractionKit(safeAccountAbstraction);
    })();
  }, [web3Provider]);

  const [isRelayLoading, setIsRelayLoading] = useState<boolean>(false);
  const [gelatoTaskId, setGelatoTaskId] = useState<string>();

  // refresh the Gelato task id
  useEffect(() => {
    setIsRelayLoading(false);
    setGelatoTaskId(undefined);
  }, [chainId]);

  // relay-kit implementation using Gelato
  const relayTransaction = async () => {
    if (web3Provider) {
      setIsRelayLoading(true);

      // we use a dump safe transfer as a demo transaction
      const dumpSafeTransafer: MetaTransactionData[] = [
        {
          to: safeSelected,
          data: "0x",
          value: ethers.parseUnits("0.01", "ether").toString(),
          operation: 0, // OperationType.Call,
        },
      ];

      const options: MetaTransactionOptions = {
        isSponsored: false,
        gasLimit: "600000", // in this alfa version we need to manually set the gas limit
        gasToken: tokenAddress,
      };

      const response = (await accountAbstractionKit?.relayTransaction(
        dumpSafeTransafer,
        options
      )) as GelatoRelayResponse;

      setIsRelayLoading(false);
      console.log(response);
      setGelatoTaskId(response.taskId);
    }
  };

  // onramp-kit implementation
  const openStripeWidget = async () => {
    const stripePack = new StripePack({
      stripePublicKey: process.env.REACT_APP_STRIPE_PUBLIC_KEY || "",
      onRampBackendUrl: process.env.REACT_APP_STRIPE_BACKEND_BASE_URL || "",
    });

    await stripePack.init();

    const sessionData = await stripePack.open({
      // sessionId: sessionId, optional parameter
      element: "#stripe-root",
      defaultOptions: {
        transaction_details: {
          wallet_address: safeSelected,
          supported_destination_networks: ["ethereum", "polygon"],
          supported_destination_currencies: ["usdc"],
          lock_wallet_address: true,
        },
        customer_information: {
          email: "john@doe.com",
        },
      },
    });

    setStripePack(stripePack);

    console.log("Stripe sessionData: ", sessionData);
  };

  const closeStripeWidget = async () => {
    stripePack?.close();
  };

  // we can pay Gelato tx relay fees with native token & ERC20

  // fetch safe address balance with polling
  const fetchSafeBalance = useCallback(async () => {
    const balance = await web3Provider?.getBalance(safeSelected);

    return balance?.toString();
  }, [web3Provider, safeSelected]);

  const safeBalance = usePolling(fetchSafeBalance);

  // fetch safe's ERC20 balances
  const fetchErc20SafeBalances = useCallback(async (): Promise<
    Record<string, ERC20Token>
  > => {
    if (!web3Provider) {
      return {};
    }

    return Promise.all(
      chain.supportedErc20Tokens?.map((erc20Address) =>
        getERC20Info(erc20Address, web3Provider, safeSelected)
      ) || []
    ).then((tokens) =>
      tokens.reduce(
        (acc, token) => (!!token ? { ...acc, [token.address]: token } : acc),
        {}
      )
    );
  }, [web3Provider, safeSelected, chain]);

  const erc20Balances = usePolling(fetchErc20SafeBalances);
  const erc20token = erc20Balances?.[tokenAddress];

  const state = {
    ownerAddress,
    chainId,
    chain,
    safes,
    erc20token,
    tokenAddress,

    isAuthenticated,

    web3Provider,

    loginWeb3Auth,
    logoutWeb3Auth,

    setChainId,

    safeSelected,
    safeBalance,
    erc20Balances,
    setSafeSelected,
    setTokenAddress,

    isRelayLoading,
    relayTransaction,
    gelatoTaskId,

    openStripeWidget,
    closeStripeWidget,

    startMoneriumFlow,
    closeMoneriumFlow,
    moneriumInfo,

    accountAbstractionKit,
  };

  return (
    <accountAbstractionContext.Provider value={state}>
      {children}
    </accountAbstractionContext.Provider>
  );
};

export { useAccountAbstraction, AccountAbstractionProvider };
