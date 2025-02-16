import { getTasks } from "@/hooks/create-report";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { agencyId } = req.query;

    if (!agencyId) {
      return res.status(400).json({ error: "Missing agencyId parameter" });
    }

    const tasks = await getTasks();

    const pendingTasks = tasks.filter((task) => task.agencyId === agencyId && (task.completed === false || task.citizenConfirmationStatus === "pending"));

    res.status(200).json({ tasks: pendingTasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}