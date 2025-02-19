import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import * as functions from "firebase-functions/v2/scheduler";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

const BASE_EXP = 100;
const EXP_MULTIPLIER = 1.5;

function getNextLevelExp(level: number) {
  return Math.floor(BASE_EXP * Math.pow(level, EXP_MULTIPLIER));
}

function getUserRank(level: number) {
  if (level >= 20) return "master";
  if (level >= 15) return "expert";
  if (level >= 10) return "pro";
  return "rookie";
}

export const autoVerify = functions.onSchedule("every 5 minutes", async (event) => {
  const now = new Date();
  const timestamp = Timestamp.fromDate(now);

  console.log("Checking for tasks to auto-confirm...");

  const tasksSnapshot = await db
    .collection("tasks")
    .where("completed", "==", false)
    .where("citizenVerificationDeadline", "<=", timestamp)
    .get();

  if (tasksSnapshot.empty) {
    console.log("No tasks need auto-confirmation.");
    return;
  }

  const batch = db.batch();

  for (const taskDoc of tasksSnapshot.docs) {
    const taskId = taskDoc.id;
    const taskData = taskDoc.data();
    const { volunteersAccepted, report, agencyId } = taskData;

    const citizenId = report.userId;

    console.log(`Auto-confirming task ${taskId}`);

    const taskRef = db.collection("tasks").doc(taskId);
    batch.update(taskRef, { completed: true, citizenConfirmationStatus: "done" });

    if (!Array.isArray(volunteersAccepted) || volunteersAccepted.length === 0) {
        console.warn(`Skipping task ${taskId} - No volunteers assigned.`);
        continue;
    }

    if (!citizenId || !agencyId) {
        console.error(`Task ${taskId} is missing citizenId or agencyId. Skipping.`);
        continue;
    }
     

    for (const volunteerId of volunteersAccepted) {
      const volunteerRef = db.collection(`agencies/${agencyId}/volunteers`).doc(volunteerId);
      const volunteerDoc = await volunteerRef.get();

      if (volunteerDoc.exists) {
        const volunteerData = volunteerDoc.data() as { points?: number; exp?: number; level?: number };

        let points = volunteerData.points || 0;
        let exp = volunteerData.exp || 0;
        let level = volunteerData.level || 1;

        points += 30;
        exp += 30;

        while (exp >= getNextLevelExp(level)) {
          exp -= getNextLevelExp(level);
          level++;
        }

        const rank = getUserRank(level);

        batch.update(volunteerRef, { points, exp, level, rank });
      }
    }

    const citizenRef = db.collection("citizens").doc(citizenId);
    const citizenDoc = await citizenRef.get();

    if (citizenDoc.exists) {
      const citizenData = citizenDoc.data() as { points?: number; exp?: number; level?: number };

      let points = citizenData.points || 0;
      let exp = citizenData.exp || 0;
      let level = citizenData.level || 1;

      points += 10;
      exp += 30;

      while (exp >= getNextLevelExp(level)) {
        exp -= getNextLevelExp(level);
        level++;
      }

      const rank = getUserRank(level);

      batch.update(citizenRef, { points, exp, level, rank });
    }
  }

  await batch.commit();
  console.log(`Auto-confirmed ${tasksSnapshot.size} tasks and updated user stats.`);
});
