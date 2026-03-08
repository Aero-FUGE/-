import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC0B_ZOJ8uaW6iuLBKmiqEmJNxuOSBR-ro",
  authDomain: "my-system-489607.firebaseapp.com",
  databaseURL: "https://my-system-489607-default-rtdb.firebaseio.com",
  projectId: "my-system-489607",
  storageBucket: "my-system-489607.firebasestorage.app",
  messagingSenderId: "544320925340",
  appId: "1:544320925340:web:ad84df94be15bbb79a0759",
  measurementId: "G-GZN73T3FJC"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
