import { db } from "@/lib/firebase";
import { Volunteer } from "@/types-db";
import { doc, getDoc } from "firebase/firestore";
import VolunteerForm from "./_components/volunteer-form";

const VolunteerAdd = async ({ params }: { params: { agencyId: string; volunteerId: string } }) => {

  const volunteerDocRef = doc(db, "agencies", params.agencyId, "volunteers", params.volunteerId);
  console.log(params.agencyId)

  const volunteerSnapshot = await getDoc(volunteerDocRef);

  const volunteer = volunteerSnapshot.data() as Volunteer;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <VolunteerForm initialData={volunteer} agencyId={params.agencyId} />
      </div>
    </div>
  );
};

export default VolunteerAdd;
