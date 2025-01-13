"use client"

import { useState } from "react";

// Add this component temporarily to test your API key
const TestApiKey = () => {
    const [apiStatus, setApiStatus] = useState('');
    console.log("API Key:", process.env.NEXT_PUBLIC_GEMINI_API_KEY);
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const testKey = async () => {
        if (!key) {
            console.error('API key not found in environment');
            return;
        }
    
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

        const requestBody = {
            contents: [
              {
                parts: [
                  {
                    text: "Describe the process of verifying waste segregation.",
                  },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: "application/json",
              responseSchema: {
                type: "object",
                properties: {
                  definition: { type: "string" },
                  example: { type: "string" },
                },
              },
            },
          };
    
          const result = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            }
          );

        const data = await result.json() ;
        console.log(data);
    };
    

    return (
        <div className="p-4 bg-gray-100 rounded-lg mb-4">
            <button 
                onClick={testKey}
                className="px-4 py-2 bg-blue-500 text-white rounded"
            >
                Test API Key
            </button>
            {apiStatus && (
                <p className="mt-2">{apiStatus}</p>
            )}
        </div>
    );
};

export default TestApiKey