// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyArk2zZAi-bTOMEDBCYhIfV5A_wa5HDtKk",
  authDomain: "calendar-app-users.firebaseapp.com",
  projectId: "calendar-app-users",
  storageBucket: "calendar-app-users.firebasestorage.app",
  messagingSenderId: "1080829234928",
  appId: "1:1080829234928:web:ed621e55af332f93553c35",
  measurementId: "G-FNVS0K0EVD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Correct: export Firestore instance
export const db = getFirestore(app);