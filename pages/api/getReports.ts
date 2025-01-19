import { NextApiRequest, NextApiResponse } from "next";
import { getReports } from "@/hooks/create-report";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const reports = await getReports(10);
    const pendingReports = reports.filter((report) => report.status === "Pending");

    res.status(200).json({ reports: pendingReports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}