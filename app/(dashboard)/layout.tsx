// layout.tsx (Server Component)
import DashboardClient from "@/app/(dashboard)/components/dashboardClient";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Navbar from "@/components/navbar";
import { ToastContainer } from "react-toastify";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const revalidate = 0;

const DashboardLayout = ({ children }: DashboardLayoutProps) => {

  return (
    <SidebarProvider suppressHydrationWarning>
            <AppSidebar/>
            <div>
              <DashboardClient>
                <Navbar />
                <ToastContainer />
                {children}
              </DashboardClient>
            </div>
      </SidebarProvider>
  );
};

export default DashboardLayout;
