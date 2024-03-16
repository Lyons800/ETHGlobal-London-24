import { Button } from "@/components/ui/button";
import { useAccountAbstraction } from "@/store/accountAbstractionContext";
import React, { useEffect } from "react";

export default function SignIn() {
  const { isAuthenticated, loginWeb3Auth } = useAccountAbstraction();

  // Optional: Redirect or update UI upon successful sign-in
  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is authenticated");
      // Redirect the user or update the UI as needed
    }
  }, [isAuthenticated]);

  return (
    <div>
      <p>Sign In</p>
      <Button onClick={loginWeb3Auth}>Sign In with Web3</Button>
    </div>
  );
}
