import { getTasks, getUsers } from "@/hooks/create-report";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {

    const { agencyId, userId } = req.query;

    if (!agencyId) {
      return res.status(400).json({ error: "Missing agencyId parameter" });
    }
    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter" });
    }
    const users = await getUsers();

    
    const volunteer = users.find((user) => user.id === userId)
    
    if (!volunteer) {
        return res.status(400).json({ error: "Volunteer not found" });
    }

    const tasks = await getTasks();
    
    const pendingTasks = tasks.filter((task) => task.agencyId === agencyId);
    
    const volunteerTasks = pendingTasks.filter((task) => task.volunteersAssigned.includes(volunteer?.volunteerId || ""));

    res.status(200).json({ tasks: volunteerTasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}