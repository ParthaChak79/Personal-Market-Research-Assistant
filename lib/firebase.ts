import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getFirestore, collection, getDocs, query, orderBy, limit, doc, deleteDoc, setDoc, Firestore 
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

const LOCAL_STORAGE_KEY = "aria_sim_cache";

function getLocal(): SurveyData[] {
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  return cached ? JSON.parse(cached) : [];
}

function saveLocal(data: SurveyData[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.slice(0, 50)));
}

let db: Firestore | null = null;
try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
} catch (err) {
  console.error("Firebase Error:", err);
}

export const isCloudAvailable = () => !!db;

export async function saveSimulationToFirestore(data: SurveyData) {
  if (db) {
    try {
      await setDoc(doc(db, "simulations", data.id), data);
    } catch (e) {
      console.warn("Cloud save failed", e);
    }
  }
  saveLocal([data, ...getLocal()]);
}

export async function getSimulationsFromFirestore(): Promise<SurveyData[]> {
  if (!db) return getLocal();

  try {
    const q = query(collection(db, "simulations"), orderBy("timestamp", "desc"), limit(20));
    const snapshot = await getDocs(q);
    const cloudResults = snapshot.docs.map(doc => doc.data() as SurveyData);
    
    const local = getLocal();
    const merged = [...cloudResults];
    local.forEach(l => {
      if (!merged.find(m => m.id === l.id)) {
        merged.push(l);
      }
    });
    return merged.sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    console.error("Fetch Error:", err);
    return getLocal();
  }
}

export async function deleteSimulationFromFirestore(id: string) {
  const current = getLocal();
  saveLocal(current.filter(item => item.id !== id));
  
  if (db) {
    try {
      await deleteDoc(doc(db, "simulations", id));
    } catch (err) {
      console.error("Delete Error:", err);
    }
  }
}