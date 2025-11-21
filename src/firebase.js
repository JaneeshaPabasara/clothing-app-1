import { initializeApp } from "firebase/app";
import { getFirestore,enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC7EeXIINZuSK5vsC7oRKnC-lWBm2mFm9U",
  authDomain: "clothing-app-1.firebaseapp.com",
  projectId: "clothing-app-1",
  storageBucket: "clothing-app-1.firebasestorage.app",
  messagingSenderId: "195524014078",
  appId: "1:195524014078:web:10ec1e95cae7475d7d9aaf"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.log('Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.log('Browser doesn\'t support persistence');
  }
});
