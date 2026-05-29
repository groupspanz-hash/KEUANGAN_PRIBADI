import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Add databaseURL from the user's prompt to the config if not present
const configWithDbUrl = {
  ...firebaseConfig,
  databaseURL: 'https://keuangan-pribadi-3ebf9-default-rtdb.asia-southeast1.firebasedatabase.app/'
};

const app = initializeApp(configWithDbUrl);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

export default app;
