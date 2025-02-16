import * as admin from 'firebase-admin';
import { deleteUser } from './userManagement';
import { compareTaskImages } from './imageComparision';

// Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export your functions
export { deleteUser, compareTaskImages };
