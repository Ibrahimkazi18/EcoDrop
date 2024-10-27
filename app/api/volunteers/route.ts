// pages/api/volunteers/index.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/firebase"; // Adjust path if needed
import { collection, getDocs } from "firebase/firestore"; 
import { Volunteer } from "@/types-db";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const volunteerCollection = collection(db, "volunteers");
      const volunteerSnapshot = await getDocs(volunteerCollection);

      const volunteers: Volunteer[] = volunteerSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Volunteer[];

      res.status(200).json(volunteers);
    } catch (error) {
      console.error("Error fetching volunteers:", error);
      res.status(500).json({ message: "Error fetching volunteers" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
