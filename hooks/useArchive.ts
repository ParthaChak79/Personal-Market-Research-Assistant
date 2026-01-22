import { useState, useEffect, useCallback } from 'react';
import { SurveyData } from '../types';
import { 
  getSimulationsFromFirestore, 
  saveSimulationToFirestore, 
  deleteSimulationFromFirestore, 
  isCloudAvailable 
} from '../lib/firebase';

export const useArchive = () => {
  const [archive, setArchive] = useState<SurveyData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(false);

  const fetchArchive = useCallback(async () => {
    setIsSyncing(true);
    try {
      const data = await getSimulationsFromFirestore();
      setArchive(data);
      setCloudConnected(isCloudAvailable());
    } catch (error) {
      console.error('Failed to fetch archive:', error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchArchive();
  }, [fetchArchive]);

  const saveSimulation = async (data: SurveyData) => {
    await saveSimulationToFirestore(data);
    setArchive(prev => [data, ...prev]);
  };

  const deleteSimulation = async (id: string) => {
    await deleteSimulationFromFirestore(id);
    setArchive(prev => prev.filter(item => item.id !== id));
  };

  return { archive, isSyncing, cloudConnected, saveSimulation, deleteSimulation };
};