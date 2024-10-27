"use client";

import { FormEvent, useEffect, useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase"; 
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input"; 
import { Label } from "@/components/ui/label"; 
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; 
import { useToast } from "@/hooks/use-toast"; 
import { Agency, Citizen, Role, User } from "@/types-db"; 
import { setDoc, doc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase"; 

export default function SignUp() {
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [role, setRole] = useState<Role | "">(""); 
  const [error, setError] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false); 
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); // Reset error before submission
    const date = new Date();
  
    try {
        // Check if the email is already in use with a different role
        const usersRef = collection(db, "users");
        const emailQuery = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(emailQuery);

        // If the query finds any documents, the email is already registered
        if (!querySnapshot.empty) {
            const existingUser = querySnapshot.docs[0].data(); // Get the first document data

            // Check if the existing user's role is different from the selected role
            if (existingUser.role !== role) {
                setError("This email is already registered under another role. Please use a different email.");
                return; // Exit the function
            }
        }

        // Check if a role is selected before proceeding
        if (!role) {
            setError("Please select a role before signing up.");
            return; // Exit the function
        }

        // Proceed to create the user with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid; // Get the user ID from the created user

        // Create user data object
        const userData: User = { id: userId, email, username: username, role, createdAt: date };

        // Store user data in Firestore
        await setDoc(doc(db, "users", userId), userData);

        if (role === "citizen") {
            const citizenData: Citizen = { id: userId, email, username: username, role, createdAt: date, points: 0, communityIds: [""] };
            await setDoc(doc(db, "citizens", userId), citizenData);
        } else if (role === "agency") {
            const agencyData: Agency = { id: userId, email, username: username, role, createdAt: date, agencyName: "", contactInfo: { phone: "", address: "" }, volunteers: [""], ratings: [] };
            await setDoc(doc(db, "agencies", userId), agencyData);
        }

        // Use sessionStorage only on client-side
        sessionStorage.setItem("user", "true");

        toast({
            title: "Sign Up Successful",
            description: `${email} signed up at ${date.toLocaleString()}`,
        });

        // Navigate to the dashboard based on role
        if (role === "agency") {
            router.push("/agency-dashboard");
        } else if (role === "citizen") {
            router.push("/citizen-dashboard");
        }

    } catch (err: any) {
        setError(err.message);
        toast({
            title: "Sign Up Unsuccessful",
            description: `${email} could not sign up. Error: ${err.message}`,
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
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="border-gray-900 p-[10px] w-full bg-white text-black text-base focus:border-[#0070f3] focus:outline-none"
              />
            </div>
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
            <div>
              <Label htmlFor="role">Select Role</Label>
              <Select onValueChange={(value) => setRole(value as Role)} required>
                <SelectTrigger className="w-full bg-black">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Roles</SelectLabel>
                    <SelectItem value="citizen">Citizen</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-4">
            <Button type="submit" className="w-full" variant={"outline"}>
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
