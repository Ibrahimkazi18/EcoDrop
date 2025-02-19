"use client"

import AgencyNavbar from "@/components/agency-navbar"
import CitizenNavbar from "@/components/citizen-navbar"
import VolunteerNavbar from "@/components/volunteer-navbar"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const Navbar = () => {

  const [isMounted, setIsMounted] = useState(false);
  const pathName = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const NavbarComponent = pathName?.includes("agency-dashboard") ? 
                    AgencyNavbar : pathName?.includes("citizen-dashboard") ? 
                        CitizenNavbar : VolunteerNavbar;

  return (
    <NavbarComponent />
  )
}

export default Navbar