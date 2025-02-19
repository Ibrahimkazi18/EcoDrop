"use client"
import { createContext, useContext, useState } from "react";

interface NavbarContextType {
  refreshNavbar: boolean;
  triggerNavbarRefresh: () => void;
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

export const NavbarProvider = ({ children }: { children: React.ReactNode }) => {
  const [refreshNavbar, setRefreshNavbar] = useState(false);

  const triggerNavbarRefresh = () => {
    setRefreshNavbar((prev) => !prev);
  };

  return (
    <NavbarContext.Provider value={{ refreshNavbar, triggerNavbarRefresh }}>
      {children}
    </NavbarContext.Provider>
  );
};

export const useNavbar = () => {
  const context = useContext(NavbarContext);
  if (!context) throw new Error("useNavbar must be used within NavbarProvider");
  return context;
};
