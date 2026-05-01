import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDGJoWO8DFKcC9VcE0JCOyANyypyR9255I",
  authDomain: "study-hub-3770e.firebaseapp.com",
  projectId: "study-hub-3770e",
  storageBucket: "study-hub-3770e.firebasestorage.app",
  messagingSenderId: "515371229052",
  appId: "1:515371229052:web:fb386274c133b7a480cef9",
};

export const firebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
export const firebaseAuth = typeof window !== "undefined" ? getAuth(firebaseApp) : null;
export const firestore = getFirestore(firebaseApp);
