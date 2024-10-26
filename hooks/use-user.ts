import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase"; // Import your Firebase auth
import { doc, getDoc } from "firebase/firestore"; // Firestore methods
import { db } from "@/lib/firebase"; // Import your Firestore instance
import { onAuthStateChanged } from "firebase/auth"; // For observing auth state
import { User } from "firebase/auth"; // User type from Firebase

export interface UserProfile {
  uid: string;
  displayName?: string; // The display name of the user from Google
  email?: string;
  // Add other fields as needed
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // To handle loading state
  const [error, setError] = useState<string | null>(null); // To handle errors

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Get user document from Firestore
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          // Extract display name from Google user info
          const displayName = currentUser.displayName; // Get name from the authenticated user object

          if (userDoc.exists()) {
            // Set user state with user data from Firestore and display name from Google
            setUser({
              uid: currentUser.uid,
              displayName: displayName || userDoc.data().displayName, // Fallback to Firestore name if necessary
              email: currentUser.email,
              ...userDoc.data(), // Include other user data from Firestore if needed
            } as UserProfile);
          } else {
            setUser({ uid: currentUser.uid, displayName: displayName ? displayName : "", email: currentUser.email ?  currentUser.email : ""});
          }
        } catch (error) {
          setError("Failed to fetch user data.");
          console.error("Error fetching user data:", error);
        }
      } else {
        setUser(null);
      }
      setLoading(false); // Stop loading when finished
    });

    return () => unsubscribeAuth(); // Cleanup listener on unmount
  }, []);

  return { user, loading, error }; // Return user, loading state, and any errors
}
