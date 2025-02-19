import * as admin from 'firebase-admin';
import { deleteUser } from './userManagement';
import { compareTaskImages } from './imageComparision';
import { autoVerify } from './autoVerify';

// Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export your functions
export { deleteUser, compareTaskImages, autoVerify };
