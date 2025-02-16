"use client"

import Heading from "@/components/heading"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Volunteer } from "@/types-db"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { db } from "@/lib/firebase"
import { addDoc, arrayUnion, collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore"
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast"

interface VolunteerFormProps {
  initialData: Volunteer
  agencyId: string  
}

const formSchema = z.object({
  username: z.string().min(1),
  email: z.string().min(1),
  agencyId: z.string().min(1),
  createdAt: z.date().optional(),
})

const newDate = new Date();

const VolunteerForm = ({ initialData, agencyId }: VolunteerFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const { toast } = useToast();

  const [isManualEntry, setIsManualEntry] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [fileData, setFileData] = useState<{ username: string; email: string }[]>([]);
  const router = useRouter();

  const title = initialData ? "Edit Volunteer" : "Create Volunteer";
  const description = initialData ? "Edit a Volunteer" : "Add a new Volunteer";
  const toastMessage = initialData ? "Volunteer Updated" : "Volunteer Created";
  const action = initialData ? "Save Changes" : "Create Volunteer";

  const handleToggleMode = () => setIsManualEntry(!isManualEntry);

  const checkVolunteerExists = async (username: string, email: string, agencyId: string) => {
    try {
      if (!username || !email || !agencyId) {
        console.error("Missing required data for volunteer check:", { username, email, agencyId });
        return false;
      }
  
      const volunteersRef = collection(db, `agencies/${agencyId}/volunteers`);
      const userRef = collection(db, "users");
  
      // Query the collection to find any document that matches both username and email
      const volunteerQuery = query(
        volunteersRef,
        where("username", "==", username),
        where("email", "==", email)
      );
  
      const userQuery = query(
        userRef,
        where("username", "==", username),
        where("email", "==", email)
      );
  
      // Execute the query
      const querySnapshot = await getDocs(volunteerQuery);
      const userSnapshot = await getDocs(userQuery);
  
      if (querySnapshot.empty) {
        return !userSnapshot.empty;
      }
  
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking if volunteer exists:", error);
      return false;
    }
  };  

  const addVolunteer = async (agencyId: string, volunteerData: any) => {
    try {
        const volunteersRef = collection(db, `agencies/${agencyId}/volunteers`);

        const volunteerDoc = await addDoc(volunteersRef, volunteerData);

        const volunteerId = volunteerDoc.id;

        // Update the volunteers array in the agency document
        const agencyDocRef = doc(db, "agencies", agencyId);
        
        await updateDoc(agencyDocRef, {
          volunteers: arrayUnion(volunteerId)
        });

        console.log("Volunteer added successfully!");
      } catch (error) {
          console.error("Error adding volunteer:", error);
      }
  }; 

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      console.log("submitting")
      console.log(agencyId)
      setIsLoading(true);

      data.createdAt = new Date();

      console.log("before definition")

      console.log("before await")
      await addVolunteer(agencyId, data);
      console.log("after await")

      toast({
        title: `${toastMessage}`,
      })
      router.refresh();
      router.push(`/agency-dashboard/${agencyId}/volunteers`);
    } catch (error) {
      toast({
        title: "Something Went Wrong",
        description: `Please try again.`,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false);
    }
  }
  
  const fileSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      console.log("submitting")
      console.log(agencyId)
      setIsLoading(true);

      data.createdAt = new Date();

      console.log("before definition")       

      console.log("before await")
      await addVolunteer(agencyId, data);
      console.log("after await")

      toast({
        title: `${data.username} Added to Volunteers`,
      })

    } catch (error) {
      toast({
        title: `${data.username} could not be Added to Volunteers`,
        description: `Please try again.`,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false);
    }
  }
  
  const onFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: { username: string; email: string }[] = XLSX.utils.sheet_to_json(sheet);
        
        rows.forEach(async (row) => {
          if (!row.username || !row.email) {
            console.warn(`Row missing required fields: ${JSON.stringify(row)}`);
            toast({
              title: `Row Missing`,
              description: `Required Fields: ${JSON.stringify(row)}`,
              variant: "destructive"
            })
            return; 
          }
  
          const volunteerExists = await checkVolunteerExists(row.username, row.email, agencyId);
          if (!volunteerExists) {
            await fileSubmit({ username: row.username, email: row.email, agencyId });
          } else {
            toast({
              title: `Volunteer ${row.username} already exists`,
              description: `A Volunteer can only be created once and cannot be part of more than one agency.`,
              variant: "destructive"
            })
          }
        });
      };
      reader.readAsArrayBuffer(file);
      router.push(`/agency-dashboard/${agencyId}/volunteers`);
      router.refresh();
    }
  };  

  return (
    <>

      <div className="flex items-center justify-center">
        <Heading title={title} description={description} />
        <Button variant="default" onClick={handleToggleMode}>
          {isManualEntry ? "Add via File" : "Add Manually"}
        </Button>
      </div>
      
      <Separator />

      {isManualEntry ? 
        (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-8">
              <div className="grid grid-cols-3 gap-8">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input disabled={isLoading} placeholder="Your Volunteer Username..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input disabled={isLoading} placeholder="Your Volunteer Email..." {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="agencyId"
                  defaultValue={agencyId}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AgencyId</FormLabel>
                      <FormControl>
                        <Input disabled={isLoading} {...field} value={agencyId}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
    
                <FormField
                  control={form.control}
                  name="createdAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Created At</FormLabel>
                      <FormControl>
                        <Input disabled={true} {...field} value={`${newDate.getDate()}-${newDate.getMonth()}-${newDate.getFullYear()}`}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
    
              <Button type="submit" disabled={isLoading} size={"sm"} >
                {action}
              </Button>
            </form>
          </Form>
        )
        : (
            <div className="space-y-4">
              <label htmlFor="xlupload">Upload Volunteer Excel File</label>
              <Input type="file" accept=".xlsx, .xls" name="xlupload" onChange={onFileUpload} />
              <p className="text-sm text-gray-500">File must include "username" and "email" columns compulsorily.</p>
            </div>
          )
      }
    </>
  )
}

export default VolunteerForm;
