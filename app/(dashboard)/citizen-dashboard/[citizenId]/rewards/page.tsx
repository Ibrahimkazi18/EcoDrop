"use client"

import { Button } from "@/components/ui/button"
import { Coins, Loader } from "lucide-react"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { Rewards } from "@/types-db";
import { Input } from "@/components/ui/input";
import Modal from "@/components/modal";
import { useNavbar } from "@/app/context/navbarContext";
import { createTransaction } from "@/hooks/create-report";

const RewardsPage = () => {
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [rewards, setRewards] = useState<Rewards[]>([]);
  const [address, setAddress] = useState<string | null>("");
  const [selectedReward, setSelectedReward] = useState<Rewards | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { triggerNavbarRefresh } = useNavbar();

  const { toast } = useToast();

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
          setAddress(citizenData.address || "");
          console.log(citizenData.points)
        } else {
          console.error("Citizen document does not exist.");
        }

      } catch (error) {
        console.error("Error fetching citizen or notification data:", error);
      }
    }
  };

  const fetchRewards = async () => {
    try {
      const rewardsCollection = collection(db, "rewards");
      const rewardsSnapshot = await getDocs(rewardsCollection);
      const rewardsList = rewardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data()} as Rewards));
      setRewards(rewardsList);
    } catch (error) {
      console.error("Error fetching rewards data:", error);
    }
  };

  useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          fetchCitizenData();
          fetchRewards();
          setLoading(false);
        } else {
          setPoints(0);
        }
      });
  
      return () => unsubscribe();
    }, []);

    const handleRedeem = (reward: any) => {
      setSelectedReward(reward);
      setModalOpen(true);
    };

    const confirmRedemption = async () => {
      if (!selectedReward) return;
      if (!address) {
        toast({
          title: "Address Required",
          description: "Please enter your address to redeem the reward.",
          variant: "destructive",
        })
        return
      };
      if (points === null || points < selectedReward.pointsRequired) return;
  
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const citizenRef = doc(db, "citizens", currentUser.uid);
          await updateDoc(citizenRef, {
            points: points - selectedReward.pointsRequired,
            address: address,
          });
          triggerNavbarRefresh();
          toast({
            title: "Redemption Successful",
            description: "Your reward has been redeemed successfully.",
            variant: "default",
          })
          await createTransaction(currentUser.uid, 'redeemed', selectedReward.pointsRequired, `Redeemed ${selectedReward.name}`);
          setPoints(points - selectedReward.pointsRequired);
          setAddress(address);
          setModalOpen(false);
        } catch (error) {
          console.error("Error updating data:", error);
        }
      }
    };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8"/>
      </div>
    )
  }

  return (
    // <div className="p-4 sm:p-6 md:p-8 w-full mx-auto">   
  <div className="p-4 sm:p-6 md:p-8 w-full mx-auto">   
  <div className="mx-auto max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-5xl">
    <h1 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6">Rewards</h1>

    <div className="p-4 sm:p-6 rounded-lg flex flex-col shadow-md dark:shadow-slate-900 justify-between h-full border-l-4 border-green-500 mb-6 sm:mb-8">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Reward Balance</h2>
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center">
          <Coins className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-3 text-green-500"/>
          <div>
            <span className="text-3xl sm:text-4xl font-bold text-green-500">
              {points}
            </span>
            <p className="text-xs sm:text-sm">Redeemable Points</p>
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {rewards.map(reward => (
        <div key={reward.id} className="border rounded-lg shadow-sm p-3 sm:p-4 flex flex-col">
          <img 
            src={reward.imageUrl} 
            alt={reward.name} 
            className="w-full h-32 sm:h-40 object-cover mb-3 sm:mb-4 rounded-lg" 
          />
          <h3 className="text-base sm:text-lg font-semibold">{reward.name}</h3>
          <p className="text-green-600 font-bold mt-1 sm:mt-2">{reward.pointsRequired} Points</p>
          <Button 
            className="mt-1 sm:mt-2 text-sm sm:text-base" 
            disabled={points < reward.pointsRequired}
            onClick={() => handleRedeem(reward)}
          >
            Redeem
          </Button>
        </div>
      ))}
    </div>
  </div>
  
      {/* Modal for Redemption Confirmation */}
      {modalOpen && selectedReward && (
        <Modal 
          onClose={() => setModalOpen(false)} 
          title="Confirm Redemption" 
          description="Please confirm your redemption." 
          isOpen={modalOpen}
        >
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start">
              <img 
                src={selectedReward.imageUrl} 
                alt={selectedReward.name} 
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover mb-4 sm:mb-0 sm:mr-4 rounded-lg" 
              />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-center sm:text-left">{selectedReward.name}</h2>
              </div>
            </div>
            <div className="mt-4">
              <label className="font-semibold">Delivery Address:</label>
              <Input
                value={address || ""}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address"
                required
                className="w-full mt-1"
              />
            </div>
            <div className="mt-4 border-t pt-4">
              <p className="flex items-center justify-between">
                <span>Your Points:</span> <span>{points}</span>
              </p>
              <p className="flex items-center justify-between">
                <span>Points Required:</span> <span>{selectedReward.pointsRequired}</span>
              </p>
              <p className="flex items-center justify-between">
                <span>Remaining Points:</span> <span>{points - selectedReward.pointsRequired}</span>
              </p>
            </div>
            <Button 
              onClick={confirmRedemption} 
              className="mt-4 w-full bg-green-500 text-white font-bold hover:bg-white hover:text-green-500"
            >
              Redeem
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default RewardsPage