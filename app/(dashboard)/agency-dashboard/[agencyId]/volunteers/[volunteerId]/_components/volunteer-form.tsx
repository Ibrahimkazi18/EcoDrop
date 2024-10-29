"use client"

import Heading from "@/components/heading"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Volunteer } from "@/types-db"
import { zodResolver } from "@hookform/resolvers/zod"
import { Trash } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import axios from "axios"
import toast from "react-hot-toast"
import { AlertModal } from "@/components/modal/alert-modal"
import { auth, db } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { addDoc, collection } from "firebase/firestore"

interface VolunteerFormProps {
  initialData: Volunteer
  agencyId: string  
}

const formSchema = z.object({
  username: z.string().min(1),
  email: z.string().min(1),
  agencyId: z.string().min(1),
})

const VolunteerForm = ({ initialData, agencyId }: VolunteerFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const params = useParams();
  const router = useRouter();

  const title = initialData ? "Edit Volunteer" : "Create Volunteer";
  const description = initialData ? "Edit a Volunteer" : "Add a new Volunteer";
  const toastMessage = initialData ? "Volunteer Updated" : "Volunteer Created";
  const action = initialData ? "Save Changes" : "Create Volunteer";
  console.log(agencyId);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log("ehllo"); 
    try {
      setIsLoading(true);

      const addVolunteer = async (agencyId: string, volunteerData: any) => {
        try {
            // Reference the agency's volunteer sub-collection path
            const volunteersRef = collection(db, `agencies/${agencyId}/volunteers`);
            
            // Add the volunteer document to the sub-collection
            await addDoc(volunteersRef, volunteerData);
    
            console.log("Volunteer added successfully!");
          } catch (error) {
              console.error("Error adding volunteer:", error);
          }
      };        

      await addVolunteer(agencyId, data);

      toast.success(toastMessage);
      router.refresh();
      router.push(`/agency-dashboard/${agencyId}/volunteers`);
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  const onDelete = async () => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/volunteeradd/${params.volunteerId}`);
      toast.success("Volunteer Removed");
      router.refresh();
      router.push(`/agency-dashboard/${agencyId}/volunteers`);
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
      setOpen(false);
    }
  }

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={isLoading}
      />

      <div className="flex items-center justify-center">
        <Heading title={title} description={description} />
        {initialData && (
          <Button disabled={isLoading} variant={"default"} size={"icon"} onClick={() => setOpen(true)}>
            <Trash className="w-4 h-4"/>
          </Button>
        )}
      </div>
      
      <Separator />

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
          </div>

          <Button type="submit" disabled={isLoading} size={"sm"} >
            {action}
          </Button>
        </form>
      </Form>
    </>
  )
}

export default VolunteerForm;