"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Coins, Leaf, LogOut, Search } from "lucide-react";
import { auth } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Notification } from "@/types-db";
import { SidebarTrigger } from "./ui/sidebar";

export default function CitizenNavbar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [citizenPoints, setCitizenPoints] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchCitizenData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const citizenDocRef = doc(db, "citizens", currentUser.uid);
          const citizenDoc = await getDoc(citizenDocRef);

          if (citizenDoc.exists()) {
            const citizenData = citizenDoc.data();
            setCitizenPoints(citizenData.points || 0);
          } else {
            console.error("Citizen document does not exist.");
          }

          // Fetch Notifications
          const notificationsRef = collection(db, "notifications");
          const q = query(notificationsRef, where("userId", "==", currentUser.uid));
          const notificationsSnap = await getDocs(q);

          const notificationsData = notificationsSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Notification[];
          setNotifications(notificationsData);
        } catch (error) {
          console.error("Error fetching citizen or notification data:", error);
        }
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchCitizenData();
      } else {
        setCitizenPoints(null);
        setNotifications([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push("/sign-in");
  };

  const toggle = () => {
    setIsOpen((prev) => !prev);
  };

  const toggleDropdown = () => {
    if (notifications.some((n) => !n.isRead)) {
      setIsDropdownOpen((prev) => !prev);
    }
  };

  const handleNotificationClick = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, { isRead: true });

      // Update state after marking as read
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error("Error updating notification:", error);
    }
  };

  return (
    <nav
      className={`flex items-center justify-between p-4 dark:shadow-slate-900 shadow-md ${
        isOpen ? `w-[78rem]` : `w-[92.8rem]`
      } sticky top-0 z-50`}
    >
      <SidebarTrigger onClick={toggle}/>
      <div className="flex items-center">
        <Leaf color="green" />
        <span className="ml-2 text-xl font-bold text-green-600">EcoDrop</span>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center border border-gray-300 rounded-md">
          <Input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-none"
          />
          <Search className="h-5 w-5 text-gray-500 mr-4" />
        </div>
        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-gray-500" />
            {notifications.some((n) => !n.isRead) && (
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-600 rounded-full" />
            )}
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
              <ul className="max-h-64 overflow-y-auto">
                {notifications
                  .filter((n) => !n.isRead)
                  .map((notification) => (
                    <li
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.id)}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {notification.message}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Click to mark as read...
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <Coins color="green" />
          <span className="text-green-600">{citizenPoints ?? "Loading..."}</span>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="h-5 w-5" />
          Log Out
        </Button>
      </div>
    </nav>
  );
}