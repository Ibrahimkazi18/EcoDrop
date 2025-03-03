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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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

      const querySnapshot = await getDocs(volunteerQuery);
      const userSnapshot = await getDocs(userQuery);

      if (querySnapshot.empty && userSnapshot.empty) {
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking if volunteer exists:", error);
      return false;
    }
  };

  const addVolunteer = async (agencyId: string, volunteerData: any) => {
    try {
      const volunteersRef = collection(db, `agencies/${agencyId}/volunteers`);

      const newVolunteer: Volunteer = { ...volunteerData, hasSetPermanentPassword: false, totalPoints: 0, points: 0, exp: 0, lastReportDate: null, lastUpdated: "", level: 1, pickupsToday: 4, rank: "rookie", status: "unavailable", streak: 0, address: "", };

      const volunteerDoc = await addDoc(volunteersRef, newVolunteer);

      console.log("Volunteer added successfully!");
    } catch (error) {
      console.error("Error adding volunteer:", error);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      data.createdAt = new Date();

      const volunteerExists = await checkVolunteerExists(data.username, data.email, agencyId);
      console.log(volunteerExists);

      if (volunteerExists) {
        toast({
          title: "Volunteer Already Exists",
          description: "A Volunteer can only be created once and cannot be part of more than one agency.",
          variant: "destructive"
        });
        return;
      }

      await addVolunteer(agencyId, data);

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
      setIsLoading(true);
      data.createdAt = new Date();
      await addVolunteer(agencyId, data);

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
      setSelectedFile(file);

      const confirmUpload = window.confirm("Do you want to upload and process this file?");
      if (!confirmUpload) {
        setSelectedFile(null);
        return;
      }

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
      <div className="flex flex-col items-center justify-center space-y-4 p-4">
        <Heading title={title} description={description} />
        <Button variant="default" onClick={handleToggleMode} className="w-full sm:w-auto">
          {isManualEntry ? "Add via File" : "Add Manually"}
        </Button>
      </div>

      <Separator />

      {isManualEntry ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-8 p-4">
            {/* Responsive Grid for Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Username Field */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="Your Volunteer Username..."
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="Your Volunteer Email..."
                        {...field}
                        type="email"
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Agency ID Field */}
              <FormField
                control={form.control}
                name="agencyId"
                defaultValue={agencyId}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agency ID</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        {...field}
                        value={agencyId}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Created At Field */}
              <FormField
                control={form.control}
                name="createdAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Created At</FormLabel>
                    <FormControl>
                      <Input
                        disabled={true}
                        {...field}
                        value={`${newDate.getDate()}-${newDate.getMonth()}-${newDate.getFullYear()}`}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              size="sm"
              className="w-full sm:w-auto"
            >
              {action}
            </Button>
          </form>
        </Form>
      ) : (
        <div className="space-y-4 p-4">
          <label htmlFor="xlupload" className="block text-sm font-medium">
            Upload Volunteer Excel File
          </label>
          <Input
            type="file"
            accept=".xlsx, .xls"
            name="xlupload"
            onChange={onFileUpload}
            className="w-full"
          />
          <p className="text-sm text-gray-500">
            File must include "username" and "email" columns compulsorily.
          </p>
        </div>
      )}
    </>
  )
}

export default VolunteerForm;