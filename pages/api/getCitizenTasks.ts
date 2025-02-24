import { getAgency, getTasks } from "@/hooks/create-report";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter" });
    }

    const tasks = await getTasks();

    const completedTasks = tasks.filter((task) => task.report.userId === userId && task.completed === true);

    const tasksWithAgency = await Promise.all(
        completedTasks.map(async (task) => {
          const agency = await getAgency(task.agencyId); 
          return {
            ...task,
            agencyName: agency.username || "Unknown", 
          };
        })
    );
    res.status(200).json({ tasks: tasksWithAgency });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}