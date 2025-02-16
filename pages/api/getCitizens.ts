import { getCitizens } from "@/hooks/create-report";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const citizens = await getCitizens();

    res.status(200).json({ citizens: citizens });
  } catch (error) {
    console.error("Error fetching citizens:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}