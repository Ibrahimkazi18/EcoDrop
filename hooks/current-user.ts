"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const CurrentUserId = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, get their UID
        setUserId(user.uid);
      } else {
        // No user is signed in
        setUserId(null);
      }
    });

    // Cleanup the subscription
    return () => unsubscribe();
  }, []);

  return userId;
};

export default CurrentUserId;
