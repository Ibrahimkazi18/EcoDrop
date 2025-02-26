"use client";
import { createContext, useContext, useState } from "react";

interface SidebarContextType {
  refreshSidebar: boolean;
  triggerSidebarRefresh: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarRefreshProvider = ({ children }: { children: React.ReactNode }) => {
  const [refreshSidebar, setRefreshSidebar] = useState(false);

  const triggerSidebarRefresh = () => {
    setRefreshSidebar((prev) => !prev);
  };

  return (
    <SidebarContext.Provider value={{ refreshSidebar, triggerSidebarRefresh }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within SidebarRefreshProvider");
  return context;
};