"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { ReportType, taskId } from "@/types-db";
import { Timestamp } from "firebase/firestore";

interface fTask {
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
   citizenVerificationImageUrl : string
   citizenVerificationDeadline : Date 
}

const TaskVerification = ({ params }: { params: { citizenId: string } }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<fTask | null>(null);

  const fetchTasks = async () => {
    try {
      const taskRes = await fetch(`/api/getTask?citizenId=${params.citizenId}`);
      const tasksData = await taskRes.json();

      if (!taskRes.ok) throw new Error(tasksData.error || "Failed to fetch tasks");
      if (!Array.isArray(tasksData.tasks)) throw new Error("Tasks data is not an array");

      const formattedTasks = tasksData.tasks.map((task: any) => ({
        id: task.id,
        agencyId: task.agencyId,
        report: task.report,
        volunteersAssigned: task.volunteersAssigned,
        verificationImageUrl: task.verificationImageUrl,
        completed: task.completed,
        citizenConfirmationStatus: task.citizenConfirmationStatus,
        volunteersAccepted: task.volunteersAccepted,
        citizenVerificationImageUrl: task.citizenVerificationImageUrl,
        citizenVerificationDeadline: 
          task.citizenVerificationDeadline && task.citizenVerificationDeadline.seconds
            ? new Date(task.citizenVerificationDeadline.seconds * 1000) 
            : new Date(task.citizenVerificationDeadline), 
        createdAt:
          task.createdAt && task.createdAt.seconds
            ? new Date(task.createdAt.seconds * 1000) 
            : new Date(task.createdAt), 
      }));

      console.log("Formatted Tasks:", formattedTasks);
      setTask(formattedTasks[1]);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [params.citizenId]); 

  useEffect(() => {
    if (!task || !task.citizenVerificationDeadline) return;

    const updateTimer = () => {
      const deadline = task.citizenVerificationDeadline;
      console.log("Corrected Deadline:", deadline);
      setTimeLeft(formatDistanceToNow(deadline, { addSuffix: true }));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); 
    return () => clearInterval(interval);
  }, [task]); 

  const handleApproval = async (isApproved: boolean) => {
    console.log("Task approved:", isApproved);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-16 border rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-2">Task Verification</h2>
      <p className="text-gray-500">Time left: {timeLeft}</p>
      <div className="my-4">
        <Image
          src={task ? task.verificationImageUrl : ""}
          alt="Verification Image"
          width={300}
          height={200}
          className="rounded-lg"
        />
      </div>
      <div className="flex gap-4">
        <button onClick={() => handleApproval(true)} className="px-4 py-2 bg-green-500 text-white rounded-md">
          Approve
        </button>
        <button onClick={() => handleApproval(false)} className="px-4 py-2 bg-red-500 text-white rounded-md">
          Reject
        </button>
      </div>
      <p className="text-sm text-gray-400 mt-2">If no action is taken, the task will be auto-confirmed.</p>
    </div>
  );
};

export default TaskVerification;