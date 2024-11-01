"use client";
import { format } from "date-fns";
import { Volunteer } from "@/types-db";
import { VolunteerColumn } from "./components/columns";
import ProductClient from "./components/client";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const ProductsPage = ({params} : {params : {agencyId : string}}) => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const volunteersRef = collection(db, `agencies/${params.agencyId}/volunteers`);
        console.log("Fetching volunteers from:", `agencies/${params.agencyId}/volunteers`);
        const volunteersSnapshot = await getDocs(volunteersRef);

        console.log("params: ", params.agencyId)
        console.log("fetched data: ", volunteersSnapshot)
        console.log("current: ", auth.currentUser)
        const response = volunteersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Volunteer[];

        console.log(response);
        setVolunteers(response);

        if(volunteers) {
          setLoading(false);
        }
        else {
          console.log("NO volunteers")
        }
        console.log(volunteers);
      } catch (error) {
        console.error('Error fetching volunteers:', error);
      }
    };
  
    fetchVolunteers();
  }, []);
  

  if (loading) return <p>Loading volunteers...</p>;

  const formattedProducts: VolunteerColumn[] = volunteers.map((item) => ({
    id: item.id,
    username: item.username,
    email: item.email,
    status: item.status,
    hasSetPermanentPassword: item.hasSetPermanentPassword,
    createdAt: item.createdAt ? format(new Date(item.createdAt), "MMMM do, yyyy") : "",
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProductClient data={formattedProducts} agencyId={params.agencyId}/>
      </div>
    </div>
  );
};

export default ProductsPage;
