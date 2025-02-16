import { getAllVolunteers } from "@/hooks/create-report";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const volunteers = await getAllVolunteers();

    res.status(200).json({ volunteers: volunteers });
  } catch (error) {
    console.error("Error fetching volunteers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}