"use client"
import { Bell, Calendar, Home, Inbox, Mail, Search, Settings, Trophy, Users } from "lucide-react"

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
import { auth } from "@/lib/firebase"

const currentUser = auth.currentUser?.uid ? auth.currentUser.uid : "nouserid"
let agencyId : string;

export function AppSidebar() {
  const CitizenLabels = [
    {
      title: "Home",
      url: "/citizen-dashboard",
      icon: Home,
    },
    {
      title: "Report",
      url: "/citizen-dashboard/report",
      icon: Inbox,
    },
    {
      title: "Notifications",
      url: "/citizen-dashboard/notifications",
      icon: Calendar,
    },
    {
      title: "Rewards",
      url: "/citizen-dashboard/rewards",
      icon: Search,
    },
    {
      title: "Leaderboard",
      url: "/citizen-dashboard/leaderboard",
      icon: Trophy,
  }
  ]
  
  const AgencyLabels = [
    {
      title: "Home",
      url: `/agency-dashboard`,
      icon: Home,
    },
    {
      title: "Requests",
      url: `/agency-dashboard/${currentUser}/requests`,
      icon: Mail,
    },
    {
      title: "Volunteers",
      url: `/agency-dashboard/${currentUser}/volunteers`,
      icon: Users,
    },
    {
      title: "Notifications",
      url: `/agency-dashboard/${currentUser}/notifications`,
      icon: Bell,
    },
    {
      title: "Leaderboard",
      url: `/agency-dashboard/${currentUser}/leaderboard`,
      icon: Trophy,
    },
  ]
  
  const VolunteerLabels = [
      {
        title: "Home",
        url: `/${agencyId}/volunteer-dashboard`,
        icon: Home,
      },
      {
        title: "Tasks",
        url: `/${agencyId}/volunteer-dashboard/tasks`,
        icon: Mail,
      },
      {
        title: "Status",
        url: `/${agencyId}/volunteer-dashboard/status`,
        icon: Calendar,
      },
      {
        title: "Notifications",
        url: `/${agencyId}/volunteer-dashboard/notifications`,
        icon: Search,
      }, 
      {
          title: "Leaderboard",
          url: `/${agencyId}/volunteer-dashboard/leaderboard`,
          icon: Trophy,
      }
  ]
  
  const settings = {
      title: "Settings",
      url: "/citizen-dashboard/settings",
      icon: Settings,
  }
  
  const agencySettings = {
      title: "Settings",
      url: "/agency-dashboard/settings",
      icon: Settings,
  }
  
  const volunteerSettings = {
      title: "Settings",
      url: `/${agencyId}/volunteer-dashboard/settings`,
      icon: Settings,
  }
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, [])

  if(!isMounted) return null;

  const pathName = usePathname();

  const items = pathName.includes("agency-dashboard") ? 
                    AgencyLabels : pathName.includes("citizen-dashboard") ? 
                        CitizenLabels : VolunteerLabels;

  const parts = pathName.split("/");
  agencyId = parts[1];

  return (
    <Sidebar collapsible="icon">
        <SidebarGroup>
            <SidebarGroupLabel>
                <SidebarMenuItem className="list-none text-center flex">
                        <SidebarMenuButton asChild >
                            <>
                                <UserGreeting />
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
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
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
                <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                        <a href={settings.url}>
                            <settings.icon />
                            <span>{settings.title}</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter> 
    </Sidebar>
  )
}
