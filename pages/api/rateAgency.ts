import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { agencyId, rating } = req.query;

    if (!agencyId || typeof agencyId !== "string") {
      return res.status(400).json({ error: "Missing agencyId parameter" });
    }

    const numericRating = Number(rating);

    if (!numericRating || typeof numericRating !== "number") {
      return res.status(400).json({ error: "Missing rating parameter" });
    }

    const agencyRef = doc(db, "agencies", agencyId);
    const agencySnap = await getDoc(agencyRef);

    if (agencySnap.exists()) {
        const data = agencySnap.data();
        const currentRatings = data.ratings || [];
        await setDoc(agencyRef, { ratings: [...currentRatings, numericRating] }, { merge: true });
    }
    res.status(200).json({  message: "Rating done successfully" });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}