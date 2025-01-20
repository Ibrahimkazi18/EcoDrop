"use client";

import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import React, { useState } from "react";

interface TaskReport {
    id: string;
    amount: string;
    location: string
    createdAt: string;
    imageUrl: string;
}

export type TaskColumn = {
  id: string;
  agencyId: string;
  report: TaskReport;
  citizenConfirmationStatus: string;
  citizenVerificationImageUrl: string;
  completed: boolean;
  createdAt: string;
  volunteersAssigned: string[];
  volunteersAccepted: string[]
};

const CreateTaskTable = ( {tasks} : {tasks: TaskColumn[]}) => {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const toggleRow = (id: string) => {
      setExpandedRow((prev) => (prev === id ? null : id));
    };

    return (
        <div className="rounded-2xl shadow-lg overflow-hidden dark:shadow-gray-800 mt-6">
          <div className="max-h-98 overflow-y-auto">
            <table className="w-full">
                <thead>
                <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold uppercase tracking-wider">Completed</th>
                    <th className="px-6 py-3 text-left text-sm font-bold uppercase tracking-wider">Citizen Verification</th>
                    <th className="px-6 py-3 text-left text-sm font-bold uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-3 text-left text-sm font-bold uppercase tracking-wider">Location</th>
                </tr>
                </thead>

                <tbody className="divide-y divide-gray-600">
                {tasks.map((task) => (
                        <React.Fragment key={task.id}>
                        {/* Main Row */}
                        <tr
                            className="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-800 transition-colors duration-200"
                            onClick={() => toggleRow(task.id)}
                        >
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {task.completed ? "Yes" : "No"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                            {task.citizenConfirmationStatus}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{task.createdAt}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{task.report.location}</td>
                        </tr>
            
                        {/* Expanded Row */}
                        {expandedRow === task.id && (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="p-4 space-y-4">
                                    {/* Volunteers Assigned and Accepted Columns */}
                                    <div className="grid grid-cols-2 gap-1 mb-6 px-16">
                                        {/* Volunteers Assigned */}
                                        <div className="space-y-2">
                                        <strong className="text-sm font-bold uppercase tracking-wider">Volunteer/s Assigned</strong>
                                        <div className="space-y-1">
                                            {task.volunteersAssigned.map((volunteer, index) => (
                                            <div key={index} className="flex justify-between items-center">
                                                <span className="text-sm">{volunteer}</span>
                                            </div>
                                            ))}
                                        </div>
                                        </div>

                                        {/* Volunteers Accepted */}
                                        <div className="space-y-2">
                                        <strong className="text-sm font-bold uppercase tracking-wider">Accepted</strong>
                                        <div className="space-y-1">
                                            {task.volunteersAssigned.map((volunteer, index) => (
                                            <div key={index} className="flex justify-between items-center">
                                                <span className="text-sm">
                                                {task.volunteersAccepted.includes(volunteer) ? "✔️" : "❌"}
                                                </span>
                                            </div>
                                            ))}
                                        </div>
                                        </div>
                                    </div>

                                    <Separator/>

                                    {/* Image Section */}
                                    <div className="space-y-4">
                                        <div className="flex justify-normal space-x-28 mt-6">
                                        {/* Report Image */}
                                        <div className="flex flex-col items-center">
                                            {task.report.imageUrl ? (
                                                <Image
                                                className="mb-2"
                                                src={task.report.imageUrl}
                                                alt="Report Image"
                                                width={400}
                                                height={400}
                                            />
                                            ) : (
                                            <div className="flex items-center justify-center w-[200px] h-[200px] bg-gray-200 dark:bg-gray-800  rounded mb-2">
                                                <span className="text-sm text-gray-700 dark:text-gray-500">Image not uploaded</span>
                                            </div>
                                            )}
                                            <strong>Report Image</strong>
                                        </div>

                                        {/* Verification Image */}
                                        <div className="flex flex-col items-center">
                                            {task.citizenVerificationImageUrl ? (
                                            <Image
                                                className="mb-2"
                                                src={task.citizenVerificationImageUrl}
                                                alt="Verification Image"
                                                width={200}
                                                height={200}
                                            />
                                            ) : (
                                            <div className="flex items-center justify-center w-[200px] h-[200px] bg-gray-200 dark:bg-gray-800 rounded mb-2">
                                                <span className="text-sm text-gray-700 dark:text-gray-500">Image not uploaded</span>
                                            </div>
                                            )}
                                            <strong>Verification Image</strong>
                                        </div>
                                        </div>
                                    </div>
                                    </div>
                                </td>
                            </tr>

                        )}
                        </React.Fragment>
                    )
                )}
                </tbody>
            </table>
          </div>
        </div>
      );
}

export default CreateTaskTable