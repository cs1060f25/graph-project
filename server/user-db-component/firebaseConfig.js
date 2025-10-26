// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDI6jt4aI8gqF2BdVt2a0b5uzgjq7b3Wrc",
  authDomain: "graphene-3b05a.firebaseapp.com",
  projectId: "graphene-3b05a",
  storageBucket: "graphene-3b05a.firebasestorage.app",
  messagingSenderId: "355128430723",
  appId: "1:355128430723:web:f54f883525ba6491f1cbb6",
  measurementId: "G-4BPM7H2P79"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);