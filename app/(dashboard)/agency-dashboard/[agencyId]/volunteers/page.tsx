"use client";
import { Volunteer } from "@/types-db";
import { VolunteerColumn } from "./components/columns";
import ProductClient from "./components/client";
import { useEffect, useState } from "react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const cache = 0;

const ProductsPage = ({params} : {params : {agencyId : string}}) => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchVolunteers = async () => {
    try {
      const volunteersRef = collection(db, `agencies/${params.agencyId}/volunteers`);
      const volunteersSnapshot = await getDocs(volunteersRef);

      const response = volunteersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Volunteer[];

      setVolunteers(response);

      if(volunteers) {
        setLoading(false);
      }
      else {
        console.log("NO volunteers")
      }
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchVolunteers();
    setIsRefreshing(false);
  };
  

  const formatDate = (date : Timestamp) => {
    const newDate = date.toDate();

    const formatted = `${newDate.getDate()}-${newDate.getMonth()}-${newDate.getFullYear()}`

    return formatted;
  }

  const formattedProducts: VolunteerColumn[] = volunteers.map((item) => ({
    id: item.id,
    username: item.username,
    email: item.email,
    status: item.status,
    hasSetPermanentPassword: item.hasSetPermanentPassword,
    createdAt: item.createdAt instanceof Timestamp ? formatDate(item.createdAt) : "",
  }));

  if (loading) return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProductClient data={formattedProducts} agencyId={params.agencyId} isRefreshing={isRefreshing} handleRefresh={handleRefresh} />
      </div>
    </div>
  );

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProductClient data={formattedProducts} agencyId={params.agencyId} isRefreshing={isRefreshing} handleRefresh={handleRefresh} />
      </div>
    </div>
  );
};

export default ProductsPage;
