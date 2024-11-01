import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; 
import { addDoc, collection, doc, getDocs, updateDoc } from "firebase/firestore"; 
import { getAuth } from "firebase-admin/auth";

export const  POST = async (req: Request) => {
  try {
    const body = await req.json();
    const user = await getAuth().verifyIdToken(body.idToken); // Pass idToken from the client

    if (!user) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { username, email, agencyId } = body;

    if (!username) {
      return NextResponse.json("Username is missing", { status: 400 });
    }
    if (!email) {
      return NextResponse.json("Email is missing", { status: 400 });
    }
    if (!agencyId) {
      return NextResponse.json("AgencyId is missing", { status: 400 });
    }

    const date = new Date();

    const userData = {
      username,
      email,
      role: "volunteer",
      createdAt: date,
    };

    const volunteerData = {
      ...userData,
      agencyId,
      status: "available",
      tasksAssigned: [],
      temporaryPassword: Math.random().toString(36).slice(-8),
      hasSetPermanentPassword: false,
    };

    const userRef = await addDoc(collection(db, "users"), userData);
    const userId = userRef.id;

    await updateDoc(doc(db, "users", userId), {
      ...userData,
      id: userId,
    });

    const volunteerRef = await addDoc(collection(db, "volunteers"), volunteerData);
    const volunteerId = volunteerRef.id;

    await updateDoc(doc(db, "volunteers", volunteerId), {
      ...volunteerData,
      id: volunteerId,
    });

    return NextResponse.json({ id: volunteerId, ...volunteerData });

  } catch (error) {
    console.error('Error in POST volunteer:', error); // Improved error logging
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
