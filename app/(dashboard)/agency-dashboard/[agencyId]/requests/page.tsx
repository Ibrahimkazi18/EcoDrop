"use client"

import { useState } from "react";
import RequestPage from "./components/requestPage";
import { ReportColumn } from "./components/columns";
import { Volunteer } from "@/types-db";


const RequestPageWrapper = ({ params }: { params: { agencyId: string } }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportColumn | null>(null);
  const [selectedVolunteers, setSelectedVolunteers] = useState<Volunteer[]>([]);

  const openAssignModal = (report: ReportColumn) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const closeAssignModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null)
    setSelectedVolunteers([]);
  };

  return (
    <div>
      <RequestPage
        params={params}
        isModalOpen={isModalOpen}
        selectedReport={selectedReport}
        selectedVolunteers={selectedVolunteers}
        setSelectedVolunteers={setSelectedVolunteers}
        openAssignModal={openAssignModal}
        closeAssignModal={closeAssignModal}
      />
    </div>
  );
};

export default RequestPageWrapper;
