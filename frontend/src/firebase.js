// src/firebase.js
// Firebase temporariamente desabilitado - usando mock

// import { initializeApp } from "firebase/app";
// import {
// 	GoogleAuthProvider,
// 	getAuth,
// 	signInWithPopup,
// 	signOut,
// } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";

// Mock exports para manter compatibilidade
export const auth = null;
export const db = null;
export const signInWithGoogle = () => console.log("Mock signInWithGoogle");
export const logOut = () => console.log("Mock logOut");