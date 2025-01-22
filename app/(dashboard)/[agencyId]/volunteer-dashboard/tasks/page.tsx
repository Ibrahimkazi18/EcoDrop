"use client";

import { useEffect, useState } from "react";
import CreateTaskTable, { TaskColumn } from "./components/columns"; 
import Heading from "@/components/heading";
import { Separator } from "@/components/ui/separator";
import { onAuthStateChanged } from "firebase/auth";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import Image from "next/image";

interface currVol {
  id : string;
  agencyId: string;
  status: string;
  points: number;
}

const TaskPage = ({params} : {params : {agencyId : string}}) => {   
    const [tasks, setTasks] = useState<TaskColumn[]>([]);
    const [currentVolunteer, setcurrentVolunteer] = useState<currVol>();
    const [assignedTask, setAssignedTask] = useState<TaskColumn | null>(null);
    const [loading, setLoading] = useState(true);
    

    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const pathName = usePathname() as string;

  const fetchTasks = async () => {

    if (!currentUser) {
        console.error("No user ID available to fetch tasks");
        return;
    }

    try {
      const userId = currentUser;

      const [taskRes] = await Promise.all([
          fetch(`/api/getVolunteerTasks?agencyId=${params.agencyId}&userId=${userId}`),
        ]);

      const tasksData = await taskRes.json();

      const [volunteerRes] = await Promise.all([
          fetch(`/api/getVolunteer?agencyId=${params.agencyId}&userId=${userId}`),
        ]);

      const volunteersData = await volunteerRes.json();

      if (!taskRes.ok) throw new Error(tasksData.error || "Failed to fetch tasks");
      if (!volunteerRes.ok) throw new Error(tasksData.error || "Failed to fetch tasks");
      if (!Array.isArray(tasksData.tasks)) throw new Error("Tasks data is not an array");

      const formattedVolunteer = {
        id: volunteersData.id,
        agencyId: volunteersData.agencyId,
        status: volunteersData.status,
        points: volunteersData.points,
      } as currVol;

      setcurrentVolunteer(formattedVolunteer);

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
          createdAt: task.createdAt instanceof Date
              ? task.createdAt.toISOString().split("T")[0]
              : new Date(task.createdAt.seconds * 1000).toISOString().split("T")[0]
      })) as TaskColumn[]

      console.log("FormattedTasks: ", formattedTasks)
      const activeTask = formattedTasks.find((task) => !task.completed);
      setAssignedTask(activeTask || null);

      setTasks(formattedTasks.filter((task) => task.completed));
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user.uid);
      } else {
        setCurrentUser(null);
      }
    });

    setIsMounted(true);

    return () => unsubscribe();
  }, [pathName]);

  useEffect(() => {
    setIsMounted(true);
    if (currentUser) {
        fetchTasks();
    }
}, [currentUser, params.agencyId]);


const handleTaskAccept = async () => {
  try {
    if (!assignedTask) return;

    await fetch(`/api/acceptTask`, {
      method: "POST",
      body: JSON.stringify({ taskId: assignedTask.id }),
    });

    toast.success("Task accepted!");
    fetchTasks();
  } catch (error) {
    console.error("Error accepting task:", error);
  }
};
    
  if(!isMounted) return null;

  if (loading) return <p>Loading volunteers...</p>;

  if (!tasks || tasks.length === 0 && !assignedTask) return <p>No tasks available.</p>;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-16 pt-6">
        <div className="mb-6">
          {assignedTask ?
            (<>
              <Heading title={`Assigned Tasks`} description="View Your Assigned Tasks..." />
            </>) : (
              <Heading title={`Assigned Tasks`} description="You are not assigned any task..." />
            )}

            <Separator className="mb-12 mt-4"/>

            {assignedTask ? (
              <div className="border-2 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold">{assignedTask.report.location}</h2>

                <div className="flex justify-between">
                  <div className="space-y-4">
                    <p className="">Task ID: {assignedTask.id}</p>
                    <p className="">
                      Status: {assignedTask.completed ? "Completed" : "Pending"}
                    </p>
                    <p className="">
                      Amount: {assignedTask.report.amount}
                    </p>
                    <p className="">
                      Issued At: {assignedTask.report.createdAt}
                    </p>
                    <p className="">
                      No. of Volunteers Assigned: {assignedTask.volunteersAssigned.length}
                    </p>

                    {currentVolunteer && !assignedTask.volunteersAccepted.includes(currentVolunteer?.id) && (
                      <Button
                        onClick={handleTaskAccept}
                        className=" px-4 py-2 rounded-lg"
                        variant={"outline"}
                      >
                        Accept Task
                      </Button>
                    )}
                  </div>

                  <div> 
                      <Image src={assignedTask.report.imageUrl} alt="image not loaded" width={400} height={400}/>
                  </div>
                </div>
              </div>
            ) : (
              <p>No assigned tasks at the moment.</p>
            )}
        </div>

        <Separator />


        {tasks.length > 0 ?
          (<>
            <Heading title={`Completed Tasks(${tasks.length})`} description="View Your Completed Tasks..." />
            <Separator className="mb-6"/>
            <CreateTaskTable tasks={tasks} />
          </>) : (
            <Heading title={`Completed Tasks(${tasks.length})`} description="You have no completed tasks..." />
          )}
        
      </div>
    </div>
  );
};

export default TaskPage;
