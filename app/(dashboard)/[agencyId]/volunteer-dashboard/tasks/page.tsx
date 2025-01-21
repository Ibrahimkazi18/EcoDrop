"use client";

import { useEffect, useState } from "react";
import CreateTaskTable, { TaskColumn } from "./components/columns"; 
import Heading from "@/components/heading";
import { Separator } from "@/components/ui/separator";
import { onAuthStateChanged } from "firebase/auth";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";

const TaskPage = ({params} : {params : {agencyId : string}}) => {   
    const [tasks, setTasks] = useState<TaskColumn[]>([]);
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
          createdAt: task.createdAt instanceof Date
              ? task.createdAt.toISOString().split("T")[0]
              : new Date(task.createdAt.seconds * 1000).toISOString().split("T")[0]
      }))

      console.log("FormattedTasks: ", formattedTasks)
      setTasks(formattedTasks)
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
    
  if(!isMounted) return null;

  if (loading) return <p>Loading volunteers...</p>;

  if (!tasks || tasks.length === 0) return <p>No tasks available.</p>;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading title={`Tasks(${tasks.length})`} description="View Your Tasks..." />

        <Separator className="mb-6"/>

        <CreateTaskTable tasks={tasks} />
      </div>
    </div>
  );
};

export default TaskPage;
