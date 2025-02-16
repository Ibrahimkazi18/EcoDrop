import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { taskId, citizenImageUrl, volunteerImageUrl } = req.body;

        // Log the request to verify the data
        console.log("Received Data:", req.body);

        // Ensure all required fields are present
        if (!taskId || !citizenImageUrl || !volunteerImageUrl) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const verificationResponse = await fetch("https://comparetaskimages-zx7jn6k5ja-uc.a.run.app", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId, citizenImageUrl, volunteerImageUrl }),  // Send the data as JSON
        });

        const textResponse = await verificationResponse.text();  // Get raw text response

        console.log("Cloud Run Response:", textResponse);  // Log the full response for further debugging

        try {
            const data = JSON.parse(textResponse);  // Parse the response as JSON
            return res.status(verificationResponse.status).json(data);  // Send response to the client
        } catch (jsonError) {
            console.error("Invalid JSON response from Cloud Run:", textResponse);
            return res.status(500).json({ error: "Invalid response from server" });
        }

    } catch (error) {
        console.error("Error verifying image:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}