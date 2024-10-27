"use client"
import { Bell, Calendar, Home, Inbox, Mail, Search, Settings, Trophy, Users } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import ThemeChanger from "./ui/theme-changer"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import UserGreeting from "./user-greeting"

// Menu CitizenLabels.
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
      url: "/agency-dashboard",
      icon: Home,
    },
    {
      title: "Requests",
      url: "/agency-dashboard/requests",
      icon: Mail,
    },
    {
      title: "Volunteers",
      url: "/agency-dashboard/volunteers",
      icon: Users,
    },
    {
      title: "Notifications",
      url: "/agency-dashboard/notifications",
      icon: Bell,
    }, 
    {
        title: "Leaderboard",
        url: "/agency-dashboard/leaderboard",
        icon: Trophy,
    }
]

const VolunteerLabels = [
    {
      title: "Home",
      url: "/volunteer-dashboard",
      icon: Home,
    },
    {
      title: "Tasks",
      url: "/volunteer-dashboard/tasks",
      icon: Mail,
    },
    {
      title: "Status",
      url: "/volunteer-dashboard/status",
      icon: Calendar,
    },
    {
      title: "Notifications",
      url: "/volunteer-dashboard/notifications",
      icon: Search,
    }, 
    {
        title: "Leaderboard",
        url: "/volunteer-dashboard/leaderboard",
        icon: Trophy,
    }
]

const settings = {
    title: "Settings",
    url: "/settings",
    icon: Settings,
}

export function AppSidebar() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, [])

  if(!isMounted) return null;

  const pathName = usePathname();

  const items = pathName.includes("agency-dashboard") ? 
                    AgencyLabels : pathName.includes("citizen-dashboard") ? 
                        CitizenLabels : VolunteerLabels;

  

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
