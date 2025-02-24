"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { ReportType } from "@/types-db";
import { Timestamp } from "firebase/firestore";
import Heading from "@/components/heading";
import { Separator } from "@/components/ui/separator";
import { MapPin } from "lucide-react";

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
   agencyName: string
}

const TaskVerification = ({ params }: { params: { citizenId: string } }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<fTask | null>(null);
  const [completedTasks, setCompletedTasks] = useState<fTask[] | null>(null);

  const fetchTasks = async () => {
    try {
      const taskRes = await fetch(`/api/getTask?citizenId=${params.citizenId}`);
      const completedTaskRes = await fetch(`/api/getCitizenTasks?userId=${params.citizenId}`);

      const tasksData = await taskRes.json();
      const completedTaskData = await completedTaskRes.json();

      if (!taskRes.ok) throw new Error(tasksData.error || "Failed to fetch tasks");
      if (!completedTaskRes.ok) throw new Error(completedTaskData.error || "Failed to fetch tasks");
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

      const formattedCompletedTasks = completedTaskData.tasks.map((task: any) => ({
        id: task.id,
        agencyId: task.agencyId,
        agencyName: task.agencyName,
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
      
      console.log("Formatted Completed Tasks:", formattedCompletedTasks);
      setTask(formattedTasks[1]);
      setCompletedTasks(formattedCompletedTasks);
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
    <div className="p-16 mx-auto">
      <Heading 
        title="Task Verification" 
        description="Verify the task completion by the volunteer."
      />

      {task ? (
        <div className="p-16 border rounded-lg shadow-md">
          <h1 className="text-lg font-semibold mb-2">Task Verification</h1>
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
      ) : (
        <div className="mt-6 p-16 border rounded-lg shadow-md">
          <p className="">No Tasks Looking For Verification...</p>
        </div>
      )}

      <Separator className="my-12"/>

      <Heading 
        title="Your Task Completed" 
        description="The reports you raised and which are completed."
      />

      {completedTasks ? (
        <div className="rounded-2xl shadow-lg overflow-hidden dark:shadow-gray-800 mt-6">
          <div className="max-h-98 overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Number Of Volunteers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Completed By
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-600">
                {completedTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-800 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <MapPin className="inline-block w-4 h-4 mr-2 text-green-700"/>
                      {task.report.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {task.report.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                      {task.volunteersAccepted.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {task.agencyName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl shadow-lg overflow-hidden dark:shadow-gray-800 mt-6">
          <p className="p-6">No Tasks Completed...</p>
        </div>
      )}
    </div>
  );
};

export default TaskVerification;