import { useEffect, useState } from "react";
import { Volunteer } from "@/types-db";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal";
import { createColumns, ReportColumn } from "./columns";
import RequestClient from "./client";
import { createNotification, createTask } from "@/hooks/create-report";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";

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
  selectedVolunteers: Volunteer[];
  setSelectedVolunteers: React.Dispatch<React.SetStateAction<Volunteer[]>>;
  openAssignModal: (report: ReportColumn) => void;
  closeAssignModal: () => void;
}) => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [reports, setReports] = useState<ReportColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { toast } = useToast();

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
        userId: report.userId,
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

  const toggleVolunteerSelection = (volunteer : Volunteer) => {
    setSelectedVolunteers((prevState) => {
      const isAlreadySelected = prevState.some((v) => v.id === volunteer.id);
    if (isAlreadySelected) {
      return prevState.filter((v) => v.id !== volunteer.id);
    } else {
      return [...prevState, volunteer];
    }
    });
  };

  const submitAssignment = async () => {
    const notificationPromises = volunteers.map((volunteer) => {

      const notification = createNotification(volunteer.id, "You have been assigned a new task for report, please check tasks!!", "task assignment")
    })

    await Promise.all(notificationPromises);

    await createTask(params.agencyId, selectedReport , selectedVolunteers)

    closeAssignModal();

    toast({
      title: "Task Assigned Successfully!",
      description: `${selectedReport?.id} assigned to: ${selectedVolunteers.map((v) => `${v.username}, `)}`
    })

    await fetchVolunteersAndReports()
  };

  if (loading) {
    return (
        <div className="pt-14 px-20 mx-auto flex items-center justify-center">
            <Loader className="animate-spin h-8 w-8 "/>
        </div>
    )
  }
  if (error) return <p>Error: {error}</p>;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchVolunteersAndReports();
    setIsRefreshing(false);
  };

  const columns = createColumns(openAssignModal);

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <RequestClient data={reports} columns={columns} isRefreshing={isRefreshing} handleRefresh={handleRefresh} />
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
                checked={selectedVolunteers.some((v) => v.id === volunteer.id)}
                onCheckedChange={() => toggleVolunteerSelection(volunteer)}
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
