import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore with long polling for better reliability in this environment
const dbId = (firebaseConfig as any).firestoreDatabaseId && (firebaseConfig as any).firestoreDatabaseId !== '(default)'
  ? (firebaseConfig as any).firestoreDatabaseId
  : undefined;

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, dbId);

export const storage = getStorage(app);

export default app;
