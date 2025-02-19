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
import { Agency, Citizen, Role, User, Volunteer } from "@/types-db"; 
import { setDoc, doc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { FaEye, FaEyeSlash } from "react-icons/fa"

export default function SignUp() {
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [agencyId, setAgencyId] = useState<string>("");
  const [contact, setContact] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role | "">(""); 
  const [error, setError] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false); 
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  if (!isMounted) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const date = new Date();
  
    try {
        if(role === "volunteer"){
            const volunteerRef = collection(db, `agencies/${agencyId}/volunteers`);
            const emailQuery = query(volunteerRef, where("email", "==", email));
            const volunteerSnapshot = await getDocs(emailQuery);

            if(!volunteerSnapshot.empty){
              const volunteerDoc = volunteerSnapshot.docs[0];
              console.log(volunteerDoc.id)
              const volunteerDocRef = volunteerSnapshot.docs[0].ref;
              const volunteerData = volunteerSnapshot.docs[0].data() as Volunteer;

              if(volunteerData.username !== username){
                setError("Email is registered but the username does not match. Please check your details.");
                return;
              }

              await updateDoc(volunteerDocRef, { hasSetPermanentPassword: true, status: "available", points: 0, totalPoints: 0, level: 0, streak: 0, exp: 0, lastReportDate: null});
            }
            else {
              setError("This email is not registered under the specified agency. Contact the agency for access.");
              return;
            }
        }

        // Check if the email is already in use with a different role
        const usersRef = collection(db, "users");
        const emailQuery = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(emailQuery);

        // If the query finds any documents, the email is already registered
        if (!querySnapshot.empty) {
            const existingUser = querySnapshot.docs[0].data(); 

            // Check if the existing user's role is different from the selected role
            if (existingUser.role !== role) {
                setError("This email is already registered under another role. Please use a different email.");
                return; 
            }
        }

        if (!role) {
            setError("Please select a role before signing up.");
            return; 
        }

        const volunteerRef = collection(db, `agencies/${agencyId}/volunteers`);
        const q = query(volunteerRef, where("email", "==", email));
        const volunteerSnapshot = await getDocs(q);

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;

        if(!volunteerSnapshot.empty && role === "volunteer"){
          const volunteerDoc = volunteerSnapshot.docs[0];
          console.log(volunteerDoc.id)


          const userData: User = { id: userId, email, username: username, role, agencyId: agencyId, volunteerId: volunteerDoc.id,createdAt: date };

          await setDoc(doc(db, "users", userId), userData);
        }

        else {
          const userData: User = { id: userId, email, username: username, role, agencyId: agencyId, volunteerId: "",createdAt: date };
  
          await setDoc(doc(db, "users", userId), userData);
  
          if (role === "citizen") {
              const citizenData: Citizen = { id: userId, email, username: username, role, createdAt: date, points: 0, totalPoints: 0, level: 0, streak: 0, exp: 0, rank:"rookie",lastReportDate: null, communityIds: [""], badResponses: 0, reports: [] };
              await setDoc(doc(db, "citizens", userId), citizenData);
  
          } else if (role === "agency") {
              const agencyData: Agency = { id: userId, email, username: username, role, createdAt: date, contactInfo: { phone: contact, address: address }, volunteers: [""], ratings: [], badResults: 0, isBanned: false };
              await setDoc(doc(db, "agencies", userId), agencyData);
          } 
        }

        sessionStorage.setItem("user", "true");

        toast({
            title: "Sign Up Successful",
            description: `${email} signed up at ${date.toLocaleString()}`,
        });

        if (role === "agency") {
            router.push(`/agency-dashboard/${userId}`);
        } else if (role === "citizen") {
            router.push(`/citizen-dashboard/${userId}`);
        } else if (role === "volunteer") {
            router.push(`/${agencyId}/volunteer-dashboard`);
        }

    } catch (err: any) {
        setError(err.message);
        toast({
            title: "Sign Up Unsuccessful",
            description: `${email} could not sign up. Error: ${err.message}`,
            variant: "destructive"
        });
    }
};

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8" >
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
              <Label htmlFor="username" className="text-neutral-700">{role === "agency" ? "Agency Name" : "Username"}</Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === "agency" ? "Agency Name" : "Username"}
                className="border-gray-900 p-[10px] w-full bg-white text-black text-base focus:border-[#0070f3] focus:outline-none"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-neutral-700">Email address</Label>
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

            {role === "agency" ? 
              <div>
                <Label htmlFor="contact" className="text-neutral-700">Contact</Label>
                <Input
                  id="contact"
                  name="contact"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="10 Digit Phone Number"
                  className="border-gray-900 p-[10px] w-full bg-white text-black text-base focus:border-[#0070f3] focus:outline-none"
                />
              </div> : 
              (<></>)}

            {role === "agency" ? 
              <div>
                <Label htmlFor="address" className="text-neutral-700">Address</Label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  autoComplete="street-address"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Address"
                  className="border-gray-900 p-[10px] w-full bg-white text-black text-base focus:border-[#0070f3] focus:outline-none"
                />
              </div> : 
              (<></>)}
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

            {role === "volunteer" ? 
              <div>
                <Label htmlFor="agencyId" className="text-neutral-700">AgencyId</Label>
                <Input
                  id="agencyId"
                  name="agencyId"
                  type="agencyId"
                  autoComplete="current-agencyId"
                  required
                  value={agencyId}
                  onChange={(e) => setAgencyId(e.target.value)}
                  placeholder="AgencyId"
                  className="border-gray-900 p-[10px] w-full bg-white text-black text-base focus:border-[#0070f3] focus:outline-none"
                />
              </div> : 
              (<></>)}

            <div>
              <Label htmlFor="role" className="text-neutral-700">Select Role</Label>
              <Select onValueChange={(value) => setRole(value as Role)} required>
                <SelectTrigger className="w-full bg-black">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Roles</SelectLabel>
                    <SelectItem value="citizen">Citizen</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
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
