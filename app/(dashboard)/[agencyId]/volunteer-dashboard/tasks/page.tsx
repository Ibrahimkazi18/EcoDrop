"use client";

import { useEffect, useState } from "react";
import CreateTaskTable, { TaskColumn } from "./components/columns"; 
import Heading from "@/components/heading";
import { Separator } from "@/components/ui/separator";
import { onAuthStateChanged } from "firebase/auth";
import { usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { CheckCircle, Loader, MessageSquarePlus, Upload, XCircle } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useToast } from "@/hooks/use-toast";
import { useNavbar } from "@/app/context/navbarContext";
import { computeImageHash } from "@/lib/utils";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { updateTask, uploadImage } from "@/hooks/create-report";
import { useLoadScript, GoogleMap, DirectionsRenderer, TrafficLayer } from "@react-google-maps/api";
import RealTimeNavigation from "./components/realTimeNavigation";

interface currVol {
  id : string;
  userId: string;
  username: string;
  agencyId: string;
}

interface verificationResult {
  containsWaste: boolean;
  confidence: number;
}

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string;

const TaskPage = ({params} : {params : {agencyId : string}}) => { 
    const userId = auth.currentUser?.uid;  
    const { triggerNavbarRefresh } = useNavbar();
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
    
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isDropping, setIsDropping] = useState(false);
    const [verificationStatus, setVerificationStatus ] = useState<
      'idle' | 'verifying' | 'success' | 'failure'
    >('idle');
    const [verificationResult, setVerificationResult] = useState<verificationResult | null>(null);

    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [eta, setEta] = useState<string | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  
    const { isLoaded } = useLoadScript({
      googleMapsApiKey: GOOGLE_MAPS_API_KEY,
      libraries: ["places"],
    });
  

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
    getVolunteerLocation();
    convertAddressToCoordinates(assignedTask.report.location);
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

  const handleVerify = async () => {
    if (!file) return;

    if (!geminiApiKey) {
        console.error("Gemini API key is not configured");
        return;
    }

    setVerificationStatus("verifying");

    try {
        const genAi = new GoogleGenerativeAI(geminiApiKey);
        const model = genAi.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 1024,
            }
        });

        const base64Data = await readFileAsBase64(file);

        // File size validation
        const fileSizeInMB = file.size / (1024 * 1024);
        if (fileSizeInMB > 4) {
            toast({
                title: "Size Limit Exceeded",
                description: "File size must be less than 4MB",
                variant: "destructive"
            });
            setVerificationStatus("failure");
            return;
        }

        const imageParts = [
            {
                inlineData: {
                    data: base64Data.split(',')[1], 
                    mimeType: file.type,
                }
            }
        ];

        const prompt = `You are an expert in waste detection. Analyze this image and determine whether there is visible waste. Respond in JSON format:
        {
            "containsWaste": true or false,
            "confidence": confidence level as a number between 0 and 1
        }`;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }]
        });

        if (!result || !result.response) {
            console.error("Invalid API response:", result);
            toast({
                title: "AI Response Error",
                description: "Received an invalid response from Gemini AI.",
                variant: "destructive"
            });
            setVerificationStatus("failure");
            return;
        }

        let text = result.response.text().trim();

        if (text.startsWith("```") && text.endsWith("```")) {
            text = text.slice(7, -3).trim();
        }

        console.log("AI Response Text:", text); 

        try {
            const parseResult = JSON.parse(text);

            if (parseResult.containsWaste !== undefined && parseResult.confidence !== undefined) {
                if (!parseResult.containsWaste && parseResult.confidence >= 0.7) {
                    setVerificationStatus("success");
                    setVerificationResult(parseResult);
                    toast({
                        title: "Verification Success!",
                        description: "Waste detected successfully.",
                    });
                } else {
                    setVerificationStatus("failure");
                    setVerificationResult(parseResult);
                    const reason = parseResult.containsWaste 
                        ? "Confidence level is below 70%." 
                        : "Visible waste detected in the image.";

                    toast({
                        title: "Verification Failed",
                        description: reason,
                        variant: "destructive"
                    });
                }
            } else {
                throw new Error("Invalid response format from AI.");
            }
        } catch (error) {
            console.error("Failed to parse JSON response:", error);
            toast({
                title: "Parsing Error",
                description: "Invalid AI response format.",
                variant: "destructive"
            });
            setVerificationStatus("failure");
        }

    } catch (error: any) {
        console.error("Error verifying image:", error);

        toast({
            title: "Image verification failed",
            description: `Error: ${error.message}`,
            variant: "destructive"
        });
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const droppedFile = e.dataTransfer.files[0];

        if (droppedFile.size > 4 * 1024 * 1024) {
            toast({
                title: "Size Limit Exceeded",
                description: "File size must be less than 4MB",
                variant: "destructive",
            });
            return;
        }

        setFile(droppedFile);
        setImageFile(droppedFile);

        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropping(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDropping(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDropping(false);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if(verificationStatus != 'success' || !userId || !assignedTask){
        toast({
          title: "Something Went Wrong",
          description: `Please verify the waste before submitting or login`,
          variant: "destructive"
        })
        return;
    }

    setIsSubmitting(true);

    if (!imageFile) return;

    try {
      const imageHash = await computeImageHash(imageFile);
      const imageUrl = await uploadImage(imageFile, "taskImages");

      const imagesRef = collection(db, "image_hashes"); 
      const q = query(imagesRef, where("hash", "==", imageHash));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast({
          title: "Image Already Exists",
          description: `Cannot upload the same image for multiple reports.`,
          variant: "destructive"
        })
        setVerificationStatus("failure");
        return;
      }

      await updateTask(assignedTask.id, imageUrl);

      await addDoc(imagesRef, { hash: imageHash, uploadedAt: new Date() });

      setFile(null);
      setPreview(null);
      setVerificationStatus("idle");
      setVerificationResult(null);

      toast({
        title: "Report Submitted Successfully!",
        description: `You can see the status of the report in the table below`,
      })

      triggerNavbarRefresh();
    } catch (error) {
      console.error("Error creating report:", error);
      toast({
        title: "Report Failed",
        description: `Failed to submit report. Please try again.`,
        variant: "destructive"
      })
    } finally {
        setIsSubmitting(false);
    }
  }

  const getVolunteerLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    if (!navigator.geolocation) return null;
  
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const curr = { lat: position.coords.latitude, lng: position.coords.longitude };
          setCurrentLocation(curr);
          resolve(curr);
        },
        (error) => {
          console.error("Error getting location:", error);
          reject(null);
        }
      );
    });
  };

  const convertAddressToCoordinates = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    if (!GOOGLE_MAPS_API_KEY || !address) return null;
  
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
  
      if (data.status === "OK") {
        const location = data.results[0].geometry.location;
        setDestination(location);
        return location;
      } else {
        console.error("Geocoding error:", data.status);
        return null;
      }
    } catch (error) {
      console.error("Error fetching geocode:", error);
      return null;
    }
  };
  

  useEffect(() => {
    if (currentLocation && destination) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: currentLocation,
          destination: destination,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK") setDirections(result);
          else console.error("Error fetching directions:", status);
        }
      );
    }
  }, [currentLocation, destination]);

  const startNavigation = async () => {
    if (!assignedTask) return;

    const curr = await getVolunteerLocation();
    const dest = await convertAddressToCoordinates(assignedTask.report.location);

    if (!curr || !dest) return;
    setCurrentLocation(curr);
    setDestination(dest);
    setIsNavigating(true);
    
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: curr,
        destination: dest,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result?.routes?.[0]?.legs?.[0]?.duration?.text) {
          setDirections(result);
          setEta(result.routes[0].legs[0].duration.text);
        } else {
          console.error("Error fetching directions:", status);
        }
      }
    );
  };
    
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

                    {currentVolunteer && assignedTask.volunteersAccepted.includes(currentVolunteer?.id) && assignedTask.volunteersAssigned.length > 1 && !assignedTask.verificationImageUrl && (
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

                {currentVolunteer && assignedTask.volunteersAccepted.includes(currentVolunteer?.id) && assignedTask.verificationImageUrl && (
                  <div className="mt-4 flex items-center justify-center">
                    <p className="text-green-600 text-base capitalize">Waiting For Citizen Verification...</p>
                  </div>
                ) }

                {currentVolunteer && assignedTask.volunteersAccepted.includes(currentVolunteer?.id) && !assignedTask.verificationImageUrl && (

                <div>
                  <div className="mt-4 p-4 border rounded-lg shadow">
                    <h2 className="text-lg font-semibold">Current Task</h2>
                    <p>Location: {assignedTask.report.location}</p>

                    {!isNavigating ? (
                      <button
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
                        onClick={startNavigation}
                      >
                        Start Journey
                      </button>
                    ) : (
                      <div className="mt-4">
                        {eta && <p className="mb-2">Estimated Arrival Time: {eta}</p>}

                        {isLoaded && (
                          <GoogleMap
                            center={currentLocation || { lat: 19.076, lng: 72.8777 }}
                            zoom={14}
                            mapContainerStyle={{ width: "100%", height: "400px" }}
                            onLoad={(map) => setMapInstance(map)}
                          >
                            <TrafficLayer />
                            {directions && <DirectionsRenderer directions={directions} />}

                            {mapInstance && (
                              <RealTimeNavigation
                                mapInstance={mapInstance} // Pass the stored map instance
                                volunteerLocation={currentLocation || { lat: 19.076, lng: 72.8777 }}
                                destination={destination || { lat: 19.076, lng: 72.8777 }}
                                setDirections={setDirections}
                              />
                            )}
                          </GoogleMap>
                        )}
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSubmit} className="dark:bg-gray-800 bg-gray-50 p-8 rounded-2xl shadow-lg mb-4 mt-8">
                    <div className="mb-8">
                        <label htmlFor="waste-image" className="block text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">
                            Upload Waste Image
                        </label>

                        <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-green-500 transition-colors duration-300 ${isDropping ? "border-green-500" : "border-gray-300"}`}
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onDragEnter={handleDragEnter}
                          onDragLeave={handleDragLeave}
                        >
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
                     
                    {verificationStatus === 'failure' && verificationResult && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded-r-xl">
                        <div className="flex items-center">
                          <XCircle className="h-6 w-6 text-red-400 mr-3" />
                          <div>
                            <h3 className="text-lg font-medium text-red-800">Verification Failure</h3>
                            <div className="mt-2 text-sm text-red-700">
                              <p>Contains Waste: {verificationResult.containsWaste ? "True" : "Flase"}</p>
                              <p>Confidence: {(verificationResult.confidence * 100).toFixed(2)}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {verificationStatus === 'success' && verificationResult && (
                      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-8 rounded-r-xl">
                        <div className="flex items-center">
                          <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
                          <div>
                            <h3 className="text-lg font-medium text-green-800">Verification Successful</h3>
                            <div className="mt-2 text-sm text-green-700">
                              <p>Contains Waste: {verificationResult.containsWaste ? "True" : "Flase"}</p>
                              <p>Confidence: {(verificationResult.confidence * 100).toFixed(2)}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full mb-8 bg-green-600 hover:bg-green-700 text-white py-3 text-lg rounded-xl transition-colors duration-300" 
                      disabled={!file || verificationStatus === 'idle' && isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                          Submitting...
                        </>
                      ) : 'Submit'}
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