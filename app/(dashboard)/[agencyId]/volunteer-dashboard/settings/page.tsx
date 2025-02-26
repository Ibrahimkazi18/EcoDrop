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

const SettingsPage = ({ params } : { params : { agencyId : string }}) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [volunteerId, setVolunteerId] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [existingUsernames, setExistingUsernames] = useState<string[]>([]);
  const { toast } = useToast();
  const { triggerSidebarRefresh } = useSidebar();
  const router = useRouter();

  const fetchUserData = async () => {
    if (auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setVolunteerId(data.volunteerId);

        const volunteerRef = doc(db, `agencies/${params.agencyId}/volunteers`, data.volunteerId);
        const volunteerSnap = await getDoc(volunteerRef);
        if (volunteerSnap.exists()) {
          const volunteerData = volunteerSnap.data();
          setUsername(volunteerData.username);
          setEmail(volunteerData.email);
          setAddress(volunteerData.address || "");
        }

        const fetchTransactions = async () => {
            if (auth.currentUser) {
              const transactionsRef = collection(db, "transactions");
              const q = query(transactionsRef, where("userId", "==", data.volunteerId));
              const querySnapshot = await getDocs(q);
              const transactionsData = querySnapshot.docs.map((doc) => doc.data());
              setTransactions(transactionsData);
            }
        };

        await fetchTransactions();
      }
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
      const volunteerRef = doc(db, `agencies/${params.agencyId}/volunteers`, volunteerId);

      if (username !== userData.username) {
        if (existingUsernames.includes(username)) {
          toast({ title: "Username already exists!", variant: "destructive" });
          return;
        }
        
        await updateDoc(userRef, { username });
        await updateDoc(volunteerRef, { username });
      }

      await updateDoc(volunteerRef, { username, address });
      toast({ title: "Profile updated successfully!" });
    }

    fetchUsernames();
    fetchUserData();
    triggerSidebarRefresh();
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
        <Button className="mt-4" onClick={handleSubmit}>Save Changes</Button>
      </div>
      {/* Account Security */}
      <div className="border p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Security</h2>
        <Button onClick={handleChangePassword}>Change Password</Button>
      </div>
      {/* Activity & History */}
      <div className="border p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Activity & History</h2>
        {transactions.map((tx, index) => (
          <div key={index} className="border-b py-2">
            <p>{tx.description}</p>
            <p className="text-sm text-gray-600">{tx.amount} points</p>
          </div>
        ))}
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