"use client";

import { VolunteerLocationProvider } from "./volunteerLocationProvider";

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  return <VolunteerLocationProvider>{children}</VolunteerLocationProvider>;
};

export default ClientLayout;