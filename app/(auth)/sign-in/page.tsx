"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, signInWithGoogle } from "@/lib/firebase"; // Import auth from firebase.ts
import { signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast"; // Make sure this is correctly implemented
import { Button } from "@/components/ui/button"; // Import ShadCN Button
import { Input } from "@/components/ui/input"; // Import ShadCN Input
import { Label } from "@/components/ui/label"; // Import ShadCN Label
import { FcGoogle } from "react-icons/fc";
import { doc, getDoc } from "firebase/firestore";
import { FaEye, FaEyeSlash } from "react-icons/fa"

export default function SignIn() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Function to fetch user role from Firestore 
  const fetchUserRole = async (userId: string): Promise<string> => {
    const userDocRef = doc(db, "users", userId);
  
    try {
      const userDoc = await getDoc(userDocRef); 
  
      if (userDoc.exists()) {
        return userDoc.data()?.role || "unknown"; 
      } else {
        console.log("No such document!");
        return "unknown"; 
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      return "unknown"; 
    }
  };


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); // Reset error before submission
    const date = new Date();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRole = await fetchUserRole(user.uid);

      sessionStorage.setItem("user", "true");

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userRole === "agency") {
        if(userDoc.exists()){
          const agencyId = userDoc.data().agencyId;
          router.push(`/agency-dashboard/${agencyId}`);
        }
      } else if (userRole === "citizen") {
        router.push("/citizen-dashboard");

      } else if (userRole === "volunteer") {
      
        if(userDoc.exists()){
          const agencyId = userDoc.data().agencyId;
          router.push(`/${agencyId}/volunteer-dashboard`);
        }
      }

      toast({
        title: "Sign In Successful",
        description: `${email} logged in at ${date.toLocaleString()}`,
      });
    } catch (err: any) {
      console.error(err);
      setError("Invalid email or password. Please try again.");
      toast({
        title: "Log In Unsuccessful",
        description: `Could not log in. Error: ${err.message}`,
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      const user = result.user;

      // Fetch user role from Firestore
      const userRole = await fetchUserRole(user.uid);

      sessionStorage.setItem("user", "true");

      // Navigate to dashboard based on role
      if (userRole === "agency") {
        router.push("/agency-dashboard");
      } else if (userRole === "citizen") {
        router.push("/citizen-dashboard");
      }

      toast({
        title: "Google Sign In Successful",
        description: `${user.email} logged in with Google.`,
      });
    } catch (error) {
      console.error("Google Sign-In error:", error);
      setError("Failed to log in with Google. Try again.");
      toast({
        title: "Google Sign In Unsuccessful",
        description: `Could not log in with Google.`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Log In to an Account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="border-gray-900 p-[10px] w-full bg-white text-black text-base focus:border-[#0070f3] focus:outline-none"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-neutral-700">Password</Label>
              <div className="flex">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="border-gray-900 p-[10px] z-10 w-full mr-2 bg-white text-black text-base focus:border-[#0070f3] focus:outline-none pr-10"
                />
                <Button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="flex items-center text-neutral-700 bg-transparent focus:outline-none hover:bg-slate-700 hover:text-white"
                  style={{ padding: '0 8px' }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}  
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <Button type="submit" className="w-full">
              Log In
            </Button>
            <Button variant="outline" onClick={handleGoogleSignIn} className="w-full flex items-center justify-center">
              <FcGoogle className="mr-2" size={20} />
              Log In with Google
            </Button>
          </div>
        </form>
        <p className="mt-2 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <a
            href="/sign-up"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}