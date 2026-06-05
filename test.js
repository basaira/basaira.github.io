import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const app = initializeApp({ projectId: "test" });
console.log(initializeFirestore.toString());
