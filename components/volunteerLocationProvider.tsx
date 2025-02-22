"use client"

import { createContext, useContext, useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const VolunteerLocationContext = createContext<{ lat: number; lng: number } | null>(null);

export const VolunteerLocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [volunteerId, setVolunteerId] = useState<string | null>(null);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        console.log("User Id in useEffect: ", user.uid);

        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.role === "volunteer" && data.agencyId) {
            setAgencyId(data.agencyId);
            setVolunteerId(data.volunteerId);
          }
        }
      } else {
        setUserId(null);
        setAgencyId(null);
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  useEffect(() => {
    if (!volunteerId || !agencyId) return;

    const updateLocation = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setLocation({ lat: latitude, lng: longitude });

      // Update Firestore with the new location
      const volunteerRef = doc(db, `agencies/${agencyId}/volunteers`, volunteerId);
      const docSnap = await getDoc(volunteerRef);
      if (!docSnap.exists()) {
        console.error("Document does not exist:", volunteerRef.path);
        console.log("User Id", userId);
        console.log("Agency Id", agencyId);
        return; 
      }
      await updateDoc(volunteerRef, {
        location: { lat: latitude, lng: longitude },
        lastUpdated: new Date().toISOString(),
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error("Error getting location:", error);
    };

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // 1-minute cache
    };

    // Start tracking location
    const watchId = navigator.geolocation.watchPosition(updateLocation, handleError, geoOptions);

    return () => navigator.geolocation.clearWatch(watchId); 
  }, [userId, agencyId]);

  return (
    <VolunteerLocationContext.Provider value={location}>
      {children}
    </VolunteerLocationContext.Provider>
  );
};

export const useVolunteerLocation = () => useContext(VolunteerLocationContext);