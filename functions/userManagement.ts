import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

interface DeleteUserRequest {
  uid: string; 
}

export const deleteUser = functions.https.onCall(async (request: functions.https.CallableRequest<DeleteUserRequest>) => {

  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const uid = request.data.uid;

  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a valid user ID.');
  }

  try {
    await admin.auth().deleteUser(uid); 
    return { message: 'User deleted successfully' };
  } catch (error) {
    throw new functions.https.HttpsError('internal', toString());
  }
});
