"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updatePassword } from "firebase/auth";
import { useSidebar } from "@/app/context/sidebarContext";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useRouter } from "next/navigation";

const SettingsPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [existingUsernames, setExistingUsernames] = useState<string[]>([]);
  const { toast } = useToast();
  const { triggerSidebarRefresh } = useSidebar();
  const router = useRouter();

  const fetchUserData = async () => {
    if (auth.currentUser) {
      const userRef = doc(db, "agencies", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUsername(data.username);
        setEmail(data.email);
        setAddress(data.contactInfo.address || "");
        setPhone(data.contactInfo.phone || "");
      }
    }
  };
  
  const fetchTransactions = async () => {
    if (auth.currentUser) {
      const transactionsRef = collection(db, "transactions");
      const q = query(transactionsRef, where("userId", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const transactionsData = querySnapshot.docs.map((doc) => doc.data());
      setTransactions(transactionsData);
    }
  };

  const fetchUsernames = async () => {
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    const usernames = querySnapshot.docs.map(doc => doc.data().username);
    setExistingUsernames(usernames);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
            fetchUserData();
            fetchTransactions();
            fetchUsernames();
        }
    });

    return () => unsubscribe();
  }, []);

const handleChangePassword = async () => {
  if (!auth.currentUser) return;

  
  try {
    // Prompt for current password
    const currentPassword = prompt("Enter your current password:");
    if (!currentPassword) return;
    
    const newPassword = prompt("Enter new password:");
    if (!newPassword) return;

    const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);

    // Re-authenticate user
    await reauthenticateWithCredential(auth.currentUser, credential);

    await updatePassword(auth.currentUser, newPassword);

    toast({ title: "Password updated successfully!" });
  } catch (error: any) {
    toast({ title: "Error updating password", description: error.message, variant: "destructive" });
  }
};


const handleSubmit = async () => {
    if (auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
      const userData = userSnap.data();
      const agencyRef = doc(db, "agencies", auth.currentUser.uid);
  
      if (username !== userData.username) {
        if (existingUsernames.includes(username)) {
          toast({ title: "Username already exists!", variant: "destructive" });
          return;
        }
        
        await updateDoc(userRef, { username });
        await updateDoc(agencyRef, { username });
      }
  
      if (phone.length !== 10) {
        toast({ title: "Phone number must be 10 digits long!", variant: "destructive" });
        return;
      }
  
      await updateDoc(agencyRef, {
        "contactInfo.address": address,
        "contactInfo.phone": phone,
      });
  
      toast({ title: "Profile updated successfully!" });
  
      fetchUsernames();
      fetchUserData();
      triggerSidebarRefresh();
    }
  };
  
  const handleSignOut = async () => {
    await auth.signOut();
    router.push("/sign-in");
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6">Settings</h1>
      {/* Profile Information */}
      <div className="border p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
        <Input className="mt-2" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} name="Username"/>
        <Input className="mt-2" placeholder="Email" value={email} disabled name="Email"/>
        <Input className="mt-2" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} name="Address"/>
        <Input className="mt-2" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} name="Phone"/>
        <Button className="mt-4" onClick={handleSubmit}>Save Changes</Button>
      </div>
      {/* Account Security */}
      <div className="border p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Security</h2>
        <Button onClick={handleChangePassword}>Change Password</Button>
      </div>
      {/* Account Management */}
      <div className="border p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Management</h2>
        <Button onClick={handleSignOut}>Log Out</Button>
      </div>
    </div>
  );
};

export default SettingsPage;