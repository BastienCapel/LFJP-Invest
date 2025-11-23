import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

type FirebaseEnvKey =
  | 'VITE_FIREBASE_API_KEY'
  | 'VITE_FIREBASE_AUTH_DOMAIN'
  | 'VITE_FIREBASE_PROJECT_ID'
  | 'VITE_FIREBASE_STORAGE_BUCKET'
  | 'VITE_FIREBASE_MESSAGING_SENDER_ID'
  | 'VITE_FIREBASE_APP_ID'
  | 'VITE_FIREBASE_MEASUREMENT_ID';

const firebaseEnvConfig: Record<FirebaseEnvKey, string | undefined> = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  VITE_FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const missingKeys = (Object.entries(firebaseEnvConfig) as [FirebaseEnvKey, string | undefined][])
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const isFirebaseOffline = missingKeys.length > 0;

const firebaseConfig: firebase.FirebaseOptions | null = isFirebaseOffline
  ? null
  : {
      apiKey: firebaseEnvConfig.VITE_FIREBASE_API_KEY,
      authDomain: firebaseEnvConfig.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: firebaseEnvConfig.VITE_FIREBASE_PROJECT_ID,
      storageBucket: firebaseEnvConfig.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: firebaseEnvConfig.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: firebaseEnvConfig.VITE_FIREBASE_APP_ID,
      measurementId: firebaseEnvConfig.VITE_FIREBASE_MEASUREMENT_ID
    };

// Initialize Firebase (Compat SDK) only when fully configured
export const db: firebase.firestore.Firestore | null = firebaseConfig
  ? firebase.initializeApp(firebaseConfig).firestore()
  : null;
