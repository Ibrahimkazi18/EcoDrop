import { getAllVolunteers, getTasks, getUsers } from "@/hooks/create-report";
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
    
    const userVolunteer = users.find((user) => user.id === userId)
    
    if (!userVolunteer) {
        return res.status(400).json({ error: "Volunteer not found" });
    }

    const volunteers = await getAllVolunteers();
    const volunteerData = volunteers.find((volunteer) => volunteer.id === userVolunteer.volunteerId);

    if (!volunteerData) {
        return res.status(400).json({ error: "VolunteerData not found" });
    }
    
    const tasks = await getTasks();
    const volunteerTasks = tasks.filter((task) => task.agencyId === agencyId && task.completed === true && task.volunteersAccepted.includes(volunteerData.id));

    res.status(200).json({ volunteer: volunteerData, volunteerTasks: volunteerTasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}