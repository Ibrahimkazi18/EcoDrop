"use client"
import { Bell, Calendar, ClipboardEdit, Home, Mail, Search, Settings, Trophy, Users, Gift, MapPin } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import ThemeChanger from "./ui/theme-changer"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import UserGreeting from "./user-greeting"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import useAuthStore from "@/store/authStore"
import { useSidebar } from "@/app/context/sidebarContext"
import { useUser } from "@/hooks/use-user"
import { User } from "@/types-db"
import { doc, getDoc } from "firebase/firestore"

export function AppSidebar() {
  const CitizenLabels = [
    {
      title: "Home",
      url: "/citizen-dashboard/{citizenId}",
      icon: Home,
    },
    {
      title: "Report",
      url: "/citizen-dashboard/{citizenId}/report",
      icon: MapPin,
    },
    {
      title: "Tasks",
      url: "/citizen-dashboard/{citizenId}/tasks",
      icon: ClipboardEdit,
    },
    {
      title: "Rewards",
      url: "/citizen-dashboard/{citizenId}/rewards",
      icon: Gift,
    },
    {
      title: "Leaderboard",
      url: "/citizen-dashboard/{citizenId}/leaderboard",
      icon: Trophy,
    },
    {
      title: "Settings",
      url: "/citizen-dashboard/{citizenId}/settings",
      icon: Settings,
    },
  ]
  
  const AgencyLabels = [
    {
      title: "Home",
      url: `/agency-dashboard/{agencyId}`,
      icon: Home,
    },
    {
      title: "Requests",
      url: `/agency-dashboard/{agencyId}/requests`,
      icon: Mail,
    },
    {
      title: "Tasks",
      url: `/agency-dashboard/{agencyId}/tasks`,
      icon: ClipboardEdit,
    },
    {
      title: "Volunteers",
      url: `/agency-dashboard/{agencyId}/volunteers`,
      icon: Users,
    },
    {
      title: "Leaderboard",
      url: `/agency-dashboard/{agencyId}/leaderboard`,
      icon: Trophy,
    },
    {
      title: "Settings",
      url: "/agency-dashboard/{agencyId}/settings",
      icon: Settings,
    }
  ]
  
  const VolunteerLabels = [
      {
        title: "Home",
        url: `/{agencyId}/volunteer-dashboard`,
        icon: Home,
      },
      {
        title: "Tasks",
        url: `/{agencyId}/volunteer-dashboard/tasks`,
        icon: Mail,
      },
      {
        title: "Rewards",
        url: `/{agencyId}/volunteer-dashboard/rewards`,
        icon: Gift,
      }, 
      {
          title: "Leaderboard",
          url: `/{agencyId}/volunteer-dashboard/leaderboard`,
          icon: Trophy,
      },
      {
        title: "Settings",
        url: "/{agencyId}/volunteer-dashboard/settings",
        icon: Settings,
      }
  ]  

  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [citizenId, setCitizenId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const pathName = usePathname() as string;
  const setAuthData = useAuthStore((state) => state.setAuthData);
  const { refreshSidebar } = useSidebar();

  useEffect(() => {
    const fetchUser = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data() as User;
          setUsername(data.username);
        }
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (cuser) => {
      if (cuser) {
        fetchUser();
        setCurrentUser(cuser.uid);  
  
        const parts = pathName.split("/");
        let extractedAgencyId = null;
        let extractedCitizenId = null;
  
        if (pathName.includes("agency-dashboard") && parts.length > 2) {
          extractedAgencyId = parts[2];
        } else if (pathName.includes("volunteer-dashboard") && parts.length > 1) {
          extractedAgencyId = parts[1];
        } else {
          extractedCitizenId = cuser.uid;
        }
  
        setAgencyId(extractedAgencyId);
        setCitizenId(extractedCitizenId);
  
        // Ensure `setAuthData` is called only after state updates
        setTimeout(() => {
          setAuthData(cuser.uid, extractedAgencyId);
        }, 0);
      } else {
        setCurrentUser(null);
        setAgencyId(null);
      }
    });
  
    setIsMounted(true);
  
    return () => unsubscribe();
  }, [pathName, setAuthData, refreshSidebar]);
  

  useEffect(() => {
    setIsMounted(true);
  }, [])

  if(!isMounted) return null;

  const items = pathName.includes("agency-dashboard")
    ? AgencyLabels.map((label) => ({
        ...label,
        url: label.url.replace("{agencyId}", agencyId || "nouserid"),
      }))
    : pathName.includes("citizen-dashboard")
    ? CitizenLabels.map((label) => ({
        ...label,
        url: label.url.replace("{citizenId}", citizenId || "nouserid")
     }))
    : VolunteerLabels.map((label) => ({
        ...label,
        url: label.url.replace("{agencyId}", agencyId || "nouserid"),
      }));

  return (
    <Sidebar collapsible="icon">
        <SidebarGroup>
            <SidebarGroupLabel>
                <SidebarMenuItem className="list-none text-center flex">
                        <SidebarMenuButton asChild >
                            <>
                                {username ? (
                                  <h1>Welcome, {username}</h1>
                                ) : (
                                  <p>Not Found...</p>
                                )}
                            </>
                        </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarGroupLabel>
        </SidebarGroup>    

        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => !(item.title === "Settings") && (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span className="text-base">{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
                <SidebarGroupLabel>UI</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem className="flex"> 
                                <SidebarMenuButton asChild variant={"default"} className="hover:bg-inherit">
                                    <div>
                                        <ThemeChanger />
                                        <span>Toggle Mode</span>
                                    </div>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
            <SidebarMenu>
              {items.find((item) => item.title === "Settings") && (
                <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                        <a href={items.find((item) => item.title === "Settings")?.url}>
                            <Settings />
                            <span className="text-base">Settings</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
        </SidebarFooter> 
    </Sidebar>
  )
}
