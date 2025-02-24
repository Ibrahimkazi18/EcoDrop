"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {  taskId, Volunteer } from "@/types-db";
import { useVolunteerLocation } from "@/components/volunteerLocationProvider";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface GraphData {
    month: string;
    tasks: number;
}

const badgeData = [
  { name: "rookie", image: "/rookie.png", level: 1 },
  { name: "pro", image: "/pro.png", level: 5 },
  { name: "expert", image: "/expert.png", level: 10 },
  { name: "master", image: "/master.png", level: 20 },
];

const VolunteerDashboard = ({ params }: { params: { agencyId: string } }) => {
  const location = useVolunteerLocation();
  const [loading, setLoading] = useState(true);
  const [volunteer, setVolunteer] = useState<Volunteer>();
  const [data, setData] = useState<GraphData[]>([]);
  const [rank, setRank] = useState<"rookie" | "pro" | "expert" | "master">("rookie");
  const [tasks, setTasks] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
  const [selectedBadge, setSelectedBadge] = useState<{ name: string; image: string; level: number } | null>(null);

  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.log("Returning")
      return
    };

    const [volunteersRes] = await Promise.all([
      fetch(`/api/getCurVolunteer?agencyId=${params.agencyId}&userId=${user.uid}`),
    ]);

    const volunteersData = await volunteersRes.json();

    if (!volunteersData) throw new Error(volunteersData.error || "Failed to fetch volunteerData");

    const finalvolunteers = volunteersData.volunteer as Volunteer;
    console.log("Final Volunteer", finalvolunteers);
    const finalTasks = volunteersData.volunteerTasks as taskId[];

    if (finalvolunteers) {
      setVolunteer(finalvolunteers);
      setRank(finalvolunteers.rank);
      setPoints(finalvolunteers.points);
      setTasks(finalTasks.length);
    }

    const last12MonthsData = generateLast12MonthsData(finalTasks);
    setData(last12MonthsData);
    setLoading(false);
  };

  const generateLast12MonthsData = (userTasks: taskId[]) => {
    const currentDate = new Date();
    const months: GraphData[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - i);

      const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
      months.push({ month: monthYear, tasks: 0 });
    }

    userTasks.forEach((task) => {
        const taskDate = task.createdAt instanceof Date
        ? new Date(task.createdAt.toISOString().split("T")[0])
        : new Date(new Date(task.createdAt.seconds * 1000).toISOString().split("T")[0]);
      const monthYear = `${taskDate.toLocaleString("default", { month: "short" })} ${taskDate.getFullYear()}`;

      const index = months.findIndex((m) => m.month === monthYear);
      if (index !== -1) {
        months[index].tasks += 1;
      }
    });

    return months;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData();
      }
    });
  
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Volunteer Stats</h2>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 text-center flex flex-col items-center justify-center h-full relative group perspective-1000 space-y-2">
            <p className="text-xl font-semibold">Current Rank</p>
            {loading ? (
                <Skeleton className="w-24 h-24" />
            ) : (
                <div className="transition-transform duration-300 transform-style-3d">
                <img 
                    src={`/${rank}.png`} 
                    alt={rank} 
                    className="w-24 h-24" 
                />
                </div>
            )}
            <Badge variant="default" className="capitalize">{loading ? <Skeleton className="w-16 h-8" /> : rank}</Badge>
        </Card>

        <div className="grid-rows-2 w-full col-span-2">
          <div className="grid grid-cols-2 gap-4 row-span-1">
            <Card className="p-4 text-center">
              <p className="text-xl font-semibold">Tasks Completed</p>
              <div className="text-3xl">{loading ? <Skeleton className="w-16 h-8 mx-auto" /> : tasks}</div>
            </Card>

            <Card className="p-4 text-center">
              <p className="text-xl font-semibold">Points Earned</p>
              <div className="text-3xl">{loading ? <Skeleton className="w-16 h-8 mx-auto" /> : points}</div>
            </Card>
          </div>

          {/* All Badges Section */}
          <Card className="p-4 mt-4 h-40">
            <h3 className="text-lg font-semibold">All Badges</h3>
            <div className="grid grid-cols-4 gap-4 ">
              {badgeData.map((badge, index) => (
                <Dialog key={index}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" onClick={() => setSelectedBadge(badge)} className="flex flex-col items-center gap-2 h-[6.4rem]">
                      <img src={badge.image} alt={badge.name} className="w-12 h-12 mt-1" />
                      <span className="capitalize text-sm">{badge.name}</span>
                      <span className="text-xs text-gray-500">Level {badge.level}</span>
                    </Button>
                  </DialogTrigger>

                  {selectedBadge && (
                    <DialogContent>
                      <div className="flex flex-col items-center text-center">
                        <img src={selectedBadge.image} alt={selectedBadge.name} className="w-32 h-32" />
                        <h3 className="text-lg font-semibold mt-2 capitalize">{selectedBadge.name} Badge</h3>
                        <p className="text-gray-500">Unlocked at Level {selectedBadge.level}</p>
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Graph Section */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold">Tasks Overview (Last 12 Months)</h3>
        {loading ? (
          <Skeleton className="w-full h-32 mt-4 bg-indigo-50 dark:fill-slate-700" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tasks" fill="#13a142" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default VolunteerDashboard;