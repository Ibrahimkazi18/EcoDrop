// layout.tsx (Server Component)
import DashboardClient from "@/app/(dashboard)/components/dashboardClient";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const revalidate = 0;

const DashboardLayout = ({ children }: DashboardLayoutProps) => {

  return (
      <SidebarProvider suppressHydrationWarning>
          <AppSidebar />
          <SidebarTrigger />
          <DashboardClient>
            {children}
          </DashboardClient>
      </SidebarProvider>
  );
};

export default DashboardLayout;
