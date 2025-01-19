"use client"

import { useState } from "react";
import RequestPage from "./components/requestPage";
import { ReportColumn } from "./components/columns";


const RequestPageWrapper = ({ params }: { params: { agencyId: string } }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportColumn | null>(null);
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);

  // Function to open the modal and set the selected report
  const openAssignModal = (report: ReportColumn) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  // Function to close the modal
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
