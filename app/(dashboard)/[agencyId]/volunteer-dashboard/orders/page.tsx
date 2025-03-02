"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc, getDoc, addDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { onAuthStateChanged } from "firebase/auth";
import { Input } from "@/components/ui/input";

interface Order {
  id: string;
  firstUser: string;
  endUser: string;
  listingId: string;
  pickupAddress: string;
  destinationAddress: string;
  paymentOption: string;
  volunteerId: string;
  agencyId: string;
  price: number;
  status: "assigned" | "picked_up" | "delivered" | "completed" | "cancelled";
  otp?: string; // OTP for pickup
  otp2?: string; // OTP for delivery
  createdAt: Date;
}

const OrdersPage = ({ params }: { params: { agencyId: string } }) => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [otp, setOtp] = useState("");
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showDeviceVerification, setShowDeviceVerification] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const { toast } = useToast();

  // Fetch orders for the volunteer
  const fetchOrders = async (userId: string) => {
    try {
      if (!userId) {
        console.error("User ID is not available.");
        return;
      }

      // Fetch volunteer ID from the users collection
      const usersRef = collection(db, "users");
      const userQuery = query(usersRef, where("id", "==", userId));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        console.error("No user found with the provided ID.");
        return;
      }

      const userData = userSnapshot.docs[0].data();
      const volunteerId = userData.volunteerId;

      if (!volunteerId) {
        console.error("Volunteer ID not found for the user.");
        return;
      }

      // Fetch orders assigned to the volunteer
      const ordersRef = collection(db, "orders");
      const ordersQuery = query(ordersRef, where("volunteerId", "==", volunteerId));
      const ordersSnapshot = await getDocs(ordersQuery);

      if (ordersSnapshot.empty) {
        console.log("No orders found for the volunteer.");
        setOrders([]);
        return;
      }

      const ordersData = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Order[];

      // Filter out cancelled orders
      const activeOrders = ordersData.filter((order) => order.status !== "cancelled");
      setOrders(activeOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Verify OTP and update order status
  const handleVerifyOTP = async (order: Order) => {
    if (!otp) {
      toast({
        title: "OTP Required",
        description: "Please enter the OTP.",
        variant: "destructive",
      });
      return;
    }

    // Check the correct OTP based on the current stage
    const correctOTP = order.status === "assigned" ? order.otp : order.otp2;

    if (otp !== correctOTP) {
      toast({
        title: "Invalid OTP",
        description: "The OTP you entered is incorrect.",
        variant: "destructive",
      });
      return;
    }

    try {
      const orderRef = doc(db, "orders", order.id);
      const newStatus = order.status === "assigned" ? "picked_up" : "completed";
      await updateDoc(orderRef, { status: newStatus });

      toast({
        title: "OTP Verified",
        description: `Device ${order.status === "assigned" ? "picked up" : "delivered"} successfully.`,
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: newStatus } : o
        )
      );

      if (order.status === "assigned") {
        setShowDeviceVerification(true); // Show device verification after pickup
      } else if (order.status === "picked_up") {
        setShowPaymentConfirmation(true); // Show payment confirmation after delivery
      }

      setShowOTPModal(false);
      setOtp("");
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast({
        title: "Verification Failed",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle device verification
  const handleDeviceVerification = async (order: Order, isDeviceFine: boolean) => {
    try {
      const orderRef = doc(db, "orders", order.id);

      if (isDeviceFine) {
        // Proceed to delivery
        await updateDoc(orderRef, { status: "picked_up" });
        toast({
          title: "Device Verified",
          description: "The device is in good condition. Proceeding to delivery.",
        });
      } else {
        await updateDoc(orderRef, { status: "cancelled" });

        const volunteerRef = doc(db, `agencies/${params.agencyId}/volunteers`, order.volunteerId);
        await updateDoc(volunteerRef, { status: "available" });

        await createNotification(order.firstUser, "The order has been cancelled due to device issues.", "cancelled");
        await createNotification(order.endUser, "The order has been cancelled due to device issues.", "cancelled");

        toast({
          title: "Order Cancelled",
          description: "The device is not in good condition. The order has been cancelled.",
          variant: "destructive",
        });

        // Remove the cancelled order from the list
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
      }

      setShowDeviceVerification(false);
    } catch (error) {
      console.error("Error handling device verification:", error);
      toast({
        title: "Verification Failed",
        description: "Failed to verify the device. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentConfirmation = async (order: Order) => {
    try {
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, { status: "completed" });

      const volunteerRef = doc(db, `agencies/${params.agencyId}/volunteers`, order.volunteerId);
      await updateDoc(volunteerRef, { status: "available" });

      await createNotification(order.firstUser, "The order has been completed successfully.", "completed");
      await createNotification(order.endUser, "The order has been completed successfully.", "completed");

      toast({
        title: "Payment Confirmed",
        description: "The order has been completed successfully.",
      });

      setShowPaymentConfirmation(false);

      // Refresh the orders list
      fetchOrders(currentUser || "");
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast({
        title: "Payment Failed",
        description: "Failed to confirm payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Create a notification
  const createNotification = async (userId: string, message: string, type: string) => {
    try {
      const notificationsRef = collection(db, "notifications");
      await addDoc(notificationsRef, {
        userId,
        message,
        type,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  // OTP Modal
  const OTPModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Enter OTP</h2>
        <Input
          id="otp"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full p-2 border-white rounded-lg mb-4 border-2"
        />
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setShowOTPModal(false)}>
            Cancel
          </Button>
          <Button onClick={() => handleVerifyOTP(selectedOrder!)}>Verify</Button>
        </div>
      </div>
    </div>
  );

  // Device Verification Modal
  const DeviceVerificationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Device Verification</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Is the device in good condition?
        </p>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setShowDeviceVerification(false)}>
            Cancel
          </Button>
          <Button onClick={() => handleDeviceVerification(selectedOrder!, false)}>
            Not Fine
          </Button>
          <Button onClick={() => handleDeviceVerification(selectedOrder!, true)}>
            Fine
          </Button>
        </div>
      </div>
    </div>
  );

  // Payment Confirmation Modal
  const PaymentConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Payment Confirmation</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Confirm that the payment has been received.
        </p>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setShowPaymentConfirmation(false)}>
            Cancel
          </Button>
          <Button onClick={() => handlePaymentConfirmation(selectedOrder!)}>
            Confirm Payment
          </Button>
        </div>
      </div>
    </div>
  );

  // Fetch orders when the user logs in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user.uid);
        fetchOrders(user.uid);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:px-2 max-w-[22rem] sm:max-w-md md:max-w-lg lg:max-w-3xl xl:max-w-5xl mx-auto">
      <h1 className="font-semibold text-2xl sm:text-3xl mb-4 sm:mb-6 dark:text-gray-100 text-gray-800">
        Your Orders
      </h1>
      <div className="space-y-4">
        {orders.length === 0 && <div className="p-4">No Orders Available</div>}

        {orders.map((order) => (
          <div key={order.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold">Order ID: {order.id}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Status: {order.status}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pickup: {order.pickupAddress}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Delivery: {order.destinationAddress}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Payment: {order.paymentOption}</p>

            {(order.status === "assigned" || order.status === "picked_up") && (
              <Button onClick={() => { setSelectedOrder(order); setShowOTPModal(true); }} className="mt-2 w-full">
                Verify OTP
              </Button>
            )}
          </div>
        ))}
      </div>

      {showOTPModal && <OTPModal />}
      {showDeviceVerification && <DeviceVerificationModal />}
      {showPaymentConfirmation && <PaymentConfirmationModal />}
    </div>
  );
};

export default OrdersPage;