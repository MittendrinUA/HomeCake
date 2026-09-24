import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDT6Ez-ZmRvEJZA3REIYDZXVI9t5Z2O9zc",
  authDomain: "backery-bc0c9.firebaseapp.com",
  projectId: "backery-bc0c9",
  storageBucket: "backery-bc0c9.firebasestorage.app",
  messagingSenderId: "236979354452",
  appId: "1:236979354452:web:5b57ad9aa4e990c6aca6c1",
  measurementId: "G-NVH0FC7917"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
