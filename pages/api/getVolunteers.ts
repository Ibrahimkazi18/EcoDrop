import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Volunteer } from "@/types-db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { agencyId } = req.query;

  if (!agencyId || typeof agencyId !== "string") {
    return res.status(400).json({ error: "Missing or invalid agencyId" });
  }

  try {
    const volunteersRef = collection(db, `agencies/${agencyId}/volunteers`);
    const volunteersSnapshot = await getDocs(volunteersRef);

    const volunteerData = volunteersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Volunteer[]

    const volunteers = volunteerData.filter((volunteer) => volunteer.status === "available");

    res.status(200).json({ volunteers });
  } catch (error) {
    console.error("Error fetching volunteers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
