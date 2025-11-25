
import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { Project } from '../types';
import { INITIAL_PROJECTS, INITIAL_STUDENT_COUNT } from '../constants';

const SIMULATION_DOC_ID = 'lfjp_current_simulation';
const LOCAL_STORAGE_KEY = 'lfjp_invest_backup';

export const usePersistence = (isLocked: boolean) => {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [studentCount, setStudentCount] = useState<number>(INITIAL_STUDENT_COUNT);
  const [feeRates, setFeeRates] = useState<Record<number, number>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [dbStatus, setDbStatus] = useState<'connected' | 'offline' | 'error'>('offline');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const ignoreRemoteUpdate = useRef(false);

  // Merges saved projects with the codebase's INITIAL_PROJECTS
  const mergeProjects = useCallback((savedProjects: Project[]) => {
    if (!savedProjects || !Array.isArray(savedProjects)) return INITIAL_PROJECTS;
    const savedMap = new Map(savedProjects.map(p => [p.id, p]));
    return INITIAL_PROJECTS.map(initP => {
      const savedP = savedMap.get(initP.id);
      if (savedP) {
        return {
          ...initP,
          isActive: savedP.isActive,
          totalCost: savedP.totalCost,
          startYear: savedP.startYear,
          durationYears: savedP.durationYears,
        };
      }
      return initP;
    });
  }, []);

  // 1. Load Data
  useEffect(() => {
    if (!db) {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
             try {
                const parsed = JSON.parse(local);
                if (parsed.projects) setProjects(mergeProjects(parsed.projects));
                if (parsed.studentCount) setStudentCount(parsed.studentCount);
                if (parsed.feeRates) setFeeRates(parsed.feeRates);
            } catch(e) {}
        }
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    const docRef = db.collection("simulations").doc(SIMULATION_DOC_ID);
    
    const unsub = docRef.onSnapshot(
      (docSnap: any) => {
        const exists = typeof docSnap.exists === 'function' ? docSnap.exists() : docSnap.exists;

        if (exists) {
          const data = docSnap.data();
          const mergedProjects = data.projects ? mergeProjects(data.projects) : INITIAL_PROJECTS;
          
          ignoreRemoteUpdate.current = true;

          setProjects(mergedProjects);
          if (data.studentCount) setStudentCount(data.studentCount);
          if (data.feeRates) setFeeRates(data.feeRates);
          
          setDbStatus('connected');
          setErrorMessage(null);
          setLastSaved(new Date());
          
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
              ...data,
              projects: mergedProjects
          }));
        } else {
          setDbStatus('connected');
        }
        setIsLoading(false);
      },
      (error: any) => {
        console.error("Firebase Error:", error);
        if (error.code === 'permission-denied') {
            setErrorMessage("Accès refusé. Veuillez vérifier les règles de sécurité dans la console Firebase.");
        } else if (error.code === 'unavailable') {
            setErrorMessage("Hors ligne. Passage en mode local.");
            setDbStatus('offline');
        } else {
            setErrorMessage(error.message);
            setDbStatus('error');
        }

        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                if (parsed.projects) setProjects(mergeProjects(parsed.projects));
                if (parsed.studentCount) setStudentCount(parsed.studentCount);
                if (parsed.feeRates) setFeeRates(parsed.feeRates);
            } catch (e) {}
        }
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, [mergeProjects]);

  // 2. Save Data
  useEffect(() => {
    if (isLoading) return;

    if (ignoreRemoteUpdate.current) {
      ignoreRemoteUpdate.current = false;
      return;
    }

    const saveData = async () => {
      setIsSaving(true);
      const now = new Date();
      const dataToSave = {
          projects,
          studentCount,
          feeRates,
          updatedAt: now.toISOString()
      };

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));

      if (db) {
        try {
            const docRef = db.collection("simulations").doc(SIMULATION_DOC_ID);
            await docRef.set(dataToSave, { merge: true });
            setDbStatus('connected');
            setErrorMessage(null);
            setLastSaved(now);
        } catch (error: any) {
            console.error("Save failed", error);
            if (error.code === 'permission-denied') {
                setDbStatus('error');
                setErrorMessage("Permission refusée lors de la sauvegarde.");
            } else {
                setDbStatus('offline');
            }
        }
      }
      setIsSaving(false);
    };

    const timeoutId = setTimeout(saveData, 2000);
    return () => clearTimeout(timeoutId);
  }, [projects, studentCount, feeRates, isLoading]);

  // Actions
  const handleResetData = async () => {
    if (isLocked) return;
    if (window.confirm("Voulez-vous vraiment réinitialiser toutes les données aux valeurs par défaut ?")) {
      setProjects(INITIAL_PROJECTS);
      setStudentCount(INITIAL_STUDENT_COUNT);
      setFeeRates({});
    }
  };

  const toggleProject = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  const updateProjectCost = (id: string, cost: number) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, totalCost: cost } : p));
  };

  const updateProjectPeriod = (id: string, startYear: number, endYear: number) => {
    const duration = Math.max(1, endYear - startYear + 1);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, startYear, durationYears: duration } : p));
  };

  const updateFeeRate = (year: number, rate: number) => {
    setFeeRates(prev => ({ ...prev, [year]: rate }));
  };

  return {
    projects,
    studentCount,
    setStudentCount,
    feeRates,
    isLoading,
    isSaving,
    lastSaved,
    dbStatus,
    errorMessage,
    actions: {
        toggleProject,
        updateProjectCost,
        updateProjectPeriod,
        updateFeeRate,
        handleResetData
    }
  };
};
