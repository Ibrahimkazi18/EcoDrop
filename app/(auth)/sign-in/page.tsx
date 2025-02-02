"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, signInWithGoogle } from "@/lib/firebase"; 
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useToast } from "@/hooks/use-toast"; 
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input"; 
import { Label } from "@/components/ui/label"; 
import { FcGoogle } from "react-icons/fc";
import { doc, getDoc } from "firebase/firestore";
import { FaEye, FaEyeSlash } from "react-icons/fa"

export default function SignIn() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [resetEmail, setResetEmail] = useState<string>(""); 
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const fetchUserRole = async (userId: string): Promise<{ role: string; agencyId?: string }> => {
    const userDocRef = doc(db, "users", userId);
  
    try {
      const userDoc = await getDoc(userDocRef); 
  
      if (userDoc.exists()) {
        const data = userDoc.data();

        return {
          role : data?.role || "unknown",
          agencyId : data?.agencyId ? data.agencyId : data.id || undefined
        }
      } else {
        console.log("No such document!");
        return { role: "unknown" };
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      return { role: "unknown" };
    }
  };


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); 
    const date = new Date();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const { role: userRole, agencyId } = await fetchUserRole(user.uid);

      sessionStorage.setItem("user", "true");
      
      if (userRole === "agency") {
        if (agencyId) {
          router.push(`/agency-dashboard/${agencyId}`);
        } else {
          throw new Error("Agency ID not found");
        }
      } else if (userRole === "citizen") {
        router.push("/citizen-dashboard");
      } else if (userRole === "volunteer") {
        if (agencyId) {
          router.push(`/${agencyId}/volunteer-dashboard`);
        } else {
          throw new Error("Agency ID not found");
        }
      } else {
        throw new Error("Invalid role");
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

      const { role: userRole, agencyId } = await fetchUserRole(user.uid);

      sessionStorage.setItem("user", "true");

      if (userRole === "agency") {
        router.push(`/agency-dashboard/${agencyId}`);
      } else if (userRole === "citizen") {
        router.push("/citizen-dashboard");
      } else if (userRole === "volunteer") {
        if (agencyId) {
          router.push(`/${agencyId}/volunteer-dashboard`);
        } else {
          throw new Error("Agency ID not found");
        }
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

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
  
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: "Password Reset Email Sent",
        description: `Check your inbox for reset instructions.`,
      });
      setResetEmail(""); // Clear input after sending
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email.",
        variant: "destructive",
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
        <div className="text-right">
          <button
            type="button"
            onClick={() => setShowReset(true)}
            className="text-sm text-blue-600 hover:underline"
          >
            Forgot Password?
          </button>
        </div>

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

      {showReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-96">
            <h3 className="text-lg font-bold mb-4">Reset Password</h3>
            <Input
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full mb-3 text-black"
            />
            <div className="flex justify-between">
              <Button onClick={handlePasswordReset} className="w-full mr-2">
                Send Reset Email
              </Button>
              <Button onClick={() => setShowReset(false)} variant="outline" className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}