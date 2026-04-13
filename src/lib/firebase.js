import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app;
let db;
let auth;

try {
  // Check if config is valid (not placeholders)
  if (!firebaseConfig.projectId || firebaseConfig.projectId.includes('remixed')) {
    console.warn("Firebase is not yet configured. Please complete the Firebase setup.");
  }
  
  app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // Provide mock/null objects to prevent immediate crashes, 
  // though the app will likely need real ones to function.
}

export { db, auth };
