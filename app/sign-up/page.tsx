"use client";

import { FormEvent, useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase"; // Import auth from firebase.ts
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; // Import ShadCN Button
import { Input } from "@/components/ui/input"; // Import ShadCN Input
import { Label } from "@/components/ui/label"; // Import ShadCN Label
import { useToast } from "@/hooks/use-toast"; // Ensure this hook is correctly implemented

export default function SignUp() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast(); 

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); // Reset error before submission
    const date = new Date();

    try {
      // Firebase authentication for creating a user
      await createUserWithEmailAndPassword(auth, email, password);
      sessionStorage.setItem("user", "true");

      toast({
        title: "Sign Up Successful",
        description: `${email} signed up to the Dashboard at ${date.toLocaleString()}`, // Display a readable date format
      });

      // Navigate to dashboard on success
      router.push("/dashboard");
    } catch (err: any) {
      // Handle errors and show in the toast notification
      setError(err.message);

      toast({
        title: "Sign Up Unsuccessful",
        description: `${email} could not sign up. Error: ${err.message}`, // Include the actual error message
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign Up for an Account
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
              />
            </div>
          </div>
          <div>
            <Button type="submit" className="w-full">
              Sign Up
            </Button>
          </div>
        </form>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a
            href="/sign-in"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Log In
          </a>
        </p>
      </div>
    </div>
  );
}
