// DashboardClient.tsx (Client Component)
"use client"; // Ensures this is a client-side component

import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import ThemeChanger from "@/components/ui/theme-changer";

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

  const handleSignOut = async () => {
    await signOut(auth);
    sessionStorage.removeItem("user");
    router.push("/sign-in"); // Redirect to sign-in after logging out
  };

  return (
    <div>
      <div>
        Dashboard
        <button
          onClick={handleSignOut}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Log Out
        </button>

        <ThemeChanger />
      </div>
      {children}
    </div>
  );
};

export default DashboardClient;
