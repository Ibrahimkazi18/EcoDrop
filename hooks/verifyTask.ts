import { db } from "@/lib/firebase";
import { doc, getDoc, increment, writeBatch } from "firebase/firestore";
import { getNextLevelExp, getUserRank } from "./levelMainter";
import { Citizen, Volunteer } from "@/types-db";

export async function verifyTask(taskId: string, isApproved: boolean) {
    try {
      const taskRef = doc(db, "tasks", taskId);
      const taskSnap = await getDoc(taskRef);
      if (!taskSnap.exists()) throw new Error("Task not found");
  
      const taskData = taskSnap.data();
      const { volunteersAssigned, citizenId, agencyId } = taskData;
  
      const batch = writeBatch(db);
  
      if (isApproved) {
        batch.update(taskRef, { completed: true });

        const setVolunteer = async (volunteerId: string) => {
          const volunteerRef = doc(db, `agencies/${agencyId}/volunteers`, volunteerId) 
          const volunteerSnap = await getDoc(taskRef);
          const volunteerData = volunteerSnap.data() as Volunteer;

          let exp = volunteerData.exp || 0;
          let level = volunteerData.level || 1;

          while (exp >= getNextLevelExp(level)) {
            exp -= getNextLevelExp(level);
            level++;
          }

          const rank = getUserRank(level);
          batch.update(volunteerRef, {
            points: increment(30),
            exp: increment(30),
            level: level,
            rank: rank,
          });
        }
  
        volunteersAssigned.forEach((volunteerId: string) => {
          setVolunteer(volunteerId);
        });
  
        const citizenRef = doc(db, "citizens", citizenId);
        const citizenSnap = await getDoc(citizenRef);
        const citizenData = citizenSnap.data() as Citizen;

        let exp = citizenData.exp || 0;
          let level = citizenData.level || 1;

          while (exp >= getNextLevelExp(level)) {
            exp -= getNextLevelExp(level);
            level++;
          }

          const rank = getUserRank(level);

        batch.update(citizenRef, {
          points: increment(10),
          exp: increment(30),
          rank: rank,
          level: level,
        });
  
        await batch.commit();
        console.log("Task successfully verified and rewards granted.");
      } else {
        batch.update(taskRef, { verificationImageUrl: "" });
        await batch.commit();
        console.log("Task rejected. Volunteer must resubmit.");
      }
    } catch (error) {
      console.error("Error verifying task:", error);
      throw new Error("Verification failed");
    }
  }
  