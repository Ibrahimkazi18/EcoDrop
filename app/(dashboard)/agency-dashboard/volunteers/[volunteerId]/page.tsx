import { db } from "@/lib/firebase"
import { Volunteer } from "@/types-db"
import { doc, getDoc } from "firebase/firestore"
import VolunteerForm from "./_components/volunteer-form"


const VolunteerAdd = async ({params} : {params : {storeId : string, volunteerId : string}}) => {

  const volunteer = (await getDoc(doc(db, "volunteers", params.volunteerId))).data() as Volunteer

  return (
    <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
            <VolunteerForm initialData={volunteer}/>
        </div>
    </div>
  )
}

export default VolunteerAdd