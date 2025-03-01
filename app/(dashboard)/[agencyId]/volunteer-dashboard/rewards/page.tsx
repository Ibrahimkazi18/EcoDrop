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

const RewardsPage = ({params} : { params : { agencyId : string }}) => {
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [rewards, setRewards] = useState<Rewards[]>([]);
  const [address, setAddress] = useState<string | null>("");
  const [volunteerId, setVolunteerId] = useState<string>("");
  const [selectedReward, setSelectedReward] = useState<Rewards | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { triggerNavbarRefresh } = useNavbar();

  const { toast } = useToast();

  const fetchVolunteerData = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if(!userDoc.exists()) return;
        const userData = userDoc.data();

        const volunteerDocRef = doc(db, `agencies/${params.agencyId}/volunteers`, userData.volunteerId);
        setVolunteerId(userData.volunteerId);
        const volunteerDoc = await getDoc(volunteerDocRef);

        if (volunteerDoc.exists()) {
          const volunteerData = volunteerDoc.data();
          setPoints(volunteerData.points || 0);
          setAddress(volunteerData.address || "");
          console.log(volunteerData.points)
        } else {
          console.error("volunteer document does not exist.");
        }

      } catch (error) {
        console.error("Error fetching volunteer or notification data:", error);
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
          fetchVolunteerData();
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
          const volunteerRef = doc(db, `agencies/${params.agencyId}/volunteers`, volunteerId);
          await updateDoc(volunteerRef, {
            points: points - selectedReward.pointsRequired,
            address: address,
          });
          triggerNavbarRefresh();
          toast({
            title: "Redemption Successful",
            description: "Your reward has been redeemed successfully.",
            variant: "default",
          })
          await createTransaction(volunteerId, 'redeemed', selectedReward.pointsRequired, `Redeemed ${selectedReward.name}`);
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
    <div className="p-4 sm:p-6 md:p-8 w-full mx-auto">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6">Rewards</h1>
  
        {/* Reward Balance Card */}
        <div className="p-4 sm:p-6 rounded-xl flex flex-col shadow-lg dark:shadow-slate-900 justify-between h-full border-l-4 border-green-500 mb-6 sm:mb-8">
          <h2 className="text-xl font-semibold mb-4">Reward Balance</h2>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center">
              <Coins className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-3 text-green-500" />
              <div>
                <span className="text-3xl sm:text-4xl font-bold text-green-500">
                  {points}
                </span>
                <p className="text-sm">Redeemable Points</p>
              </div>
            </div>
          </div>
        </div>
  
        {/* Rewards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {rewards.map((reward) => (
            <div key={reward.id} className="border rounded-lg shadow-md p-4 flex flex-col">
              <img
                src={reward.imageUrl}
                alt={reward.name}
                className="w-full h-40 object-cover mb-4 rounded-lg"
              />
              <h3 className="text-lg font-semibold">{reward.name}</h3>
              <p className="text-green-600 font-bold mt-2">{reward.pointsRequired} Points</p>
              <Button
                className="mt-1"
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
          <div className="p-6">
            <div className="flex">
              <img
                src={selectedReward.imageUrl}
                alt={selectedReward.name}
                className="w-24 h-24 object-cover mr-4"
              />
              <div>
                <h2 className="text-xl font-bold">{selectedReward.name}</h2>
              </div>
            </div>
            <div className="mt-4">
              <label className="font-semibold">Delivery Address:</label>
              <Input
                value={address || ""}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address"
                required
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