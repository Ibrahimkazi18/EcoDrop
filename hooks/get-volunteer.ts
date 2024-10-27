import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth } from "@/lib/firebase"; // Adjust the path to your Firebase config
import { db } from "@/lib/firebase"; // Your Firestore instance
import { Volunteer } from "@/types-db"; // Adjust this import according to your User type

export function getVolunteer() {
  const [user, setUser] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(db, "volunteers", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUser(userDoc.data() as Volunteer);
        } else {
          console.error("No such document!");
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  return { user, loading };
}
