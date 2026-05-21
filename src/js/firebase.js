import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Replace ALL values below with your Firebase project config.
// Get this from: Firebase Console → Project Settings → Your apps → SDK setup and configuration
const firebaseConfig = {
  apiKey: "AIzaSyB_U0Ibj7dKQ1EX_8VSwCBlw7fGGHdiU_8",
  authDomain: "edwin-portfolio-d63bf.firebaseapp.com",
  projectId: "edwin-portfolio-d63bf",
  storageBucket: "edwin-portfolio-d63bf.firebasestorage.app",
  messagingSenderId: "608042096761",
  appId: "1:608042096761:web:ed210ca26d24f37faedca8",
  measurementId: "G-ZV33GZDMY2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
