"use client";

import DashboardClient from "@/app/(dashboard)/components/dashboardClient";
import Navbar from "@/components/navbar";
import { ToastContainer } from "react-toastify";
import ClientLayout from "@/components/volunteerClientLayout";

interface DashboardClientWrapperProps {
  children: React.ReactNode;
}

const DashboardClientWrapper = ({ children }: DashboardClientWrapperProps) => {
  return (
    <DashboardClient>
      <Navbar />
      <ToastContainer />
      <ClientLayout>{children}</ClientLayout>
    </DashboardClient>
  );
};

export default DashboardClientWrapper;
