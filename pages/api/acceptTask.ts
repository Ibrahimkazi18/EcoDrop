import { db } from "@/lib/firebase";
import { taskId } from "@/types-db";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("Request: ", req.body);
  const { taskId, volunteerId } = req.body;

  if (!taskId) {
    return res.status(400).json({ error: "Missing taskID" });
  }
  if (!volunteerId) {
    return res.status(400).json({ error: "Missing volunteerId" });
  }

  try {
    const taskRef = doc(db, "tasks", taskId);
    const taskSnapshot = await getDoc(taskRef);

    if (!taskSnapshot) {
      return res.status(404).json({ error: "Task not found" });
    }

    const taskData = taskSnapshot.data() as taskId;

    if (!taskData.volunteersAssigned.includes(volunteerId)) {
      return res.status(400).json({ error: "Volunteer is not assigned to this task" });
    }

    // Update the task document
    await updateDoc(taskRef, {
        volunteersAccepted: arrayUnion(volunteerId)
      });

    return res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
