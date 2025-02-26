import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { NavbarProvider } from "../context/navbarContext";
import DashboardClientWrapper from "@/components/DashboardClientWrapper"; 
import { SidebarRefreshProvider } from "../context/sidebarContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <NavbarProvider>
      <SidebarRefreshProvider>
        <SidebarProvider suppressHydrationWarning>
          <AppSidebar />
          <div>
            <DashboardClientWrapper>{children}</DashboardClientWrapper>
          </div>
        </SidebarProvider>
      </SidebarRefreshProvider>
    </NavbarProvider>
  );
};

export default DashboardLayout;
