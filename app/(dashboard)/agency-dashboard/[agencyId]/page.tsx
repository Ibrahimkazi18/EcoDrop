"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Star, Users, CheckCircle, Hourglass } from "lucide-react";
import React, { useEffect, useState } from "react";

interface MonthlyData {
  month: string;
  tasks: number;
}

interface Vol {
  id: string;
  username: string;
  tasksCompleted: number;
}

const DashboardStats = ({params} : {params : {agencyId: string}} ) => {
  const [totalTasks, setTotalTasks] = useState<number | null>(null);
  const [totalVolunteers, setTotalVolunteers] = useState<number | null>(null);
  const [agencyRating, setAgencyRating] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [topVolunteers, setTopVolunteers] = useState<Vol[]>([]);
  const [tasksPending, setTasksPending] = useState<number | null>(null);
  const [tasksVerified, setTasksVerified] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [response] = await Promise.all([
          fetch(`/api/agencyDetails?agencyId=${params.agencyId}`),
        ]);
        const data = await response.json();
        console.log(data);
        
        console.log(data.monthlyData)
        setTotalTasks(data.totalTasks);
        setTotalVolunteers(data.totalVolunteers);
        setAgencyRating(data.agencyRating);
        setMonthlyData(data.monthlyData);
        setTopVolunteers(data.topVolunteers);
        setTasksPending(data.tasksPending);
        setTasksVerified(data.tasksVerified);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    fetchData();
  }, []);

  if (
    totalTasks === null ||
    totalVolunteers === null ||
    agencyRating === null ||
    tasksPending === null ||
    tasksVerified === null
  ) {
    return <p className="text-center text-lg font-semibold">Loading...</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {topVolunteers.length > 0 && (
        <>
          <StatCard title="Total Volunteers" value={totalVolunteers} icon={<Users className="w-8 h-8 text-blue-600" />} />
          <StatCard title="Agency Rating" value={agencyRating} icon={<Star className="w-8 h-8 text-yellow-500" />} />
          <StatCard title="Total Tasks" value={totalTasks} icon={<CheckCircle className="w-8 h-8 text-green-600" />} />
          <StatCard title="Tasks Pending" value={tasksPending} icon={<Hourglass className="w-8 h-8 text-red-500" />} />
          <StatCard title="Tasks Completed" value={tasksVerified} icon={<CheckCircle className="w-8 h-8 text-green-400" />} />
          
          <Card className="col-span-2 lg:col-span-3 xl:col-span-4">
            <CardHeader>
              <CardTitle>Tasks Completed (Last 12 Months)</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="#4f46e5" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Top Volunteers</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {topVolunteers.map((vol, index) => (
                  <li key={vol.id} className="flex justify-between p-2 border rounded-lg bg-gray-100 dark:bg-gray-800">
                    <span className="font-semibold">{index + 1}. {vol.username}</span>
                    <span className="text-blue-600 font-semibold">{vol.tasksCompleted} tasks</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

        </>
      )}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-lg font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold">{value}</p>
    </CardContent>
  </Card>
);

export default DashboardStats;