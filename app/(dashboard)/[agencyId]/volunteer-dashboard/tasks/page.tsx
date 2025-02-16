"use client";

import { useEffect, useState } from "react";
import CreateTaskTable, { TaskColumn } from "./components/columns"; 
import Heading from "@/components/heading";
import { Separator } from "@/components/ui/separator";
import { onAuthStateChanged } from "firebase/auth";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Loader, MessageSquarePlus, Upload } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getDownloadURL, getStorage, ref, uploadString } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";

interface currVol {
  id : string;
  userId: string;
  username: string;
  agencyId: string;
}

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;

const TaskPage = ({params} : {params : {agencyId : string}}) => {   
    const [tasks, setTasks] = useState<TaskColumn[]>([]);
    const [currentVolunteer, setcurrentVolunteer] = useState<currVol>();
    const [assignedTask, setAssignedTask] = useState<TaskColumn | null>(null);
    const [loading, setLoading] = useState(true);

    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const pathName = usePathname() as string;

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const [imageFile, setImageFile] = useState<File | null>(null);

    const { toast } = useToast();
  
    const [verificationStatus, setVerificationStatus ] = useState<
      'idle' | 'verifying' | 'success' | 'failure'
    >('idle');
    const [verificationResult, setVerificationResult] = useState<number>(0);

  const fetchTasks = async () => {
    if (!currentUser) {
        console.error("No user ID available to fetch tasks");
        return;
    }

    try {
      const userId = currentUser;

      const [taskRes] = await Promise.all([
          fetch(`/api/getVolunteerTasks?agencyId=${params.agencyId}&userId=${userId}`),
        ]);

      const tasksData = await taskRes.json();

      const [volunteerRes] = await Promise.all([
          fetch(`/api/getVolunteer?agencyId=${params.agencyId}&userId=${userId}`),
        ]);

      const volunteersData = await volunteerRes.json();

      if (!taskRes.ok) throw new Error(tasksData.error || "Failed to fetch tasks");
      if (!volunteerRes.ok) throw new Error(tasksData.error || "Failed to fetch tasks");
      if (!volunteersData) throw new Error(tasksData.error || "Failed to fetch volunteerData");
      if (!Array.isArray(tasksData.tasks)) throw new Error("Tasks data is not an array");

      const formattedVolunteer = {
        id: volunteersData.volunteer.volunteerId,
        userId: volunteersData.volunteer.id,
        username: volunteersData.volunteer.username,
        agencyId: volunteersData.volunteer.agencyId,
      } as currVol;

      setcurrentVolunteer(formattedVolunteer);

      const formattedTasks = tasksData.tasks.map((task: any) => ({
          id: task.id,
          agencyId: task.agencyId,
          report: task.report,
          volunteersAssigned: task.volunteersAssigned,
          verificationImageUrl: task.verificationImageUrl,
          completed: task.completed,
          citizenConfirmationStatus: task.citizenConfirmationStatus,
          volunteersAccepted: task.volunteersAccepted,
          citizenVerificationImageUrl: task.citizenVerificationImageUrl,
          createdAt: task.createdAt instanceof Date
              ? task.createdAt.toISOString().split("T")[0]
              : new Date(task.createdAt.seconds * 1000).toISOString().split("T")[0]
      })) as TaskColumn[]

      const activeTask = formattedTasks.find((task) => !task.completed);
      setAssignedTask(activeTask || null);

      setTasks(formattedTasks.filter((task) => task.completed));
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user.uid);
      } else {
        setCurrentUser(null);
      }
    });

    setIsMounted(true);

    return () => unsubscribe();
  }, [pathName]);

  useEffect(() => {
    setIsMounted(true);
    if (currentUser) {
        fetchTasks();
    }
}, [currentUser, params.agencyId]);


const handleTaskAccept = async () => {
  try {
    if (!assignedTask) return;

    if (!currentVolunteer || !currentUser) {
      console.log("user not found")      
      return
    };

    await fetch(`/api/acceptTask`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskId: assignedTask.id,
        volunteerId: currentVolunteer.id, 
      }),
    });

    toast({
      title: "Task Accepted!",
      description: `${assignedTask.id} has been accepted by you.`
    })
    fetchTasks();
  } catch (error) {
    console.error("Error accepting task:", error);
  }
};

  const handleFileChange = (e:React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files && e.target.files[0]){
        const selectedFile = e.target.files[0];

        if (selectedFile.size > 4 * 1024 * 1024) {
          toast({
            title: "Image Size Exceeded",
            description: `File size must be less than 4MB.`,
            variant: "destructive"
          })
          return;
        }

        setFile(selectedFile);
        setImageFile(e.target.files[0]);

        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string)
        }
        reader.readAsDataURL(selectedFile);
    }
  };

  const storage = getStorage();

  async function uploadImageAndGetUrl(base64Image: string, fileName: string) {
    try {
        const storageRef = ref(storage, `taskImages/${fileName}`);
        await uploadString(storageRef, base64Image, "data_url");
        return await getDownloadURL(storageRef);
    } catch (error) {
        console.error("Error uploading image:", error);
        return null;
    }
  }

  const handleVerify = async () => {
    if (!file) return;
  
    setVerificationStatus("verifying");

    try {
        const base64Data = await readFileAsBase64(file);

        const fileName = `volunteer_${assignedTask?.id}_${Date.now()}.png`;

        const volunteerImageUrl = await uploadImageAndGetUrl(base64Data, fileName);

        if (!volunteerImageUrl) {
          alert("Image upload failed. Please try again.");
          return;
        }
        else{
          console.log("VImage: ", volunteerImageUrl);
        }
          
        const requestBody = JSON.stringify({
            taskId: assignedTask?.id,  
            citizenImageUrl: assignedTask?.report.imageUrl,
            volunteerImageUrl: volunteerImageUrl,
        });
       
        const response = await fetch("/api/verifyImage", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: requestBody,
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Image verification failed");
        }

        // Process verification result
        console.log("Verification Result:", result);
        if (result.success) {
            setVerificationStatus("success");
            toast({
              title: "Image verification successful!",
              description: `You can now submit the form.`
            })
        } else {
            setVerificationStatus("failure");
            toast({
              title: "Image verification failed",
              description: `Please upload a correct image.`,
              variant: "destructive"
            })
        }
    } catch (error: any) {
        console.error("Error verifying image:", error);
        toast({
          title: "Image verification failed",
          description: `Error: ${error.message}`,
          variant: "destructive"
        })
        setVerificationStatus("failure");
    }
};


  const readFileAsBase64 = (file: File) : Promise <string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    })
  }

  const handleSubmit = () => {}
    
  if(!isMounted) return null;

  if (loading) return <p>Loading tasks...</p>;

  if (!tasks || tasks.length === 0 && !assignedTask) return <p>No tasks available.</p>;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-16 pt-6">
        <div className="mb-6">
          {assignedTask ? 
            (<>
              <Heading title={`Assigned Tasks`} description="View Your Assigned Tasks..." />
            </>) : (
              <Heading title={`Assigned Tasks`} description="You are not assigned any task..." />
            )}

            <Separator className="mb-12 mt-4"/>

            {assignedTask ? (
              <div className="border-2 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold">{assignedTask.report.location}</h2>

                <div className="flex justify-between">
                  <div className="space-y-4">
                    <p className="">Task ID: {assignedTask.id}</p>
                    <p className="">
                      Status: {assignedTask.completed ? "Completed" : "Pending"}
                    </p>
                    <p className="">
                      Amount: {assignedTask.report.amount}
                    </p>
                    <p className="">
                      Issued At: {assignedTask.report.createdAt}
                    </p>
                    <p className="">
                      No. of Volunteers Assigned: {assignedTask.volunteersAssigned.length}
                    </p>

                    {currentVolunteer && !assignedTask.volunteersAccepted.includes(currentVolunteer?.id) && (
                      <Button
                        onClick={handleTaskAccept}
                        className=" px-4 py-2 rounded-lg"
                        variant={"outline"}
                      >
                        Accept Task
                      </Button>
                    )}

                    {currentVolunteer && assignedTask.volunteersAccepted.includes(currentVolunteer?.id) && assignedTask.volunteersAssigned.length > 1 && (
                      <Button
                        className="flex justify-between space-x-2"
                      >
                        <MessageSquarePlus /> <span>Connect</span>
                      </Button>
                    )}
                  </div>

                  <div> 
                      <Image src={assignedTask.report.imageUrl} alt="image not loaded" width={400} height={400}/>
                  </div>
                </div>

                {currentVolunteer && assignedTask.volunteersAccepted.includes(currentVolunteer?.id) && (
                <div>
                  <form onSubmit={handleSubmit} className="dark:bg-gray-800 bg-gray-50 p-8 rounded-2xl shadow-lg mb-4 mt-8">
                    <div className="mb-8">
                        <label htmlFor="waste-image" className="block text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">
                            Upload Waste Image
                        </label>

                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-green-500 transition-colors duration-300">
                            <div className="space-y-1 text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-600"/>

                                <div className="flex text-sm text-gray-600">
                                    <label htmlFor="waste-image" 
                                    className="relative cursor-pointer rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500">
                                        <span>Upload a file</span>
                                        <input id="waste-image" name="waste-image" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 4MB</p>
                            </div>
                        </div>
                    </div>

                    {preview && (
                        <div className="mt-4 mb-8">
                            <img src={preview} alt="Waste preview" className="max-w-full h-auto rounded-xl shadow-md" />
                        </div>
                    )}

                    <Button 
                    type="button" 
                    onClick={handleVerify} 
                    className="w-full mb-8 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg rounded-xl transition-colors duration-300" 
                    disabled={!file || verificationStatus === 'verifying'}
                    >
                    {verificationStatus === 'verifying' ? (
                    <>
                      <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                      Verifying...
                    </>
                    ) : 'Verify Waste'}
                    </Button>
                     
                  </form>
                </div> )}
              </div>
            ) : (
              <p>No assigned tasks at the moment.</p>
            )}
        </div>

        <Separator />


        {tasks.length > 0 ?
          (<>
            <Heading title={`Completed Tasks(${tasks.length})`} description="View Your Completed Tasks..." />
            <Separator className="mb-6"/>
            <CreateTaskTable tasks={tasks} />
          </>) : (
            <Heading title={`Completed Tasks(${tasks.length})`} description="You have no completed tasks..." />
          )}
        
      </div>
    </div>
  );
};

export default TaskPage;
