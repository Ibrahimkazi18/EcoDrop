// DashboardClient.tsx (Client Component)
"use client"; // Ensures this is a client-side component

import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface DashboardClientProps {
  children: React.ReactNode;
}

export const revalidate = 0;

const DashboardClient = ({ children }: DashboardClientProps) => {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast(); 

  useEffect(() => {
    const userSession = sessionStorage.getItem("user");

    if (!user && !userSession) {
      toast({
        title: "User Not Logged In",
        description: `Cannot Access the Dashboard as User not Logged In`, 
      });

      router.push("/sign-in");

    } else if (user) {
      sessionStorage.setItem("user", JSON.stringify(user));
    }
  }, [user, router]);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Runs after hydration
  }, []);

  if (!isClient) {
    return null; // Server-side render nothing
  }

  return (
    <div>
      {children}
    </div>
  );
};

export default DashboardClient;
