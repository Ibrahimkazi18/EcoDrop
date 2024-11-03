"use client"

import { usePathname, useRouter } from "next/navigation"
import { VolunteerColumn } from "./columns"
import { useEffect, useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Copy, MoreVertical, Trash } from "lucide-react"
import { AlertModal } from "@/components/modal/alert-modal"
import toast from "react-hot-toast"
import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore"
import { db, functions } from "@/lib/firebase"
import { httpsCallable } from "firebase/functions"

interface CellActionProps {
    data : VolunteerColumn
}

const CellAction = ({ data } : CellActionProps) => {

  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const onCopy = (id : string) => {
    navigator.clipboard.writeText(id)
    toast.success("Volunteer Id Copied to Clipboard")
  }
  
  const pathName = usePathname();

  const copyId = () => {
    const parts = pathName.split("/");
    const agencyId = parts[2];
    console.log("Cell Action", agencyId);
  }

  useEffect(() => {
    copyId();
  }, [])

  const onDelete = async () => {
    try {
      console.log("Delete Button Clicked");
      setIsLoading(true);


      const parts = pathName.split("/");
      const agencyId = parts[2];
      console.log(agencyId);
      const volunteerEmail = data.email
      console.log(volunteerEmail);
      
      // 1. Fetch the volunteer document from the users collection based on email
      const volunteerQuery = query(collection(db, "users"), where("email", "==", volunteerEmail));
      const volunteerSnapshot = await getDocs(volunteerQuery);
      
      if(!volunteerSnapshot.empty){
          const volunteerDoc = volunteerSnapshot.docs[0];
          const volunteerId = volunteerDoc.id;
          console.log(volunteerId);
          
          //Deleting from /agency/{agencyId}/volunteers collection
          const volunteerDocRef = doc(db, `agencies/${agencyId}/volunteers`, data.id);
          await deleteDoc(volunteerDocRef);
          console.log(data.id);

        //Deleting from users collection
        await deleteDoc(doc(db, "users", volunteerId));

        //Deleting from Firebase Authentication
        const deleteUserFunction = httpsCallable(functions, "deleteUser");
        await deleteUserFunction({ uid: volunteerId }); 
      }

      toast.success("Volunteer Removed")
      router.refresh()

    } catch (error) {
        toast.error("Something went wrong")
    } finally {
        router.refresh()
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
                <DropdownMenuItem onClick={copyId}>
                    <Copy className="h-4 w-4 mr-2"/>
                    Copy Id
                </DropdownMenuItem>

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