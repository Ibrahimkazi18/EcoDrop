"use client";

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, updateDoc, doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/confirmationModal";
import { useToast } from "@/hooks/use-toast";

const ResellListings = ({ params }: { params: { citizenId: string } }) => {
  const [listings, setListings] = useState<any[]>([]);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const { toast } = useToast();

  const fetchListings = async () => {
    const resellRef = collection(db, "resale");
    const q = query(resellRef, where("status", "==", "listed"));
    const querySnapshot = await getDocs(q);
    const listingsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setListings(listingsData);
  };

  const fetchCurrentOrder = async () => {
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("firstUser", "==", params.citizenId) // Fetch orders where the citizen is the firstUser
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const orderData = querySnapshot.docs[0].data();
      setCurrentOrder({ id: querySnapshot.docs[0].id, ...orderData });
    } else {
      // If no order is found for firstUser, check for endUserId
      const q2 = query(ordersRef, where("endUserId", "==", params.citizenId));
      const querySnapshot2 = await getDocs(q2);

      if (!querySnapshot2.empty) {
        const orderData = querySnapshot2.docs[0].data();
        setCurrentOrder({ id: querySnapshot2.docs[0].id, ...orderData });
      } else {
        setCurrentOrder(null);
      }
    }
  };

  useEffect(() => {
    fetchListings();
    fetchCurrentOrder();
  }, [params.citizenId]);

  const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleOrderConfirmation = async (address: string, paymentOption: string) => {
    try {
      const volunteer = await assignVolunteer();

      if (!volunteer) {
        toast({
          title: "Order Not Confirmed",
          description: "No volunteers available at the moment. Please try again later.",
          variant: "destructive",
        });
        return;
      }

      const otp = generateOTP(); 
      const otp2 = generateOTP(); 

      const order = {
        listingId: selectedListing.id,
        pickupAddress: selectedListing.address,
        destinationAddress: address,
        paymentOption,
        firstUser: selectedListing.userId, // Citizen who raised the report
        endUserId: params.citizenId, // Citizen who bought the device
        volunteerId: volunteer.id,
        agencyId: volunteer.agencyId,
        price: selectedListing.price,
        status: "assigned",
        otp, // OTP for pickup
        otp2, // OTP for delivery
        createdAt: new Date(),
      };

      const ordersRef = collection(db, "orders");
      await addDoc(ordersRef, order);

      const listingRef = doc(db, "resale", selectedListing.id);
      await updateDoc(listingRef, { status: "sold" });

      toast({
        title: "Order Confirmed",
        description: "A volunteer has been assigned to deliver your order.",
      });
      setSelectedListing(null);
      fetchListings();
      fetchCurrentOrder(); // Refresh the current order after confirmation
    } catch (error) {
      console.error("Error confirming order:", error);
      toast({
        title: "Order Failed",
        description: "Failed to confirm order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const assignVolunteer = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "volunteer"));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("No volunteers found in the users collection.");
        return null;
      }

      for (const userDoc of querySnapshot.docs) {
        const userData = userDoc.data();
        const agencyId = userData.agencyId;

        if (!agencyId) {
          console.log(`Volunteer ${userDoc.id} has no associated agencyId.`);
          continue;
        }

        const volunteerRef = doc(db, `agencies/${agencyId}/volunteers`, userData.volunteerId);
        const volunteerDoc = await getDoc(volunteerRef);

        if (!volunteerDoc.exists()) {
          console.log(`Volunteer ${userData.volunteerId} not found in agency ${agencyId}.`);
          continue;
        }

        const volunteerData = volunteerDoc.data();
        console.log("v, ", volunteerData);
        if (volunteerData.status === "available") {
          await updateDoc(volunteerRef, { status: "assigned" });
          console.log(`Assigned volunteer: ${userData.volunteerId} from agency ${agencyId}`);
          return {
            id: userData.volunteerId,
            agencyId,
            ...volunteerData,
          };
        }
      }

      console.log("No available volunteers found.");
      return null;
    } catch (error) {
      console.error("Error assigning volunteer:", error);
      return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:px-2 max-w-[22rem] sm:max-w-md md:max-w-lg lg:max-w-3xl xl:max-w-5xl mx-auto">
      <h1 className="font-semibold text-2xl sm:text-3xl mb-4 sm:mb-6 dark:text-gray-100 text-gray-800">
        Resell Listings
      </h1>

      {/* Display Current Order */}
      {currentOrder && (
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Current Order</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Order ID: {currentOrder.id}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Status: {currentOrder.status}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Pickup Address: {currentOrder.pickupAddress}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Delivery Address: {currentOrder.destinationAddress}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Payment Option: {currentOrder.paymentOption}</p>
          {/* Show OTP based on user role */}
          {currentOrder.firstUser === params.citizenId && (
            <p className="text-sm text-gray-600 dark:text-gray-400">OTP for Pickup: {currentOrder.otp}</p>
          )}
          {currentOrder.endUserId === params.citizenId && (
            <p className="text-sm text-gray-600 dark:text-gray-400">OTP for Delivery: {currentOrder.otp2}</p>
          )}
        </div>
      )}

      {/* Display Resell Listings */}
      {listings.length === 0 && (
        <p className="text-gray-600 dark:text-gray-400">No listings available at the moment.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <div key={listing.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <img src={listing.imageUrl} alt={listing.name} className="w-full h-48 object-cover rounded-lg" />
            <h2 className="text-lg font-semibold mt-2">Model: {listing.model}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Years Old: {listing.yearsOld}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Condition: {listing.condition}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Price: ₹{listing.price}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Location: {listing.address}</p>
            <Button
              onClick={() => setSelectedListing(listing)}
              className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Buy
            </Button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {selectedListing && (
        <ConfirmationModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onConfirm={handleOrderConfirmation}
        />
      )}
    </div>
  );
};

export default ResellListings;