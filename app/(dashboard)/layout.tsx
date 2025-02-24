import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { NavbarProvider } from "../context/navbarContext";
import DashboardClientWrapper from "@/components/DashboardClientWrapper"; 

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <NavbarProvider>
      <SidebarProvider suppressHydrationWarning>
        <AppSidebar />
        <div>
          <DashboardClientWrapper>{children}</DashboardClientWrapper>
        </div>
      </SidebarProvider>
    </NavbarProvider>
  );
};

export default DashboardLayout;
