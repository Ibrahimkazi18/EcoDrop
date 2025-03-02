"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Citizen, ReportType } from "@/types-db";
import { Footprints } from "lucide-react";
import LandingDivider from "@/app/(landing)/components/LandingDivider";

interface GraphData {
  month: string;
  reports: number;
}

const badgeData = [
  { name: "rookie", image: "/rookie.png", level: 1 },
  { name: "pro", image: "/pro.png", level: 5 },
  { name: "expert", image: "/expert.png", level: 10 },
  { name: "master", image: "/master.png", level: 20 },
];

const CitizenStats = ({ params }: { params: { citizenId: string } }) => {
  const [loading, setLoading] = useState(true);
  const [citizen, setCitizen] = useState<Citizen>();
  const [data, setData] = useState<GraphData[]>([]);
  const [rank, setRank] = useState<"rookie" | "pro" | "expert" | "master">("rookie");
  const [reports, setReports] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
  const [carbonSaved, setCarbonSaved] = useState<number>(0);
  const [selectedBadge, setSelectedBadge] = useState<{ name: string; image: string; level: number } | null>(null);

  const fetchUserData = async () => {
    const [citizensRes, reportsRes] = await Promise.all([
      fetch(`/api/getCitizens`),
      fetch(`/api/getAllReports`),
    ]);

    const citizensData = await citizensRes.json();
    const reportsData = await reportsRes.json();

    if (!citizensData) throw new Error(citizensData.error || "Failed to fetch citizenData");
    if (!reportsData) throw new Error(reportsData.error || "Failed to fetch reportsData");

    const finalcitizens = citizensData.citizens as Citizen[];
    const thisUser = finalcitizens.find((citizen) => citizen.id === params.citizenId);

    if (thisUser) {
      setCitizen(thisUser);
      setRank(thisUser.rank);
      setPoints(thisUser.points);
      setReports(thisUser.reports ? thisUser.reports.length : 0);
    }

    const allReports: ReportType[] = reportsData.reports;
    const userReports = allReports.filter((report) => report.userId === params.citizenId);

    const totalEwasteKg = userReports.reduce((total, report) => {
      // Extract the numeric part of the amountOfWaste (remove " kg" and convert to number)
      const amount = parseFloat(report.amount.replace(/[^\d.-]/g, ''));

      // Add the extracted value to the total
      return total + (isNaN(amount) ? 0 : amount);
    }, 0);

    // After the reduce function finishes, update the state
    setCarbonSaved(totalEwasteKg);

    const last12MonthsData = generateLast12MonthsData(userReports);
    setData(last12MonthsData);
    setLoading(false);
  };

  const generateLast12MonthsData = (userReports: ReportType[]) => {
    const currentDate = new Date();
    const months: GraphData[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - i);

      const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
      months.push({ month: monthYear, reports: 0 });
    }

    userReports.forEach((report) => {
      const reportDate = report.createdAt instanceof Date
        ? new Date(report.createdAt.toISOString().split("T")[0])
        : new Date(new Date(report.createdAt.seconds * 1000).toISOString().split("T")[0]);
      const monthYear = `${reportDate.toLocaleString("default", { month: "short" })} ${reportDate.getFullYear()}`;

      const index = months.findIndex((m) => m.month === monthYear);
      if (index !== -1) {
        months[index].reports += 1;
      }
    });

    return months;
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Citizen Stats</h2>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 text-center flex flex-col items-center shadow-[0px_0px_5px_0px_rgba(255,255,255,1)] justify-center h-full relative group perspective-1000 space-y-2">
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
          <div className="grid grid-cols-3 gap-4 row-span-1">
            <Card className="p-4 text-center shadow-[0px_0px_5px_0px_rgba(255,255,255,1)]">
              <p className="text-xl font-semibold md:text-lg">Reports Submitted</p>
              <div className="text-3xl">{loading ? <Skeleton className="w-16 h-8 mx-auto" /> : reports}</div>
            </Card>
            <Card className="p-4 text-center shadow-[0px_0px_5px_0px_rgba(255,255,255,1)]">
              <p className="text-xl font-semibold">Carbon Saved</p>
              <div className="text-3xl">{loading ? <Skeleton className="w-16 h-8 mx-auto" /> : carbonSaved} kg</div>
            </Card>
            <Card className="p-4 text-center shadow-[0px_0px_5px_0px_rgba(255,255,255,1)]">
              <p className="text-xl font-semibold">Points Earned</p>
              <div className="text-3xl">{loading ? <Skeleton className="w-16 h-8 mx-auto" /> : points}</div>
            </Card>
          </div>

          {/* All Badges Section */}
          <Card className="p-4 mt-4 h-40 shadow-[0px_0px_5px_0px_rgba(255,255,255,1)]">
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
      <div className="mt-16">
        <h3 className="text-lg font-semibold">Reports Overview (Last 12 Months)</h3>
        {loading ? (
          <Skeleton className="w-full h-32 mt-4 bg-indigo-50 dark:fill-slate-700" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="reports" fill="#13a142" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default CitizenStats;
