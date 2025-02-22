import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"; 
import { Bell, Coins, Leaf, LogOut } from "lucide-react"; 
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { Notification, User } from "@/types-db";
import { auth, db } from "@/lib/firebase";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { getUserRank } from "@/hooks/levelMainter";

export default function VolunteerNavbar() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [citizenPoints, setCitizenPoints] = useState<number | null>(null);
  const [exp, setExp] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [rank, setRank] = useState<"rookie" | "pro" | "master" | "expert">("rookie");

  const pathName = usePathname() as string;
  const parts = pathName.split("/");
  const agencyId = parts[1];

  const getNextLevelExp = (level: number) => Math.floor(100 * Math.pow(level, 1.5)); 
  const nextLevelExp = getNextLevelExp(level);
  const progress = (exp / nextLevelExp) * 100;

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

            try {
                const volunteerData = volunteerDoc.data();
                setCitizenPoints(volunteerData.points || 0);
                setExp(volunteerData.exp || 0);
                setLevel(volunteerData.level || 1);
                const getRank = getUserRank(level);
                setRank(getRank);
            } catch (error) {
              console.error("Error fetching volunteer points:", error);
            }

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
        setCitizenPoints(null);
        setExp(0);
        setLevel(1);
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
    <nav className={`flex items-center justify-between p-4 dark:shadow-slate-900 shadow-md ${isOpen ? `w-[87.5rem]` : `w-[102.5rem]`} sticky top-0 z-50`}>
      <SidebarTrigger onClick={toggle}/>
      <div className="flex items-center">
        <Leaf color="green" />
        <span className="ml-2 text-xl font-bold text-green-600">EcoDrop</span>
      </div>
      <div className="flex items-center space-x-4">
        {/* EXP Progress Bar */}
        <div className="relative flex items-center">
          <div className="relative group">
            <img 
              src={`/${rank}.png`}
              alt="Badge"
              className="w-6 h-6 mr-2"
            />

            <div className="capitalize absolute left-1/2 transform -translate-x-1/2 top-full mt-2 hidden group-hover:block w-max px-3 py-1 bg-black text-white text-xs rounded-md shadow-lg z-10">
                {rank}
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
            </div>
          </div>

            <div className="relative group">
              {/* EXP Progress Bar */}
              <div className="relative w-40 h-5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>

                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">
                  Level {level}
                </span>
              </div>

              {/* Tooltip (EXP / Total EXP) */}
              <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 hidden group-hover:block w-max px-3 py-1 bg-black text-white text-xs rounded-md shadow-lg z-10">
                {exp} / {nextLevelExp} EXP
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
              </div>
            </div>
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
