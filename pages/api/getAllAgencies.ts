import { getAllAgencies } from "@/hooks/create-report";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const agencies = await getAllAgencies();

    res.status(200).json({ agencies: agencies });
  } catch (error) {
    console.error("Error fetching agencies:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}