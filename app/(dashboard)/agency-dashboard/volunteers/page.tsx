"use client";
import { format } from "date-fns";
import { Volunteer } from "@/types-db";
import { VolunteerColumn } from "./components/columns";
import ProductClient from "./components/client";
import { useEffect, useState } from "react";

const ProductsPage = ({ params }: { params: { storeId: string } }) => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const response = await fetch("/api/volunteers");
        const data = await response.json();
        setVolunteers(data);
      } catch (error) {
        console.error("Failed to fetch volunteers:", error);
      } finally {
        setLoading(false);
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
    temporaryPassword: item.temporaryPassword,
    hasSetPermanentPassword: item.hasSetPermanentPassword,
    createdAt: item.createdAt ? format(new Date(item.createdAt), "MMMM do, yyyy") : "",
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProductClient data={formattedProducts} />
      </div>
    </div>
  );
};

export default ProductsPage;
