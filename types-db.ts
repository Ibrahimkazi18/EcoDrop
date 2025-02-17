import { Timestamp } from "firebase/firestore";

export type Role = "citizen" | "volunteer" | "agency";

export type ToggleSidebarType = (isOpen: boolean) => void;

export interface User {
  id: string;
  email: string;
  username: string;
  role: Role;
  agencyId ?: string;
  volunteerId?: string;
  createdAt: Date;
}

export interface Citizen extends User {
  role: "citizen";
  communityIds: string[];      
  badResponses: number;
  points: number;             
  totalPoints: number;             
  level: number;
  exp: number;
  streak: number;
  lastReportDate: Date | null;
}

export interface Volunteer extends User {
  role: "volunteer";
  agencyId: string;            
  status: "available" | "working" | "unavailable";
  tasksAssigned: string[];    
  hasSetPermanentPassword: boolean; 
  points: number;
  totalPoints: number;             
  level: number;
  exp: number;
  streak: number;
  lastReportDate: Date | null;
}

export interface Agency extends User {
  role: "agency";
  contactInfo: {
    phone: string;
    address: string;
  };
  volunteers: string[];        
  ratings: number[];           
  badResults: number;
  isBanned: boolean;
  banStartDate?: Timestamp;
  banEndDate?: Timestamp;
}

export interface Notification {
  id: string;
  isRead: boolean;
  message: string;
  type: string
  createdAt: Date;
  userId: string;
}

export interface ReportType {
  id: string;
  userId: string,
  location: string,
  wasteType: string,
  amount: string,
  imageUrl: string,
  verificationResult: string,
  status : string,
  createdAt: Date | Timestamp
}

export interface taskId {
 id: string
 agencyId: string
 report: ReportType
 volunteersAssigned: [volunteerId: string]
 volunteersAccepted: [volunteerId: string]
 createdAt: Date | Timestamp
 completed: boolean
 verificationImageUrl: string
 completedBy ?: string | string[]
 citizenConfirmationStatus?: "pending" | "confirmed" | "notProperlyDone"
 citizenVerificationImageUrl?: string
 citizenVerificationDeadline?: Date
}

export interface VolunteerTask {
  id: string
  volunteerId: string
  status: "pending" | "accepted" | "completed" 
}

export interface Messages {
  id: string
  senderId: string
  message: string
  createdAt: Date | Timestamp
}