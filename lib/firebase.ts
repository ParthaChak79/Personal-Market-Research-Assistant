import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  doc, 
  updateDoc,
  deleteDoc,
  setDoc,
  Firestore
} from "firebase/firestore";
import { SurveyData } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyAGUTjndcCGL8Mw-wTbhh3VkgLqnMtm0ww",
  authDomain: "studio-9383321591-160b4.firebaseapp.com",
  projectId: "studio-9383321591-160b4",
  storageBucket: "studio-9383321591-160b4.firebasestorage.app",
  messagingSenderId: "816644983448",
  appId: "1:816644983448:web:75a543d79c519370b21eed"
};

let db: Firestore | null = null;
const LOCAL_STORAGE_KEY = "aria_simulations_cache";

export function isCloudAvailable(): boolean {
  return db !== null;
}

// Lazy-initialize the database to avoid race conditions during module loading
function getDb(): Firestore | null {
  if (db) return db;
  
  try {
    let app: FirebaseApp;
    const apps = getApps();
    if (apps.length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    
    // Attempt to connect to firestore
    db = getFirestore(app);
    console.log("Firestore service connected successfully");
    return db;
  } catch (e) {
    console.error("Firestore initialization failed. If this persists, verify the Firebase console project status:", e);
    return null;
  }
}

// Fallback logic for local storage
const getLocalArchive = (): SurveyData[] => {
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  return cached ? JSON.parse(cached) : [];
};

const saveLocalArchive = (data: SurveyData[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.slice(0, 50)));
};

export async function saveSimulationToFirestore(data: SurveyData) {
  const database = getDb();
  if (!database) {
    console.warn("Cloud storage unavailable, using local fallback.");
    const archive = getLocalArchive();
    saveLocalArchive([data, ...archive]);
    return data.id;
  }

  try {
    const docRef = doc(database, "simulations", data.id);
    await setDoc(docRef, data);
    console.log("Saved to Cloud:", data.id);
    return data.id;
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      console.error("Firestore Permission Denied. Check Rules tab in Firebase Console.");
    } else {
      console.error("Firestore Save Error:", e);
    }
    const archive = getLocalArchive();
    saveLocalArchive([data, ...archive]);
    return data.id;
  }
}

export async function updateSimulationInFirestore(id: string, updates: Partial<SurveyData>) {
  const database = getDb();
  if (!database) {
    const archive = getLocalArchive();
    const updated = archive.map(a => a.id === id ? { ...a, ...updates } : a);
    saveLocalArchive(updated);
    return;
  }

  try {
    const docRef = doc(database, "simulations", id);
    await updateDoc(docRef, updates);
  } catch (e) {
    console.error("Cloud update failed:", e);
  }
}

export async function getSimulationsFromFirestore(): Promise<SurveyData[]> {
  const database = getDb();
  if (!database) {
    return getLocalArchive();
  }

  try {
    const q = query(
      collection(database, "simulations"), 
      orderBy("timestamp", "desc"), 
      limit(20)
    );
    const querySnapshot = await getDocs(q);
    const cloudResults = querySnapshot.docs.map(doc => doc.data() as SurveyData);
    
    const local = getLocalArchive();
    const merged = [...cloudResults];
    local.forEach(l => {
      if (!merged.find(m => m.id === l.id)) merged.push(l);
    });
    
    return merged.sort((a, b) => b.timestamp - a.timestamp);
  } catch (e: any) {
    console.warn("Could not fetch from Cloud:", e.message);
    return getLocalArchive();
  }
}

export async function deleteSimulationFromFirestore(id: string) {
  const database = getDb();
  
  const local = getLocalArchive();
  saveLocalArchive(local.filter(a => a.id !== id));

  if (!database) return;

  try {
    await deleteDoc(doc(database, "simulations", id));
  } catch (e) {
    console.error("Cloud delete failed:", e);
  }
}