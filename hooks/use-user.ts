import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth } from "@/lib/firebase"; // Adjust the path to your Firebase config
import { db } from "@/lib/firebase"; // Your Firestore instance
import { User } from "@/types-db"; // Adjust this import according to your User 
import { User as FirebaseUser } from "firebase/auth";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Fetch user data from Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          const customUser: User = {
            id: firebaseUser.uid,
            username: userData.username || "", // Fetch username
            role: userData.role || "", // Fetch role
            email: firebaseUser.email || "",
            createdAt: userData.createdAt ? userData.createdAt.toDate() : null, // Fetch createdAt, convert if necessary
          };
          setUser(customUser);
        } else {
          setUser(null); // User document does not exist
        }
      } else {
        setUser(null); // User is not logged in
      }
      setLoading(false); // Update loading state
    });

    return () => unsubscribe();

    const fetchUserProfile = async () => {
      
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error("User is not authenticated.");
        return;
      }

      const userDocRef = doc(db, "users", userId);
      const userDocSnapshot = await getDoc(userDocRef);
    
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data() as User;
        console.log("User profile data:", userData);

        setUser(userData)
        setLoading(false);
      } else {
        console.error("No user profile found.");
      }
    };
    fetchUserProfile();

  }, []);

  return { user, loading };
}
