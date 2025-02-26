"use client"

import { usePathname } from "next/navigation"
import { VolunteerColumn } from "./columns"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreVertical, Trash } from "lucide-react"
import { AlertModal } from "@/components/modal/alert-modal"
import { collection, deleteDoc, doc, getDoc, getDocs, query, where } from "firebase/firestore"
import { db, functions } from "@/lib/firebase"
import { httpsCallable } from "firebase/functions"
import { useToast } from "@/hooks/use-toast"
import { Volunteer } from "@/types-db"

interface CellActionProps {
    data : VolunteerColumn
}

const CellAction = ({ data } : CellActionProps) => {

  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { toast } = useToast();

  const pathName = usePathname();

  const onDelete = async () => {
    try {
      console.log("Delete Button Clicked");
      setIsLoading(true);

      if(!pathName) return

      const parts = pathName.split("/");
      const agencyId = parts[2];
      const volunteerEmail = data.email
      
      const volunteerQuery = query(collection(db, "users"), where("email", "==", volunteerEmail));
      const volunteerSnapshot = await getDocs(volunteerQuery);
      
      if (volunteerSnapshot.empty) {
        console.log("No Volunteer Found");    
        const volunteerQuery = query(collection(db, `agencies/${agencyId}/volunteers`), where("email", "==", volunteerEmail));
        const volunteerSnapshot = await getDocs(volunteerQuery);
        
        if(!volunteerSnapshot.empty){
          const volunteerDoc = volunteerSnapshot.docs[0];
          const volunteerId = volunteerDoc.id;
          const volunteerData = volunteerDoc.data() as Volunteer;

          const hasAssignedTasks = volunteerData.status === "assigned";

          if (hasAssignedTasks) {
            toast({
              title: "Cannot Remove Volunteer",
              description: "This volunteer has assigned tasks and cannot be deleted.",
              variant: "destructive",
            });
            return;
          }

          const volunteerDocRef = doc(db, `agencies/${agencyId}/volunteers`, data.id);
          await deleteDoc(volunteerDocRef);
        }
      }
      
      if(!volunteerSnapshot.empty){
          const volunteerDoc = volunteerSnapshot.docs[0];
          const volunteerId = volunteerDoc.id;
          
          const volunteerDocRef = doc(db, `agencies/${agencyId}/volunteers`, data.id);
          const volunteerDataRef = await getDoc(volunteerDocRef);
          const volunteerData = volunteerDataRef.data() as Volunteer;
          const hasAssignedTasks = volunteerData.status === "assigned";

          if (hasAssignedTasks) {
            toast({
              title: "Cannot Remove Volunteer",
              description: "This volunteer has assigned tasks and cannot be deleted.",
              variant: "destructive",
            });
            return;
          }

          await deleteDoc(volunteerDocRef);
          console.log(data.id);

          await deleteDoc(doc(db, "users", volunteerId));

          const deleteUserFunction = httpsCallable(functions, "deleteUser");
          await deleteUserFunction({ uid: volunteerId }); 

          toast({
            title: "Volunteer Removed",
            description: `${volunteerId} deleted from your Agency.`,
          });
      }

      window.location.reload()
    } catch (error) {
        toast({
          title: "Something Went Wrong",
          description: `Error: ${error}`,
          variant: "destructive"
        });
    } finally {
        // window.location.reload()
        setIsLoading(false)
        setOpen(false)
    }
  }


  return (
    <>
        <AlertModal
            isOpen={open}
            onClose={() => {setOpen(false)}}
            onConfirm={onDelete}
            loading={isLoading}
        />

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={"ghost"} className="h-8 w-8 p-0">
                    <span className="sr-only">Open</span>
                    <MoreVertical className="h-4 w-4"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setOpen(true)}>
                    <Trash className="h-4 w-4 mr-2"/>
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </>
  )
}

export default CellAction