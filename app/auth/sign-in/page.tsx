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

export default function SignIn() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast();

  // Function to fetch user role from Firestore (implement this)
  const fetchUserRole = async (userId: string): Promise<string> => {
    // Reference to the Firestore database (ensure you have initialized your Firestore)
    const userDocRef = doc(db, "users", userId); // Correctly reference the user document
  
    try {
      const userDoc = await getDoc(userDocRef); // Fetch the user document
  
      if (userDoc.exists()) {
        return userDoc.data()?.role || "unknown"; // Return role if it exists
      } else {
        console.log("No such document!");
        return "unknown"; // Handle the case where the document does not exist
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      return "unknown"; // Return a default value in case of an error
    }
  };


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); // Reset error before submission
    const date = new Date();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user role from Firestore (you need to implement this function)
      const userRole = await fetchUserRole(user.uid);

      sessionStorage.setItem("user", "true");

      // Navigate to dashboard based on role
      if (userRole === "agency") {
        router.push("/agency-dashboard");
      } else if (userRole === "citizen") {
        router.push("/citizen-dashboard");
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="border-gray-900 p-[10px] w-full bg-white text-black text-base focus:border-[#0070f3] focus:outline-none"
              />
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