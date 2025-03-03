import { useState, useEffect } from "react";

declare const google: any;

interface RealTimeNavigationProps {
  mapInstance: google.maps.Map;
  volunteerLocation: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  setDirections: (directions: google.maps.DirectionsResult | null) => void;
}

const RealTimeNavigation: React.FC<RealTimeNavigationProps> = ({
  mapInstance,
  volunteerLocation,
  destination,
  setDirections,
}) => {
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    if (!mapInstance || !volunteerLocation) return;

    const newMarker = new google.maps.Marker({
      position: volunteerLocation,
      map: mapInstance,
      icon: {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeWeight: 2,
        rotation: 0, // Initial rotation
      },
    });

    setMarker(newMarker);

    return () => {
      newMarker.setMap(null);
    };
  }, [mapInstance, volunteerLocation]);

  const animateMarker = (marker: google.maps.Marker, newPosition: google.maps.LatLngLiteral) => {
    const startPosition = marker.getPosition();
    if (!startPosition) return;

    const deltaLat = (newPosition.lat - startPosition.lat()) / 20;
    const deltaLng = (newPosition.lng - startPosition.lng()) / 20;

    let step = 0;
    const interval = setInterval(() => {
      step++;
      marker.setPosition({
        lat: startPosition.lat() + deltaLat * step,
        lng: startPosition.lng() + deltaLng * step,
      });
      if (step >= 20) clearInterval(interval);
    }, 50);

    // Calculate the new heading
    const heading = google.maps.geometry.spherical.computeHeading(startPosition, new google.maps.LatLng(newPosition)) as number;
    marker.setIcon({
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 6,
      fillColor: "#4285F4",
      fillOpacity: 1,
      strokeWeight: 2,
      rotation: heading,
    });
  };

  const startRealTimeTracking = () => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        if (marker) {
          animateMarker(marker, newLocation);
        }

        // Recalculate directions
        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
          {
            origin: newLocation,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result: any, status: any) => {
            if (status === "OK") {
              setDirections(result);
            } else {
              console.error("Error fetching directions:", status);
            }
          }
        );
      },
      (error) => console.error("Error tracking location:", error),
      { enableHighAccuracy: true }
    );

    setWatchId(id);
  };

  useEffect(() => {
    startRealTimeTracking();
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [marker]);

  return null;
};

export default RealTimeNavigation;