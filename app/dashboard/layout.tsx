// layout.tsx (Server Component)
import { redirect } from "next/navigation";
import DashboardClient from "./components/dashboardClient";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {

  return (
    <div>
      <DashboardClient>
        {children}
      </DashboardClient>
    </div>
  );
};

export default DashboardLayout;
