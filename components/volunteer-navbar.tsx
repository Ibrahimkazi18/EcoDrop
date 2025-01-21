import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"; // Import ShadCN Button
import { Input } from "@/components/ui/input"; // Import ShadCN Input
import { Bell, Coins, Leaf, LogOut, Search } from "lucide-react"; // Import icons from lucide-react
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { Notification, User } from "@/types-db";
import { auth, db } from "@/lib/firebase";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";

export default function VolunteerNavbar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const pathName = usePathname() as string;
  const parts = pathName.split("/");
  const agencyId = parts[1];

  useEffect(() => {
    const fetchVolunteerNotification = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.data() as User;

          const volunteerDocRef = doc(db, `agencies/${agencyId}/volunteers`, userData.volunteerId ? userData.volunteerId : "");
          const volunteerDoc = await getDoc(volunteerDocRef);

          if (volunteerDoc.exists()) {
            const notificationsRef = collection(db, "notifications");
            const q = query(notificationsRef, where("userId", "==", volunteerDoc.id));
            const notificationsSnap = await getDocs(q);

            const notificationsData = notificationsSnap.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Notification[];

            setNotifications(notificationsData);
          } else {
            console.error("volunteer document does not exist.");
          }
        } catch (error) {
          console.error("Error fetching citizen or notification data:", error);
        }
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchVolunteerNotification();
      } else {
        setNotifications([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    sessionStorage.removeItem("user");
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
    <nav className={`flex items-center justify-between p-4 dark:shadow-slate-900 shadow-md ${isOpen ? `w-[78rem]` : `w-[92.8rem]`} sticky top-0 z-50`}>
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
          <span className="text-green-600">0</span> {/* Replace with dynamic points */}
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="h-5 w-5" />
          Log Out
        </Button>
      </div>
    </nav>
  );
}
