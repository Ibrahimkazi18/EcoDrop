// pages/api/volunteers.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase'; 
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore'; 
import { Volunteer } from '@/types-db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { username, email, agencyId } = req.body;

    if (!username || !email || !agencyId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const date = new Date();

        const userData = {
          username,
          email,
          role: "volunteer",
          createdAt: date,
        }
    
        const volunteerData = {
          ...userData,
          agencyId,
          status: "available",
          tasksAssigned: [],
          temporaryPassword: Math.random().toString(36).slice(-8),
          hasSetPermanentPassword: false,
        }
    
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

        return res.status(201).json({ message: 'Volunteer added successfully!' });
    } catch (error) {
      console.error('Error adding volunteer:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  res.setHeader('Allow', ['POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
