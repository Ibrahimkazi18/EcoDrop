"use client";

import { useEffect, useState } from "react";
import CreateTaskTable, { TaskColumn } from "./components/columns";
import Heading from "@/components/heading";
import { Separator } from "@/components/ui/separator";
import { Loader, RefreshCw } from "lucide-react";

const TaskPage = ({params} : {params : {agencyId : string}}) => {
  const [tasks, setTasks] = useState<TaskColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      const [taskRes] = await Promise.all([
          fetch(`/api/getTasks?agencyId=${params.agencyId}`),
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
    fetchTasks();
  }, [params.agencyId]);

    useEffect(() => {
        console.log("tasks: ", tasks)
    }, [tasks])

    const handleRefresh = async () => {
      setIsRefreshing(true);
      await fetchTasks();
      setIsRefreshing(false);
    };

  if (loading) return (
    <div className="flex-col">
    <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading title={`Tasks(${tasks.length})`} description="View tasks of your agencies..." />

        <Separator className="mb-6"/>

        <CreateTaskTable tasks={tasks} />
      </div>
    </div>
  );

  if (!tasks || tasks.length === 0) return <p>No tasks available.</p>;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading title={`Tasks(${tasks.length})`} description="View tasks of your agencies..." />

          <button 
            onClick={handleRefresh}
            className="flex items-center px-3 py-2 text-sm font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            {isRefreshing ? (
              <Loader className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-5 w-5 mr-2" />
            )}
            Refresh
          </button>
        </div>

        <Separator className="mb-6"/>

        <CreateTaskTable tasks={tasks} />
      </div>
    </div>
  );
};

export default TaskPage;
