import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration for Web SDK
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate configuration
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_WEB_API_KEY_HERE') {
  throw new Error(
    'Firebase Web API Key is missing! Please:\n' +
    '1. Go to https://console.firebase.google.com/\n' +
    '2. Select project "genx-ai-58572"\n' +
    '3. Click ⚙️ → Project settings\n' +
    '4. Scroll to "Your apps" → Add web app (if not exists)\n' +
    '5. Copy apiKey and appId to .env.local\n' +
    '6. Set NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_APP_ID'
  );
}

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore
export const db = getFirestore(app);

export default app;
