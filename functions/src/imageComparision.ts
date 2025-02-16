import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { ImageAnnotatorClient } from '@google-cloud/vision';

if (admin.apps.length === 0) {
  admin.initializeApp();
}
// Interface for the request
interface ImageComparisonRequest {
  taskId: string; 
  citizenImageUrl: string; 
  volunteerImageUrl: string; 
}

export const compareTaskImages = functions.https.onCall(async (request: functions.https.CallableRequest<ImageComparisonRequest>) => {

  // Check for authentication
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { taskId, citizenImageUrl, volunteerImageUrl } = request.data;
  console.log(request);

  if (!taskId) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a valid task ID.');
  }
  if (!citizenImageUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a citizenImageUrl.');
  }
  if (!volunteerImageUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a citizenImageUrl.');
  }

  try {
    // Call the comparison function
    const comparisonResult = await compareImages(citizenImageUrl, volunteerImageUrl);

    if (comparisonResult) {
        return { message: 'Verified.' };
    }
    else {
        return { message: 'Failed.' };
    }

  } catch (error: any) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message || 'An error occurred while comparing images.');
  }
});

// Function to analyze image using Google Vision API
async function getImageAnalysis(imageUrl: string) {
  const client = new ImageAnnotatorClient();
  const [result] = await client.labelDetection(imageUrl);
  const labels = result.labelAnnotations;
  return labels;
}

// Function to compare waste in two sets of labels
function compareWasteInImages(citizenLabels: any[] | null | undefined, volunteerLabels: any[] | null | undefined) {
  const wasteKeywords = ['waste', 'garbage', 'trash', 'debris', 'e-waste', 'e waste', 'electronic waste', 'electronic-waste'];

  const citizenWasteLabels = citizenLabels?.filter((label: any) => wasteKeywords.includes(label.description.toLowerCase()));
  const volunteerWasteLabels = volunteerLabels?.filter((label: any) => wasteKeywords.includes(label.description.toLowerCase()));

  if(!citizenWasteLabels || !volunteerWasteLabels) return

  if (citizenWasteLabels.length > 0 && volunteerWasteLabels.length === 0) {
    // Waste detected in citizen's image but not in volunteer's image
    return true; // Waste has been cleaned
  } else {
    return false; // Waste is still visible or not detected
  }
}

// Compare the two images
async function compareImages(citizenImageUrl: string, volunteerImageUrl: string) {
  const citizenLabels = await getImageAnalysis(citizenImageUrl);
  const volunteerLabels = await getImageAnalysis(volunteerImageUrl);

  return compareWasteInImages(citizenLabels, volunteerLabels);
}