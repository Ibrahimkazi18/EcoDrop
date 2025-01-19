import { useEffect, useState } from "react";
import { Volunteer } from "@/types-db";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal";
import { createColumns, ReportColumn } from "./columns";
import RequestClient from "./client";
import { createNotification, createTask } from "@/hooks/create-report";
import toast from "react-hot-toast";

const RequestPage = ({
  params,
  isModalOpen,
  selectedReport,
  selectedVolunteers,
  setSelectedVolunteers,
  openAssignModal,
  closeAssignModal,
}: {
  params: { agencyId: string };
  isModalOpen: boolean;
  selectedReport: ReportColumn | null;
  selectedVolunteers: string[];
  setSelectedVolunteers: React.Dispatch<React.SetStateAction<string[]>>;
  openAssignModal: (report: ReportColumn) => void;
  closeAssignModal: () => void;
}) => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [reports, setReports] = useState<ReportColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVolunteersAndReports = async () => {
    try {
      const [volunteersRes, reportsRes] = await Promise.all([
        fetch(`/api/getVolunteers?agencyId=${params.agencyId}`),
        fetch(`/api/getReports`),
      ]);

      const volunteersData = await volunteersRes.json();
      const reportsData = await reportsRes.json();

      if (!volunteersRes.ok) throw new Error(volunteersData.error || "Failed to fetch volunteers");
      if (!reportsRes.ok) throw new Error(reportsData.error || "Failed to fetch reports");

      const finalVolunteers = volunteersData.volunteers as Volunteer[]
      
      const formattedReports = reportsData.reports.map((report: any) => ({
        id: report.id,
        location: report.location,
        amount: report.amount,
        imageUrl: report.imageUrl,
        createdAt: report.createdAt instanceof Date
        ? report.createdAt.toISOString().split("T")[0]
        : new Date(report.createdAt.seconds * 1000).toISOString().split("T")[0]
      }));
      
      setReports(formattedReports);
      setVolunteers(finalVolunteers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteersAndReports();
  }, [params.agencyId]);

  const toggleVolunteerSelection = (volunteerId: string) => {
    setSelectedVolunteers((prevState) => {
      const newState = prevState.includes(volunteerId)
        ? prevState.filter((id) => id !== volunteerId)
        : [...prevState, volunteerId];
      return newState;
    });
  };

  const submitAssignment = async () => {
    const notificationPromises = volunteers.map((volunteer) => {

      const notification = createNotification(volunteer.id, "You have been assigned a new task for report, please check tasks!!", "task assignment")
    })

    await Promise.all(notificationPromises);

    await createTask(params.agencyId, selectedReport , volunteers)

    closeAssignModal();

    toast.success("Task assigned successfully!")

    await fetchVolunteersAndReports()
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  const columns = createColumns(openAssignModal);

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <RequestClient data={reports} columns={columns} />
      </div>

      <Modal
        title="Select Volunteers"
        description="Select volunteers to assign the task to..."
        isOpen={isModalOpen}
        onClose={closeAssignModal}
      >
        <div>
          {volunteers.map((volunteer) => (
            <div key={volunteer.id} className="flex items-center space-x-2 mb-2">
              <Checkbox
                checked={selectedVolunteers.includes(volunteer.id)}
                onCheckedChange={() => toggleVolunteerSelection(volunteer.id)}
              />
              <span>{volunteer.username}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <Button onClick={submitAssignment} disabled={selectedVolunteers.length === 0}>
            Assign Task
          </Button>
          <Button variant="outline" onClick={closeAssignModal}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default RequestPage;
