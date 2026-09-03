// Single source of truth for Basair Academy Firebase client configuration.
// Firebase web config is public by design; authorization is enforced by Firebase Auth + Firestore rules.
export const firebaseConfig = Object.freeze({
  apiKey: "AIzaSyDBpTIOynPST6NwkDas-F_zwjFz7zA39TQ",
  authDomain: "basair-academy-4a1d0.firebaseapp.com",
  projectId: "basair-academy-4a1d0",
  messagingSenderId: "407058207953",
  appId: "1:407058207953:web:133ea372ea0ba304b1a1f0",
  measurementId: "G-3M16BKNG4P"
});

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
