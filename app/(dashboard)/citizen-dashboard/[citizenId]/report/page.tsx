"use client"

import { useEffect, useState } from "react";
import { MapPin, Upload, CheckCircle, Loader, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createReport, getReportsCitizen, uploadImage } from "@/hooks/create-report";
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding"
import { Separator } from "@/components/ui/separator";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { computeImageHash } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useNavbar } from "@/app/context/navbarContext";
import ResellModal from "@/components/resellModal";

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;
const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string;

const ReportPage = () => { 
  const userId = auth.currentUser?.uid;
  const { toast } = useToast();
  const { triggerNavbarRefresh } = useNavbar();
  const [isResellModalOpen, setIsResellModalOpen] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [verificationStatus, setVerificationStatus ] = useState<
    'idle' | 'verifying' | 'success' | 'failure'
  >('idle');

  const [reports, setReports] = useState<
    Array<{
        id: string;
        location: string;
        wasteType: string;
        amount: string;
        status: string;
        createdAt: string;
    }>
  >([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [newReport, setNewReport] = useState({
    location: "",
    type: "",
    amount: ""
  })

  const [verificationResult, setVerificationResult] = useState<{
    wasteType: string,
    quantity: string,
    confidence: number,
    isEwaste: boolean,
    deviceCondition: string,
    numberOfDevices: number,
  } | null> (null)

    const geocodingClient = mbxGeocoding({
      accessToken: mapboxAccessToken,
    });

  const handleInputChange = async (e:React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {name, value} = e.target;

    setNewReport({...newReport, [name]:value })

    if (name === "location" && value.trim().length > 2 && geocodingClient) {
      try {
        const response = await geocodingClient
          .forwardGeocode({
            query: value,
            limit: 5,
          })
          .send();
  
        if (response.body.features) {
          setSuggestions(response.body.features.map((feature) => feature.place_name));
        }
      } catch (error) {
        console.error("Error fetching location suggestions:", error);
      }
    } else {
      setSuggestions([]);
    }
  }

  const handleFileChange = (e:React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files && e.target.files[0]){
        const selectedFile = e.target.files[0];

        if (selectedFile.size > 4 * 1024 * 1024) {
          toast({
            title: "Size Limit Exceeded",
            description: "File size must be less than 4MB",
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

  const readFileAsBase64 = (file: File) : Promise <string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    })
  }

  const handleVerify = async () => {
    if(!file) return;

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

        // Add file size validation
        const fileSizeInMB = file.size / (1024 * 1024);
        if (fileSizeInMB > 4) {
            toast({
              title: "Size Limit Exceeded",
              description: "File size must be less than 4MB",
              variant: "destructive"
            })
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

        const prompt = `You are an expert in waste management and recycling. Analyze this image and provide: 
          1. The type of waste (e.g., plastic, paper, glass, metal, organic, e-waste)
          2. An estimate of the quantity or amount (only in kg or litres without explanation)
          3. Your confidence level (based on type of waste) in this assessment (as a percentage)
          4. If the waste is e-waste, check if there are 1-3 electronic devices and if they are in good condition.
          
          Respond in JSON format like this:
          {
            "wasteType": "type of waste",
            "quantity": "estimated quantity with unit",
            "confidence": confidence level as a number between 0 and 1,
            "isEWaste": boolean,
            "deviceCondition": "good" | "bad",
            "numberOfDevices": number
          }`;

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }]
        });
        const response = result.response;
        let text = response.text().trim();
        if (text.startsWith("```") && text.endsWith("```")) {
          text = text.slice(7, -3).trim();
        }

        try {
            const parseResult = JSON.parse(text);
            console.log(parseResult);

            if(parseResult.wasteType && parseResult.quantity && parseResult.confidence) {
              if (
                parseResult.wasteType.includes("e-waste")  && 
                parseResult.confidence >= 0.7
              ) {
                setVerificationResult(parseResult);
                setVerificationStatus('success');
                setNewReport({
                    ...newReport,
                    type: parseResult.wasteType,
                    amount: parseResult.quantity,
                });
                toast({
                  title: "Verification Success!",
                  description: "Image verified successfully!",
                })
              }

              else {
                setVerificationStatus("failure");
                setVerificationResult(parseResult)
                const reason = parseResult.wasteType.includes("e-waste")  
                  ? "The waste is not classified as e-waste." 
                  : "The confidence level is below 70%.";
                
                toast({
                  title: "Verification Failed",
                  description: `${reason}`,
                  variant: "destructive"
                })
              }
            } else {
                toast({
                  title: "Something Went Wrong",
                  description: `Invalid response format from AI`,
                  variant: "destructive"
                })
                setVerificationStatus('failure');
            }
        } catch (error) {
            console.error("Failed to parse JSON response:", error);
            setVerificationStatus('failure');
        }

    } catch(error: any) {
        console.error("Error verifying waste:", error);
        setVerificationStatus('failure');
    }
}
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if(verificationStatus != 'success' || !userId){
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

        const report = await createReport(
        userId, 
        newReport.location, 
        newReport.type, 
        newReport.amount, 
        imageFile || undefined,
        verificationResult ? JSON.stringify(verificationResult) : undefined) as any;

        console.log(report)

        const formattedReport = {
            id : report.id,
            location : report.location,
            wasteType : report.wasteType,
            amount : report.amount,
            status: report.status,
            createdAt: report.createdAt.toDate().toISOString().split("T")[0],
        }

        await addDoc(imagesRef, { hash: imageHash, uploadedAt: new Date() });

        setReports([...reports, formattedReport]);
        setNewReport({location: "", amount: "", type: ""});
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

  const handleResell = async (model: string, yearsOld: number, condition: string, address: string) => {
    try {
      const estimatedPrice = calculateDevicePrice(model, yearsOld, condition);

      toast({
        title: "Estimated Price",
        description: `Your device is estimated to be worth $${estimatedPrice}.`,
      });

      await listDeviceForResale(verificationResult, model, yearsOld, condition, estimatedPrice, address);

      toast({
        title: "Device Listed for Resale!",
        description: "Your device has been listed for resale.",
      });
    } catch (error) {
      console.error("Error listing device for resale:", error);
      toast({
        title: "Listing Failed",
        description: "Failed to list device for resale. Please try again.",
        variant: "destructive",
      });
    }
  };

  const calculateDevicePrice = (model: string, yearsOld: number, condition: string): number => {
    const basePrices: { [key: string]: number } = {
      // Smartphones
      "iPhone 15 Pro": 134900,
      "iPhone 14": 79900,
      "iPhone 13": 59900,
      "Samsung Galaxy S23 Ultra": 124999,
      "Samsung Galaxy S22": 74999,
      "OnePlus 11 Pro": 69999,
      "Google Pixel 7 Pro": 84999,
      "Xiaomi 13 Pro": 79999,
      "Vivo X90 Pro": 89999,
      "Oppo Find X6 Pro": 89999,
    
      // Laptops
      "MacBook Air M2": 114900,
      "MacBook Pro 14-inch M2 Pro": 199900,
      "Dell XPS 13 Plus": 169990,
      "HP Spectre x360": 149999,
      "Lenovo ThinkPad X1 Carbon": 159999,
      "Asus ROG Zephyrus G14": 149999,
      "Acer Swift 5": 99999,
      "Microsoft Surface Laptop 5": 129999,
      "LG Gram 17": 149999,
      "MSI Prestige 14": 109999,
    
      // Air Conditioners
      "LG 1.5 Ton 5-Star Inverter Split AC": 44999,
      "Daikin 1.5 Ton 5-Star Inverter Split AC": 46999,
      "Voltas 1.5 Ton 3-Star Split AC": 34999,
      "Blue Star 1.5 Ton 5-Star Inverter Split AC": 42999,
      "Hitachi 1.5 Ton 5-Star Inverter Split AC": 45999,
      "Carrier 1.5 Ton 3-Star Split AC": 32999,
      "Samsung 1.5 Ton 5-Star Inverter Split AC": 43999,
      "Panasonic 1.5 Ton 5-Star Inverter Split AC": 44999,
      "Whirlpool 1.5 Ton 3-Star Split AC": 33999,
      "Godrej 1.5 Ton 5-Star Inverter Split AC": 41999,
    
      // Washing Machines
      "LG 8 Kg 5-Star Inverter Front Load Washing Machine": 44999,
      "Samsung 8 Kg 5-Star Inverter Front Load Washing Machine": 42999,
      "Whirlpool 7 Kg 5-Star Fully Automatic Top Load Washing Machine": 24999,
      "IFB 8 Kg 5-Star Front Load Washing Machine": 46999,
      "Bosch 7 Kg 5-Star Front Load Washing Machine": 39999,
      "Haier 7 Kg 5-Star Fully Automatic Top Load Washing Machine": 22999,
      "Panasonic 8 Kg 5-Star Front Load Washing Machine": 43999,
      "Godrej 7 Kg 5-Star Fully Automatic Top Load Washing Machine": 23999,
      "Onida 6.5 Kg 5-Star Fully Automatic Top Load Washing Machine": 19999,
      "Voltas Beko 8 Kg 5-Star Front Load Washing Machine": 41999,
    
      // Televisions
      "Sony Bravia 55-inch 4K OLED Smart TV": 149999,
      "LG 55-inch 4K OLED Smart TV": 139999,
      "Samsung 55-inch 4K QLED Smart TV": 129999,
      "OnePlus 55-inch 4K QLED Smart TV": 69999,
      "Mi 55-inch 4K Android Smart TV": 54999,
      "Toshiba 55-inch 4K Android Smart TV": 49999,
      "Vu 55-inch 4K Android Smart TV": 44999,
      "Panasonic 55-inch 4K LED Smart TV": 59999,
      "Thomson 55-inch 4K Android Smart TV": 39999,
      "Realme 55-inch 4K Android Smart TV": 42999,
    
      // Refrigerators
      "LG 260 L 3-Star Inverter Double Door Refrigerator": 32999,
      "Samsung 253 L 3-Star Inverter Double Door Refrigerator": 31999,
      "Whirlpool 265 L 3-Star Inverter Double Door Refrigerator": 30999,
      "Haier 258 L 3-Star Inverter Double Door Refrigerator": 29999,
      "Godrej 260 L 3-Star Inverter Double Door Refrigerator": 28999,
      "Panasonic 255 L 3-Star Inverter Double Door Refrigerator": 31999,
      "Bosch 260 L 3-Star Inverter Double Door Refrigerator": 33999,
      "Hitachi 265 L 3-Star Inverter Double Door Refrigerator": 34999,
      "Voltas Beko 260 L 3-Star Inverter Double Door Refrigerator": 29999,
      "IFB 260 L 3-Star Inverter Double Door Refrigerator": 35999,
    
      // Kitchen Appliances
      "Philips Air Fryer HD9252/90": 9999,
      "Bajaj Majesty HMX 3 Litre Induction Cooktop": 1999,
      "Prestige Iris 750W Mixer Grinder": 2999,
      "Butterfly Smart Glass 3 Burner Gas Stove": 4999,
      "Hindware Snowcrest 25 L Microwave Oven": 8999,
      "Inalsa Excel 1000W Juicer Mixer Grinder": 2499,
      "Morphy Richards 400W Food Processor": 4999,
      "Kent 16038 1500W Water Purifier": 14999,
      "Eureka Forbes Aquasure Smart Plus RO+UV+UF Water Purifier": 16999,
      "Kaff 50 L Oven Toaster Grill": 7999,
    };
  
    const basePrice = basePrices[model] || 5000; 
    let price = basePrice * Math.pow(0.8, yearsOld); 
    
    switch (condition.toLowerCase()) {
      case "good":
        price *= 1.0; 
        break;
      case "fair":
        price *= 0.7; 
        break;
      case "poor":
        price *= 0.5; 
        break;
      default:
        price *= 0.7; 
    }
  
    return Math.round(price); 
  };

  const listDeviceForResale = async (
    deviceInfo: any,
    model: string,
    yearsOld: number,
    condition: string,
    estimatedPrice: number,
    address: string
  ) => {
    try {
      let imageUrl = null;
      
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, "resale");
      }

      const deviceListing = {
        userId: auth.currentUser?.uid,
        imageUrl: imageUrl, 
        name: deviceInfo.wasteType,
        model,
        yearsOld,
        condition,
        address: address, 
        price: estimatedPrice,
        status: "listed", 
        createdAt: new Date(),
      };
  
      const resellRef = collection(db, "resale");
      await addDoc(resellRef, deviceListing);

      setNewReport({location: "", amount: "", type: ""});
      setFile(null);
      setPreview(null);
      setVerificationStatus("idle");
      setVerificationResult(null);

      triggerNavbarRefresh();
    } catch (error) {
      throw error; 
    }
  };

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


  const fetchReports = async (userId : string) => {
    try {
      const reportsData = await getReportsCitizen(userId, 5); 
      const formattedReports = reportsData.map((report) => ({
        ...report,
        createdAt: report.createdAt instanceof Date
        ? report.createdAt.toISOString().split("T")[0]
        : new Date(report.createdAt.seconds * 1000).toISOString().split("T")[0]
      }));
      setReports(formattedReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const fetchUserData = async (uid: string) => {
    try {
      const userDocRef = doc(db, "citizens", uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        await fetchReports(uid); 
      } else {
        console.error("User document does not exist.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const unsubscribe = auth.onAuthStateChanged((firebaseUser: any) => {
    if (firebaseUser) {
      fetchUserData(firebaseUser.uid);
    } else {
      setReports([]);
      console.error("User not logged in.");
    }
  });

  useEffect(() => {
    return () => unsubscribe(); 
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:px-2 max-w-[22rem] sm:max-w-md md:max-w-lg lg:max-w-3xl xl:max-w-5xl mx-auto">
      <h1 className="font-semibold text-2xl sm:text-3xl mb-4 sm:mb-6 dark:text-gray-100 text-gray-800">
        Report Waste
      </h1>
  
      <form onSubmit={handleSubmit} className="dark:bg-gray-800 bg-gray-50 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-lg mb-8 sm:mb-12">
        <div className="mb-6 sm:mb-8">
          <label htmlFor="waste-image" className="block text-base sm:text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">
            Upload Waste Image
          </label>
  
          <div
            className={`mt-1 flex justify-center px-4 sm:px-6 pt-4 sm:pt-5 pb-5 sm:pb-6 border-2 border-gray-300 border-dashed rounded-lg sm:rounded-xl hover:border-green-500 transition-colors duration-300 ${
              isDropping ? "border-green-500" : "border-gray-300"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-600" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="waste-image"
                  className="relative cursor-pointer rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="waste-image"
                    name="waste-image"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 4MB</p>
            </div>
          </div>
        </div>
  
        {preview && (
          <div className="mt-4 mb-6 sm:mb-8">
            <img src={preview} alt="Waste preview" className="max-w-full h-auto rounded-lg sm:rounded-xl shadow-md" />
          </div>
        )}
  
        <Button
          type="button"
          onClick={handleVerify}
          className="w-full mb-6 sm:mb-8 bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3 text-base sm:text-lg rounded-lg sm:rounded-xl transition-colors duration-300"
          disabled={!file || verificationStatus === 'verifying'}
        >
          {verificationStatus === 'verifying' ? (
            <>
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Verifying...
            </>
          ) : (
            'Verify Waste'
          )}
        </Button>

        <ResellModal
          isOpen={isResellModalOpen}
          onClose={() => setIsResellModalOpen(false)}
          onSell={handleResell}
        />
  
        {verificationStatus === 'failure' && verificationResult && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 sm:mb-8 rounded-r-lg sm:rounded-r-xl">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400 mr-3" />
              <div>
                <h3 className="text-base sm:text-lg font-medium text-red-800">Verification Failure</h3>
                <div className="mt-2 text-xs sm:text-sm text-red-700">
                  <p>Waste Type: {verificationResult.wasteType}</p>
                  <p>Quantity: {verificationResult.quantity}</p>
                  <p>Confidence: {(verificationResult.confidence * 100).toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {verificationStatus === 'success' && verificationResult && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 sm:mb-8 rounded-r-lg sm:rounded-r-xl">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 mr-3" />
              <div>
                <h3 className="text-base sm:text-lg font-medium text-green-800">Verification Successful</h3>
                <div className="mt-2 text-xs sm:text-sm text-green-700">
                  <p>Waste Type: {verificationResult.wasteType}</p>
                  <p>Quantity: {verificationResult.quantity}</p>
                  <p>No of Devices: {verificationResult.numberOfDevices}</p>
                  <p>Confidence: {(verificationResult.confidence * 100).toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

              <Button onClick={() => setIsResellModalOpen(true)} className="my-4">
                Resell Device
              </Button>
        { verificationStatus === 'success' && verificationResult?.isEwaste && verificationResult.numberOfDevices === 1 && (
              <Button onClick={() => setIsResellModalOpen(true)} className="my-4">
                Resell Device
              </Button>
            ) 
        }
  
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="relative">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={newReport.location}
              onChange={handleInputChange}
              required
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
              placeholder="Enter waste location"
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-md max-h-48 overflow-auto mt-2 w-full">
                {suggestions.map((sug, index) => (
                  <li
                    key={index}
                    className="px-3 sm:px-4 py-2 hover:bg-green-100 cursor-pointer text-sm text-gray-700"
                    onClick={() => {
                      setNewReport((prev) => ({ ...prev, location: sug }));
                      setSuggestions([]);
                    }}
                  >
                    {sug}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">
              Waste Type
            </label>
            <input
              type="text"
              id="type"
              name="type"
              value={newReport.type}
              onChange={handleInputChange}
              required
              className="w-full px-3 sm:px-4 py-2 border text-gray-700 border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
              placeholder="Verified waste type"
              readOnly
            />
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">
              Estimated Amount
            </label>
            <input
              type="text"
              id="amount"
              name="amount"
              value={newReport.amount}
              onChange={handleInputChange}
              required
              className="w-full px-3 sm:px-4 py-2 border text-gray-700 border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
              placeholder="Verified amount"
              readOnly
            />
          </div>
        </div>
  
        <Button
          type="submit"
          className="w-full mb-6 sm:mb-8 bg-green-600 hover:bg-green-700 text-white py-2 sm:py-3 text-base sm:text-lg rounded-lg sm:rounded-xl transition-colors duration-300"
          disabled={!file || verificationStatus === 'idle' || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Submitting...
            </>
          ) : (
            'Submit'
          )}
        </Button>
      </form>
  
      <Separator className="mb-4 sm:mb-6" />
  
      <h2 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6">Your Reports</h2>
  
      <div className="rounded-lg sm:rounded-2xl shadow-lg overflow-hidden dark:shadow-gray-800">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
  
            <tbody className="divide-y divide-gray-600">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-800 transition-colors duration-200">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                    <MapPin className="inline-block w-4 h-4 mr-2 text-green-700" />
                    {report.location}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                    {report.amount}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm capitalize">
                    {report.status}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                    {report.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ReportPage