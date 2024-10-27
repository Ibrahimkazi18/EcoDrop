import { Timestamp } from "firebase/firestore";

export type Role = "citizen" | "volunteer" | "agency";

export type ToggleSidebarType = (isOpen: boolean) => void;

// General User Interface
export interface User {
  id: string;
  email: string;
  username: string;
  role: Role;
  createdAt: Date;
}

// Citizen Interface
export interface Citizen extends User {
  role: "citizen";
  points: number;              // Points earned by reporting e-waste
  communityIds: string[];      // Communities the citizen has joined
}

// Volunteer Interface
export interface Volunteer extends User {
  role: "volunteer";
  agencyId: string;            // The agency the volunteer is associated with
  status: "available" | "working" | "unavailable";
  tasksAssigned: string[];     // IDs of tasks assigned to the volunteer
  temporaryPassword: string;   // Initially generated password
  hasSetPermanentPassword: boolean; // Flag to track if they have set their password
}

// Agency Interface
export interface Agency extends User {
  role: "agency";
  agencyName: string;
  contactInfo: {
    phone: string;
    address: string;
  };
  volunteers: string[];        // List of volunteer IDs associated with the agency
  ratings: number[];           // Array of ratings given by citizens
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
