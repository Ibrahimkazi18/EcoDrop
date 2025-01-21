import { ReportColumn } from "@/app/(dashboard)/agency-dashboard/[agencyId]/requests/components/columns";
import { db } from "@/lib/firebase";
import { ReportType, taskId, User, Volunteer } from "@/types-db";
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, Timestamp, updateDoc, where } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadImage(file: File | Blob, folder: string): Promise<string> {
  try {
    const storage = getStorage();
    const fileName = file instanceof File ? file.name : `blob_${Date.now()}.png`
    const storageRef = ref(storage, `${folder}/${Date.now()}_${fileName}`);

    // Uploading in firestore storage
    await uploadBytes(storageRef, file);

    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Failed to upload image");
  }
}


export async function createReport (
    userId: string,
    location: string,
    wasteType: string,
    amount: string,
    imageFile?: File | Blob,
    verificationResult ?: any
) {
    try {
      let imageUrl = null;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile, "reports");
      }

        const reportRef = await addDoc(collection(db, "reports"), {
            userId,
            location,
            wasteType,
            amount,
            imageUrl,
            verificationResult,
            status : "Pending",
            createdAt: Timestamp.fromDate(new Date()), // Add the timestamp of the report creation
          });

          const reportDoc = await getDoc(reportRef);
      
          console.log("Report created with ID:", reportRef.id);
          
          const pointsEarned = 10;      //Points gained after submitting report

          await updateRewardPoints(userId, pointsEarned);

          await createTransaction(userId, "earned_report", pointsEarned, "Points earned from reporting waste.")

          const notification = await createNotification(userId, `You've earned ${pointsEarned} points points for reporting waste!`, "reward");

          return {
            id: reportDoc.id,
            ...reportDoc.data(),
          };
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

export async function createTask(agencyId: string, selectedReport: ReportColumn | null, volunteers: Volunteer[]) {
  try {
    if (selectedReport) {
      const reportRef = doc(db, "reports", selectedReport.id);
      await updateDoc(reportRef, {
        status: "assigned",
      });
    }
    else {
      console.log("No reports selected")
    }

    const taskRef = await addDoc(collection(db, "tasks"), {
        agencyId: agencyId,
        report: selectedReport,
        volunteersAssigned: volunteers.map((volunteer) => volunteer.id),
        volunteersAccepted: [],
        createdAt: Timestamp.fromDate(new Date()), 
        completed: false,
        verificationImageUrl: "",
        citizenConfirmationStatus: "pending",
        citizenVerificationImageUrl: ""
      });

      const taskDoc = await getDoc(taskRef);
  
      console.log("task created with ID:", taskRef.id);

} catch (error) {
    console.error("Error creating task:", error);
    throw new Error("Failed to create task");
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
        })) as ReportType[];
    
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
        })) as ReportType[];
    
        return reports;

      } catch (error) {
        console.error("Error fetching reports:", error);
        throw new Error("Failed to fetch reports");
      }
}


export async function getTasks() {
  try {

      const tasksRef = collection(db, "tasks");    
      
      const tasksQuery = query(tasksRef, orderBy("createdAt" , "desc"));
      
      const querySnapshot = await getDocs(tasksQuery);
      
      const tasks = querySnapshot.docs.map((doc) => {
        const data = doc.data();
    
        const createdAt = data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate() 
          : new Date(data.createdAt);
    
        return {
          id: doc.id,
          createdAt,
          ...data,
        };
      }) as taskId[];
  
      return tasks;

    } catch (error) {
      console.error("Error fetching tasks:", error);
      throw new Error("Failed to fetch tasks");
    }
}

export async function getUsers() {
  try {

    const usersRef = collection(db, "users");    
    
    const usersQuery = query(usersRef);
    
    const querySnapshot = await getDocs(usersQuery);
    
    const users = querySnapshot.docs.map((doc) => ({
      id: doc.id, 
      ...doc.data(), 
    })) as User[];

    return users;

  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Failed to fetch users");
  }
}