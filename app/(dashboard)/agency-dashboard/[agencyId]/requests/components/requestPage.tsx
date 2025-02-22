import { useEffect, useState } from "react";
import { Volunteer } from "@/types-db";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal";
import { createColumns, ReportColumn } from "./columns";
import RequestClient from "./client";
import { createNotification, createTask } from "@/hooks/create-report";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { formatISO, isToday } from "date-fns";
import { GoogleMap, InfoWindow, LoadScript, Marker } from "@react-google-maps/api";
import Heading from "@/components/heading";

interface Location {
  lat: number;
  lng: number;
}

interface VolunteerDistance extends Volunteer {
  distance: number
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string;

const RequestPage = ({
  params,
  isModalOpen,
  selectedReport,
  selectedVolunteers,
  setSelectedVolunteers,
  openAssignModal,
  closeAssignModal,
}: {
  params: { agencyId: string };
  isModalOpen: boolean;
  selectedReport: ReportColumn | null;
  selectedVolunteers: Volunteer[];
  setSelectedVolunteers: React.Dispatch<React.SetStateAction<Volunteer[]>>;
  openAssignModal: (report: ReportColumn) => void;
  closeAssignModal: () => void;
}) => {
  const [volunteers, setVolunteers] = useState<VolunteerDistance[]>([]);
  const [reports, setReports] = useState<ReportColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerDistance | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 19.076, lng: 72.877 });

  const { toast } = useToast();

  const haversineDistance = (loc1: Location, loc2: Location) => {
    const toRad = (angle: number) => (angle * Math.PI) / 180;
    const R = 6371; // Radius of Earth in kilometers
  
    const dLat = toRad(loc2.lat - loc1.lat);
    const dLng = toRad(loc2.lng - loc1.lng);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(loc1.lat)) * Math.cos(toRad(loc2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in km
  };

  const convertAddressToCoordinates = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    if (!GOOGLE_MAPS_API_KEY || !address) return null;
  
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
  
      if (data.status === "OK") {
        const location = data.results[0].geometry.location;
        return location;
      } else {
        console.error("Geocoding error:", data.status);
        return null;
      }
    } catch (error) {
      console.error("Error fetching geocode:", error);
      return null;
    }
  };

  const fetchVolunteersAndReports = async () => {
    try {
      const [volunteersRes, reportsRes] = await Promise.all([
        fetch(`/api/getVolunteers?agencyId=${params.agencyId}`),
        fetch(`/api/getReports`),
      ]);

      const volunteersData = await volunteersRes.json();
      const reportsData = await reportsRes.json();

      if (!volunteersRes.ok) throw new Error(volunteersData.error || "Failed to fetch volunteers");
      if (!reportsRes.ok) throw new Error(reportsData.error || "Failed to fetch reports");

      const volunteersWithDistances = await Promise.all(
        volunteersData.volunteers.map(async (volunteer: Volunteer) => {
          const ref = doc(db, `agencies/${params.agencyId}/volunteers`, volunteer.id);
          const snapshot = await getDoc(ref);
          const data = snapshot.data();
  
          if (!data || !data.location) return null;
  
          // Ensure pickup location exists before calculating distance
          console.log("selectedReport: ", selectedReport);
          if (!selectedReport || !selectedReport.location) return { ...volunteer, distance: Infinity };
          const destination = await convertAddressToCoordinates(selectedReport.location)
          console.log("destination: ", destination)
          if (!destination) return;
          const distance = haversineDistance(data.location, destination);
  
          await resetPickupCount(volunteer.id);
  
          return {
            ...volunteer,
            distance, // Add distance field
          };
        })
      );

      const sortedVolunteers = volunteersWithDistances
      .filter((volunteer) => volunteer !== null)
      .sort((a, b) => {
        // If a has 4 pickups and b does not, place a after b
        if (a.pickups === 4 && b.pickups !== 4) return 1;
        // If b has 4 pickups and a does not, place b after a
        if (b.pickups === 4 && a.pickups !== 4) return -1;
        // Otherwise, sort by distance
        return (a?.distance ?? Infinity) - (b?.distance ?? Infinity);
      });


      const finalVolunteers = sortedVolunteers as VolunteerDistance[]
      
      const formattedReports = reportsData.reports.map((report: any) => ({
        id: report.id,
        location: report.location,
        amount: report.amount,
        imageUrl: report.imageUrl,
        userId: report.userId,
        createdAt: report.createdAt instanceof Date
        ? report.createdAt.toISOString().split("T")[0]
        : new Date(report.createdAt.seconds * 1000).toISOString().split("T")[0]
      }));
      
      console.log(finalVolunteers);
      setReports(formattedReports);
      setVolunteers(finalVolunteers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteersAndReports();
  }, [params.agencyId]);

  useEffect(() => {
    fetchVolunteersAndReports();
  }, [selectedReport]);

  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsGoogleLoaded(true);
      } else {
        setTimeout(checkGoogleMaps, 100); // Retry every 100ms until loaded
      }
    };
  
    checkGoogleMaps();
  }, []);

  const toggleVolunteerSelection = (volunteer : Volunteer) => {
    if (volunteer.pickupsToday >= 4) {
      toast({
        title: "Limit Reached",
        description: `${volunteer.username} has already completed 4 pickups today.`,
        variant: "destructive",
      });
      return;
    }

    setSelectedVolunteers((prevState) => {
      const isAlreadySelected = prevState.some((v) => v.id === volunteer.id);
    if (isAlreadySelected) {
      return prevState.filter((v) => v.id !== volunteer.id);
    } else {
      return [...prevState, volunteer];
    }
    });
  };

  const resetPickupCount = async (volunteerId: string) => {
    const ref = doc(db, `agencies/${params.agencyId}/volunteers`, volunteerId);
    const snapshot = await getDoc(ref);
    const data = snapshot.data();

    if (!data) return;

    if (!isToday(new Date(data.lastReset))) {
      await updateDoc(ref, {
        pickupsToday: 0,
        lastReset: formatISO(new Date()),
      });
    }
  };

  const submitAssignment = async () => {
    const notificationPromises = volunteers.map((volunteer) => {

      const notification = createNotification(volunteer.id, "You have been assigned a new task for report, please check tasks!!", "task assignment")
    })

    await Promise.all(notificationPromises);

    await createTask(params.agencyId, selectedReport , selectedVolunteers)

    closeAssignModal();

    toast({
      title: "Task Assigned Successfully!",
      description: `${selectedReport?.id} assigned to: ${selectedVolunteers.map((v) => `${v.username}, `)}`
    })

    await fetchVolunteersAndReports()
  };

  if (loading) {
    return (
        <div className="pt-14 px-20 mx-auto flex items-center justify-center">
            <Loader className="animate-spin h-8 w-8 "/>
        </div>
    )
  }
  if (error) return <p>Error: {error}</p>;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchVolunteersAndReports();
    setIsRefreshing(false);
  };

  const columns = createColumns(openAssignModal);

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <RequestClient data={reports} columns={columns} isRefreshing={isRefreshing} handleRefresh={handleRefresh} />

        <div className="p-4 border-2 rounded-md">
          <Heading 
            title="Volunteers Locations"
            description="See the current location of your volunteers"
          />

          <div className="mt-4">
            <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
              <GoogleMap mapContainerStyle={{ width: "100%", height: "500px" }} zoom={12} center={mapCenter}>
                {volunteers.map((vol) => (
                  <Marker 
                    key={vol.id} 
                    onClick={() => {
                        setSelectedVolunteer(vol)
                        if(vol.location)
                          setMapCenter(vol.location)
                      }} 
                    position={{ lat: vol.location?.lat || 0, lng: vol.location?.lng || 0}} 
                    label={{
                      text: vol.username,
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                    icon={{
                      url: vol.status == "assigned"
                        ? "/busy.png"  
                        :  vol.pickupsToday >= 4 
                          ? "/busy.png"
                          : "/available.png",
                      scaledSize:  window.google && window.google.maps
                      ? new window.google.maps.Size(40, 40)  
                      : null, 
                    }}
                  />
                ))}
                {selectedVolunteer && (
                  <InfoWindow
                    position={{
                      lat: selectedVolunteer.location?.lat || 0, 
                      lng: selectedVolunteer.location?.lng || 0
                    }}
                    onCloseClick={() => setSelectedVolunteer(null)}

                  >
                    <div>
                      <h2 className="font-bold text-gray-900">{selectedVolunteer.username}</h2>
                      <p className="text-gray-900">🚀 Level: {selectedVolunteer.level}</p>
                      <p className="text-gray-900">📦 Pickups: {selectedVolunteer.pickupsToday}</p>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </LoadScript>
          </div>
        </div>
      </div>

      <Modal
        title="Select Volunteers"
        description="Select volunteers to assign the task to..."
        isOpen={isModalOpen}
        onClose={closeAssignModal}
      >
        <div>
          {volunteers.map((volunteer) => (
            volunteer && (
            <div key={volunteer.id} className={`flex items-center space-x-2 mb-2 ${volunteer.pickupsToday >= 4 ? "opacity-50" : ""}`}>
              <Checkbox
                checked={selectedVolunteers.some((v) => v.id === volunteer.id)}
                onCheckedChange={() => toggleVolunteerSelection(volunteer)}
                disabled={volunteer.pickupsToday >= 4}
              />
              <span>{volunteer.username}</span> 
              <span className="text-gray-500 ml-2">
                {volunteer.distance.toFixed(2)} km away
              </span>
              <span className="opacity-50">{volunteer.pickupsToday >= 4 ? "(Max Reached)" : `(${4 - volunteer.pickupsToday} Pick-Ups Left)`}</span>
            </div>
          )))}
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <Button onClick={submitAssignment} disabled={selectedVolunteers.length === 0}>
            Assign Task
          </Button>
          <Button variant="outline" onClick={closeAssignModal}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default RequestPage;
