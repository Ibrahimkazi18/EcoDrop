import { getAgency, getAgencyVolunteers, getTasks } from "@/hooks/create-report";
import { taskId } from "@/types-db";
import { NextApiRequest, NextApiResponse } from "next";

interface GraphData {
    month: string;
    tasks: number;
}

const generateLast12MonthsData = (tasks: taskId[]) => {
    const currentDate = new Date();
    const months: GraphData[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - i);

      const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
      months.push({ month: monthYear, tasks: 0 });
    }

    tasks.forEach((task) => {
        const taskDate = task.createdAt instanceof Date
        ? new Date(task.createdAt.toISOString().split("T")[0])
        : new Date(new Date(task.createdAt.seconds * 1000).toISOString().split("T")[0]);
      const monthYear = `${taskDate.toLocaleString("default", { month: "short" })} ${taskDate.getFullYear()}`;

      const index = months.findIndex((m) => m.month === monthYear);
      if (index !== -1) {
        months[index].tasks += 1;
      }
    });

    return months;
  };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { agencyId } = req.query;

    if (!agencyId) {
      return res.status(400).json({ error: "Missing agencyId parameter" });
    }

    const agency = await getAgency(Array.isArray(agencyId) ? "" : agencyId);
    const volunteers = await getAgencyVolunteers(Array.isArray(agencyId) ? "" : agencyId);
    const tasks = await getTasks();

    const completedTasks = tasks.filter((task) => task.agencyId === agencyId && (task.completed === true));
    const totalTasks = tasks.filter((task) => task.agencyId === agencyId);
    const ratings = agency.ratings && agency.ratings.length > 0 
      ? (agency.ratings.reduce((acc, val) => acc + val, 0) / agency.ratings.length).toFixed(1).toLocaleString() 
      : "N/A";
    const tasksPending = tasks.filter((task) => task.agencyId === agencyId && (task.completed === false || task.citizenConfirmationStatus === "pending"));
    const taskVerified = completedTasks.length;

    const topVolunteers = volunteers
        .map((vol) => ({
            id: vol.id,
            username: vol.username,
            tasksCompleted: Math.floor(vol.totalPoints / 15), 
        }))
        .sort((a, b) => (b.tasksCompleted || 0) - (a.tasksCompleted || 0))
        .slice(0, 5);

    const monthsData = generateLast12MonthsData(completedTasks)

    res.status(200).json({ 
        tasksPending: tasksPending.length, 
        totalTasks: totalTasks.length, 
        agencyRating: ratings, 
        totalVolunteers: volunteers?.length || 0, 
        tasksVerified: taskVerified,
        topVolunteers: topVolunteers,
        monthlyData: monthsData,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}