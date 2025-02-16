"use client"

import { Button } from "@/components/ui/button"
import { Coins, Gift, Loader } from "lucide-react"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const RewardsPage = () => {
  const [points, setPoints] = useState<number | null>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const { toast } = useToast();

  useEffect(() => {
      const fetchCitizenData = async () => {
        setLoading(true);
        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            const citizenDocRef = doc(db, "citizens", currentUser.uid);
            const citizenDoc = await getDoc(citizenDocRef);
  
            if (citizenDoc.exists()) {
              const citizenData = citizenDoc.data();
              setPoints(citizenData.points || 0);
              console.log(citizenData.points)
            } else {
              console.error("Citizen document does not exist.");
            }
  
          } catch (error) {
            console.error("Error fetching citizen or notification data:", error);
          }
        }
      };
  
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          fetchCitizenData();
          setLoading(false);
        } else {
          setPoints(null);
        }
      });
  
      return () => unsubscribe();
    }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8"/>
      </div>
    )
  }

  return (
    <div className="p-8 w-full mx-auto">   
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold mb-6 ml-0">Rewards</h1>

        <div className="p-6 rounded-xl flex flex-col shadow-lg dark:shadow-slate-900 justify-between h-full border-l-4 border-green-500 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Reward Balance
          </h2>

          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center">
              <Coins className="w-10 h-10 mr-3 text-green-500"/>

              <div>
                <span className="text-4xl font-bold text-green-500">
                  {points}
                </span>
                <p className="text-sm">Redeemable Points</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RewardsPage