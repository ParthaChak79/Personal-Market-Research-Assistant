
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
let dbInstance: Firestore | null = null;

/**
 * Ensures Firebase is initialized only once and handles potential connection failures gracefully.
 */
function initDb(): Firestore | null {
  if (dbInstance) return dbInstance;
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    dbInstance = getFirestore(app);
    return dbInstance;
  } catch (err) {
    console.error("Firebase Initialization Error - Operating in Local Mode", err);
    return null;
  }
}

export const isCloudAvailable = () => initDb() !== null;

/** 
 * Persistent Local Fallback: Always cache the latest 50 records locally 
 */
const getLocal = (): SurveyData[] => JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
const saveLocal = (data: SurveyData[]) => localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.slice(0, 50)));

export async function saveSimulationToFirestore(data: SurveyData) {
  const db = initDb();
  if (db) {
    try {
      await setDoc(doc(db, "simulations", data.id), data);
    } catch (e) {
      console.warn("Cloud save failed, falling back to local storage.");
    }
  }
  saveLocal([data, ...getLocal()]);
}

export async function getSimulationsFromFirestore(): Promise<SurveyData[]> {
  const db = initDb();
  if (!db) return getLocal();

  try {
    const q = query(collection(db, "simulations"), orderBy("timestamp", "desc"), limit(20));
    const snapshot = await getDocs(q);
    const cloudResults = snapshot.docs.map(d => d.data() as SurveyData);
    
    // Merge cloud results with local results (deduplicated)
    const local = getLocal();
    const merged = [...cloudResults];
    local.forEach(l => { if (!merged.find(m => m.id === l.id)) merged.push(l); });
    return merged.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return getLocal();
  }
}

export async function deleteSimulationFromFirestore(id: string) {
  saveLocal(getLocal().filter(item => item.id !== id));
  const db = initDb();
  if (db) {
    try {
      await deleteDoc(doc(db, "simulations", id));
    } catch {}
  }
}
