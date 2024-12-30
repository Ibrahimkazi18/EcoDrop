"use client"

import { useEffect, useState, useCallback } from "react";
import { MapPin, Upload, CheckCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleGenerativeAI } from "@google/generative-ai"
import { StandaloneSearchBox, useJsApiLoader, Libraries } from "@react-google-maps/api"
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createReport, getReportsCitizen } from "@/hooks/create-report";
import useAuthStore from "@/store/authStore";

const geminiApiKey = process.env.GEMINI_API_KEY as any;
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY as any;

const libraries : Libraries = ["places"]; 

const ReportPage = () => {
  const router = useRouter();   
  const userId = useAuthStore((state) => state.userId);

  const [reports, setReports] = useState<
    Array<{
        id: number;
        location: string;
        wasteType: string;
        amount: string;
        createdAt: string;
    }>
  >([]);

  const [newReport, setNewReport] = useState({
    location: "",
    type: "",
    amount: ""
  })

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const [verificationStatus, setVerificationStatus ] = useState<
    'idle' | 'verifying' | 'success' | 'failure'
  >('idle');

  const [verificationResult, setVerificationResult] = useState<{
    wasteType: string,
    quantity: string,
    confidence: number
  } | null> (null)

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);

  const {isLoaded} = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey,
    libraries: libraries,
  })

  const onLoad = useCallback((ref : google.maps.places.SearchBox) => {
    setSearchBox(ref)
  }, []);

  const onPlaceChange = () => {
    if(searchBox){
        const places = searchBox.getPlaces();

        if(places && places.length > 0) {
            const place = places[0];

            setNewReport((prev) => ({
                ...prev,
                location: place.formatted_address || "",
            }))
        }
    }   
  }

  const handleInputChange = (e:React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {name, value} = e.target;

    setNewReport({...newReport, [name]:value })
  }

  const handleFileChange = (e:React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files && e.target.files[0]){
        const selectedFile = e.target.files[0];
        setFile(selectedFile);

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

    setVerificationStatus("verifying");

    try {
        const genAi = new GoogleGenerativeAI(geminiApiKey);
        const model = genAi.getGenerativeModel({model: 'gemini-1.5-flash'});
        const base64Data = await readFileAsBase64(file);

        const imageParts = [
            {
                inlineData : {
                    data : base64Data.split(',')[1],
                    mimeType: file.type,
                }
            }
        ];

        const prompt = `You are an expert in waste management and recycling. Analyze this image and provide: 
        1. The type of waste (e.g., plastic, paper, glass, metal, organic)
        2. An estimate of the quantity or amount (in kg or litres)
        3. Your confidence level in this assessment (as a percentage)
        
        Respond in JSON format like this:
        {
            "wasteType" : "type of waste",
            "quantity" : "estimated quantity with unit",
            "confidence" : confidence level as a number between 0 and 1
        }`;

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();

        try {
            const parseResult = JSON.parse(text);

            if(parseResult.wasteType && parseResult.quantity && parseResult.confidence){
                setVerificationResult(parseResult);
                setVerificationStatus('success');
                setNewReport({
                    ...newReport,
                    type: parseResult.wasteType,
                    amount: parseResult.quantity,
                })
            }
            else {
                console.error("Invlaid verification result ", parseResult);
                setVerificationStatus('failure');
            }
        } catch (error) {
            console.error("Failed to parse JSON responses ", error);
            setVerificationStatus('failure');
        }

    } catch(e){
        console.error("Errror verifying waste ", e);
        setVerificationStatus('failure');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if(verificationStatus != 'success' || !userId){
        toast.error("Please verify the waste before submitting or login");
        return;
    }

    setIsSubmitting(true);

    try {
        const report = await createReport(
            userId, 
            newReport.location, 
            newReport.type, 
            newReport.amount, 
            preview || undefined, 
            verificationResult ? JSON.stringify(verificationResult) : undefined) as any;

            const formattedReport = {
                id : report.id,
                location : report.location,
                wasteType : report.wasteType,
                amount : report.amount,
                createdAt: report.createdAt.toISOString().split("T")[0],
            }

            setReports([...reports, formattedReport]);
            setNewReport({location: "", amount: "", type: ""});
            setFile(null);
            setPreview(null);
            setVerificationStatus("idle");
            setVerificationResult(null);

            toast.success("Report submitted successfully!")

    } catch (error) {
        console.error("Error creating report:", error);
        toast.error("Failed to submit report. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  }

  useEffect(() => {
    const getReports = async () => {
        if(userId) {
            const reports = await getReportsCitizen(userId, 5) as any;

            const formattedReports = reports.map((report : any) => ({
                ...report,
                createdAt: report.createdAt.toISOString().split('T')[0]
            }))

            setReports(formattedReports);
        }
        else {
            console.error("Not logged in ", userId);
        }
    }
    getReports();
  }, [router])

  return (
    <div className="p-8 max-w-5xl mx-auto">
        <h1 className="font-semibold text-3xl mb-6 dark:text-gray-100 text-gray-800">Report Waste</h1>

        <form onSubmit={handleSubmit} className="dark:bg-gray-800 bg-gray-50 p-8 rounded-2xl shadow-lg mb-12">

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
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
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

        {verificationStatus === 'success' && verificationResult && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-8 rounded-r-xl">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-green-800">Verification Successful</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Waste Type: {verificationResult.wasteType}</p>
                  <p>Quantity: {verificationResult.quantity}</p>
                  <p>Confidence: {(verificationResult.confidence * 100).toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">Location</label>
            {isLoaded ? (
              <StandaloneSearchBox
                onLoad={onLoad}
                onPlacesChanged={onPlaceChange}
              >
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={newReport.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                  placeholder="Enter waste location"
                />
              </StandaloneSearchBox>
            ) : (
              <input
                type="text"
                id="location"
                name="location"
                value={newReport.location}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                placeholder="Enter waste location"
              />
            )}
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">Waste Type</label>
            <input
              type="text"
              id="type"
              name="type"
              value={newReport.type}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
              placeholder="Verified waste type"
              readOnly
            />
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">Estimated Amount</label>
            <input
              type="text"
              id="amount"
              name="amount"
              value={newReport.amount}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
              placeholder="Verified amount"
              readOnly
            />
          </div>
        </div>

        </form>
    </div>
  )
}

export default ReportPage