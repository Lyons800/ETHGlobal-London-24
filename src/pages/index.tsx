"use client";

import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useSafeAuth } from "@/hooks/useSafeAuth";
import { useAccountAbstraction } from "@/store/accountAbstractionContextOld";
import { useRouter } from "next/navigation";

export default function HomePage() {
 
  return (
    <MainLayout>
      <div>
        <p>World ID Cloud Template</p>
        <Button variant={"outline"}>Click me</Button>
      </div>
    </MainLayout>
  );
}
