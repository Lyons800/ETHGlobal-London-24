import { Button } from "@/components/ui/button";
import { useAccountAbstraction } from "@/store/accountAbstractionContext";
import React, { useEffect } from "react";

export default function SignIn() {
  const {
    isAuthenticated,
    loginWeb3Auth,
    logoutWeb3Auth,
    ownerAddress,
    safeSelected,
    chainId,
  } = useAccountAbstraction();

  // Optional: Redirect or update UI upon successful sign-in
  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is authenticated. Address:", ownerAddress);
      // Additional actions upon successful sign-in, if necessary
    }
  }, [isAuthenticated, ownerAddress]);

  return (
    <div>
      <p>Sign In</p>
      {isAuthenticated && ownerAddress ? (
        <div>
          <p>Logged in as: {ownerAddress}</p>
          <Button onClick={logoutWeb3Auth}>Logout</Button>
          <p>Safe selected: {safeSelected}</p>
          <p>Chain ID: {chainId}</p>
          {/* You can add a logout button or other user-specific components here */}
        </div>
      ) : (
        <Button onClick={loginWeb3Auth}>Sign In with Web3</Button>
      )}
    </div>
  );
}
