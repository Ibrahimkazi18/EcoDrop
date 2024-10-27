import { useState } from "react";
import { Button } from "@/components/ui/button"; // Import ShadCN Button
import { Input } from "@/components/ui/input"; // Import ShadCN Input
import { Bell, Coins, Leaf, LogOut, Search } from "lucide-react"; // Import icons from lucide-react
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function VolunteerNavbar() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleSignOut = async () => {
    await signOut(auth);
    sessionStorage.removeItem("user");
    router.push("/sign-in"); // Redirect to sign-in after logging out
  };
  
  const toggle = () => {
    setIsOpen((prev) => !prev)
  }


  return (
    <nav className={`flex items-center justify-between p-4 shadow-md ${isOpen ? `w-[75rem]` : `w-[90rem]`} sticky top-0 z-50`}>
      <SidebarTrigger onClick={toggle}/>
      <div className="flex items-center">
        <Leaf color="green" />
        <span className="ml-2 text-xl font-bold text-green-600">EcoDrop</span>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center border border-gray-300 rounded-md">
          <Input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-none"
          />
          <Search className="h-5 w-5 text-gray-500 mr-4" />
        </div>
        <div className="relative">
          <Bell className="h-5 w-5 text-gray-500" />
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-600 rounded-full" />
        </div>
        <div className="flex items-center space-x-1">
          <Coins color="green" />
          <span className="text-green-600">100</span> {/* Replace with dynamic points */}
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="h-5 w-5" />
          Log Out
        </Button>
      </div>
    </nav>
  );
}
