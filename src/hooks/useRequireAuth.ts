// src/hooks/useRequireAuth.ts
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSafeAuth } from "./useSafeAuth";

export function useRequireAuth(redirectUrl = "/signin") {
  const { safeAuthPack, isAuthenticated } = useSafeAuth();
  const router = useRouter();

  useEffect(() => {
    if (safeAuthPack && !isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [safeAuthPack, isAuthenticated, router, redirectUrl]);

  return { isAuthenticated };
}
