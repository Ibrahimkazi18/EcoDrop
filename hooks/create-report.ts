import { db } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc, getDocs, limit, query, Timestamp, updateDoc, where } from "firebase/firestore";

export async function createReport (
    userId: string,
    location: string,
    wasteType: string,
    amount: string,
    imageUrl ?: string,
    verificationResult ?: any
) {
    try {
        const reportRef = await addDoc(collection(db, "reports"), {
            userId,
            location,
            wasteType,
            amount,
            imageUrl,
            verificationResult,
            status : "pending",
            createdAt: Timestamp.fromDate(new Date()), // Add the timestamp of the report creation
          });
      
          console.log("Report created with ID:", reportRef.id);
          
          const pointsEarned = 10;      //Points gained after submitting report

          await updateRewardPoints(userId, pointsEarned);

          await createTransaction(userId, "earned_report", pointsEarned, "Points earned from reporting waste.")

          const notification = await createNotification(userId, `You've earned ${pointsEarned} points points for reporting waste!`, "reward");

          return reportRef.id;
    } catch (error) {
        console.error("Error creating report:", error);
        throw new Error("Failed to create report");
    }
}

export async function updateRewardPoints (userId : string, pointsToAdd : number) {
    try {
        const citizenRef = doc(db, "citizens", userId);
        const citizenDoc = await getDoc(citizenRef);

        if (!citizenDoc.exists()) {
            throw new Error("Citizen not found");
        }

        const currentPoints = citizenDoc.data()?.points || 0;

        const updatedPoints = currentPoints + pointsToAdd;

        await updateDoc(citizenRef, { points: updatedPoints });
        
        return updatedPoints;

    } catch (error) {
        console.error("Error updating reward points:", error);
        throw new Error("Failed to update reward points");
    }
}

export async function createTransaction (userId : string, type : 'earned_report' | 'earned_collect' | 'redeemed', amount: number, description: string ) {
    try {
        const reportRef = await addDoc(collection(db, "transactions"), {
            userId,
            type,
            amount,
            description,
            createdAt: Timestamp.fromDate(new Date()), // Add the timestamp of the report creation
          });

          return reportRef.id;
      
    } catch (error) {
        console.error("Error creating transaction:", error);
        throw new Error("Failed to create a transaction");
    }
}

export async function createNotification (userId : string, message : string, type : string) {
    try {
        const notificationRef = await addDoc(collection(db, "notifications"), {
          userId,
          message,
          type,
          createdAt: Timestamp.fromDate(new Date()), 
          isRead: false, // field to track read status
        });
    
        return { id: notificationRef.id, message: "Notification created successfully." };
      } catch (error) {
        console.error("Error creating notification:", error);
        throw new Error("Failed to create notification");
      }
}

export async function getReports(limitCount:number=10) {
    try {

        const reportsRef = collection(db, "reports");    
        
        const reportsQuery = query(reportsRef, limit(limitCount));
        
        const querySnapshot = await getDocs(reportsQuery);
        
        const reports = querySnapshot.docs.map((doc) => ({
          id: doc.id, 
          ...doc.data(), 
        }));
    
        return reports;

      } catch (error) {
        console.error("Error fetching reports:", error);
        throw new Error("Failed to fetch reports");
      }
}

export async function getReportsCitizen(userId: string, limitCount:number=10) {
    try {

        const reportsRef = collection(db, "reports");    
        
        const reportsQuery = query(reportsRef, where("userId", "==", userId), limit(limitCount));
        
        const querySnapshot = await getDocs(reportsQuery);
        
        const reports = querySnapshot.docs.map((doc) => ({
          id: doc.id, 
          ...doc.data(), 
        }));
    
        return reports;

      } catch (error) {
        console.error("Error fetching reports:", error);
        throw new Error("Failed to fetch reports");
      }
}