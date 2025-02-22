"use client"

import { useVolunteerLocation } from "@/components/volunteerLocationProvider";

const VolunteerDashboard = ({ params } : { params : { agencyId : string }}) => {
  const location = useVolunteerLocation();

  return (
    <div>
      {location ? (
        <p>📍 Current Location: {location.lat}, {location.lng}</p>
      ) : (
        <p>🔄 Getting location...</p>
      )}
    </div>
  );
};

export default VolunteerDashboard