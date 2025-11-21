
import firebase from "firebase/app";
import "firebase/firestore";

// Configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyAWr-0si1GYXEvmxDk8HNjGI-N-zmK6Bwo",
  authDomain: "investissements-lfjp.firebaseapp.com",
  projectId: "investissements-lfjp",
  storageBucket: "investissements-lfjp.firebasestorage.app",
  messagingSenderId: "27043603672",
  appId: "1:27043603672:web:3f55cb09d7c70f7941a3ad",
  measurementId: "G-7EDM596N7M"
};

// Initialize Firebase
// Check if firebase is already initialized to avoid errors in hot reload
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
