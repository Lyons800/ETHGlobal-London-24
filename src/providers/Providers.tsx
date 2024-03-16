import { AccountAbstractionProvider } from "@/store/accountAbstractionContextOld";

const Providers = ({ children }: { children: JSX.Element }) => {
  return <AccountAbstractionProvider>{children}</AccountAbstractionProvider>;
};

export default Providers;
