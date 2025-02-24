import * as admin from 'firebase-admin';
import { deleteUser } from './userManagement';
import { compareTaskImages } from './imageComparision';
import { autoVerify } from './autoVerify';

if (!admin.apps.length) {
  admin.initializeApp();
}

export { deleteUser, compareTaskImages, autoVerify };