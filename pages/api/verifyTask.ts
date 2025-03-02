import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, runTransaction } from "firebase/firestore";
import { getNextLevelExp, getUserRank } from "@/hooks/levelMainter";
import { createNotification, createTransaction } from "@/hooks/create-report";
import { taskId } from "@/types-db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { taskId, isApproved } = req.query;

  if (!taskId || typeof taskId !== "string") {
    return res.status(400).json({ error: "Missing or invalid taskId" });
  }
  if (isApproved === undefined || (isApproved !== "true" && isApproved !== "false")) {
    return res.status(400).json({ error: "Missing or invalid isApproved" });
  }

  try {
    const taskRef = doc(db, "tasks", taskId);
    const taskSnap = await getDoc(taskRef);

    if (!taskSnap.exists()) {
      return res.status(404).json({ error: "Task not found" });
    }

    const taskData = taskSnap.data() as taskId;

    if (isApproved === "true") {
      await updateDoc(taskRef, {
        citizenConfirmationStatus: "done",
        completed: true,
      });

      const citizenRef = doc(db, "citizens", taskData.report.userId);
      await runTransaction(db, async (transaction) => {
        const citizenDoc = await transaction.get(citizenRef);
        if (!citizenDoc.exists()) throw "Citizen does not exist!";
        
        const citizenData = citizenDoc.data();
        let { exp, level, points} = citizenData;

        points = (points || 0) + 10;
        
        const gainedExp = 30;
        exp += gainedExp;

        const nextLevelExp = getNextLevelExp(level);
        if (exp >= nextLevelExp) {
        level++;
        exp -= nextLevelExp;
        }

        const rank = getUserRank(level);

        transaction.update(citizenRef, {
            exp,
            points,
            level,
            rank,
        });
      });

      await createTransaction(taskData.report.userId, "earned_report", 10, "Points earned from veryfying task.")
      await createNotification(taskData.report.userId, `You've earned ${10} points points for veryfying task!`, "reward");

      if (taskData.volunteersAccepted && Array.isArray(taskData.volunteersAccepted)) {
        await Promise.all(
          taskData.volunteersAccepted.map(async (volunteerId: string) => {
            const volunteerRef = doc(db, `agencies/${taskData.agencyId}/volunteers`, volunteerId);

            await runTransaction(db, async (transaction) => {
              const volunteerDoc = await transaction.get(volunteerRef);
              if (!volunteerDoc.exists()) throw "Volunteer does not exist!";

              const volunteerData = volunteerDoc.data();
              let { exp, level, pickupsToday, points, status } = volunteerData;

              pickupsToday = (pickupsToday || 0) - 1;
              points = (points || 0) + 15;

              const gainedExp = 50;
              exp += gainedExp;

              status = "available"

              const nextLevelExp = getNextLevelExp(level);
              if (exp >= nextLevelExp) {
                level++;
                exp -= nextLevelExp;
              }

              const rank = getUserRank(level);

              transaction.update(volunteerRef, {
                exp,
                points,
                level,
                pickupsToday,
                rank,
                status,
              });

              await createTransaction(volunteerId, "earned_collect", 15, "Points earned for completing task.")
              await createNotification(volunteerId, `You've earned ${10} points points for completing task!`, "reward");
            });
          })
        );
      }
    }

    else {
        await updateDoc(taskRef, {
            verificationImageUrl: "",
            citizenVerificationDeadline: null,
        });

        if (taskData.volunteersAccepted && Array.isArray(taskData.volunteersAccepted)) {
            await Promise.all(
              taskData.volunteersAccepted.map(async (volunteerId: string) => {
                await createNotification(volunteerId, `Your image has been rejected please do task, or upload another image`, "reject");
            })
        )}
    }

    res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    console.error("Error updating volunteers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
