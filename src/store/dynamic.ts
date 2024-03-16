// If @safe-global/auth-kit has TypeScript definitions:
import { SafeAuthPack } from "@safe-global/auth-kit";

// Otherwise, you might need to declare it manually
// declare class SafeAuthPack { ... }

const dynamicImportSafeAuthPack = async (): Promise<
  typeof SafeAuthPack | null
> => {
  const { SafeAuthPack } = await import("@safe-global/auth-kit");
  return new SafeAuthPack();
};

export default dynamicImportSafeAuthPack;
