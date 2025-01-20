import { Timestamp } from "firebase/firestore";

export type Role = "citizen" | "volunteer" | "agency";

export type ToggleSidebarType = (isOpen: boolean) => void;

// General User Interface
export interface User {
  id: string;
  email: string;
  username: string;
  role: Role;
  agencyId ?: string;
  volunteerId?: string;
  createdAt: Date;
}

// Citizen Interface
export interface Citizen extends User {
  role: "citizen";
  points: number;              // Points earned by reporting e-waste
  communityIds: string[];      // Communities the citizen has joined
  badResponses: number
}

// Volunteer Interface
export interface Volunteer extends User {
  role: "volunteer";
  agencyId: string;            // The agency the volunteer is associated with
  status: "available" | "working" | "unavailable";
  tasksAssigned: string[];     // IDs of tasks assigned to the volunteer
  hasSetPermanentPassword: boolean; // Flag to track if they have set their password
  points: number;
}

// Agency Interface
export interface Agency extends User {
  role: "agency";
  contactInfo: {
    phone: string;
    address: string;
  };
  volunteers: string[];        // List of volunteer IDs associated with the agency
  ratings: number[];           // Array of ratings given by citizens
  badResults: number;
  isBanned: boolean;
  banStartDate?: Timestamp;
  banEndDate?: Timestamp;
}

// E-Waste Request Interface
export interface EWasteRequest {
  id: string;
  citizenId: string;
  imageUrl: string;
  status: "pending" | "assigned" | "completed";
  assignedVolunteers: string[];   // List of volunteer IDs assigned to this request
  completionProofUrl?: string;    // URL of the image after cleaning
  pointsAwarded: number;
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