import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

const ActiveWorkoutContext = createContext(null);

export const ActiveWorkoutProvider = ({ children }) => {
  const [activeWorkout, setActiveWorkout] = useState(null);
  const activeWorkoutRef = useRef(activeWorkout);
  activeWorkoutRef.current = activeWorkout;

  // Global 1-second interval timer for active workout
  useEffect(() => {
    if (!activeWorkout || !activeWorkout.isActive) return;

    const interval = setInterval(() => {
      setActiveWorkout(prev => {
        if (!prev || !prev.isActive) return prev;
        // Do not tick duration during rest timer or if paused
        if (prev.isRestTimerVisible || prev.isPaused) {
          return {
            ...prev,
            restSeconds: (prev.restSeconds || 0) + (prev.isRestTimerVisible ? 1 : 0),
          };
        }
        return {
          ...prev,
          seconds: (prev.seconds || 0) + 1,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeWorkout?.isActive, activeWorkout?.isRestTimerVisible, activeWorkout?.isPaused]);

  // Start a new workout session
  const startWorkout = useCallback((data) => {
    setActiveWorkout({
      isActive: true,
      isPaused: false,
      workoutTitle: data.workoutTitle || data.workoutName || 'Workout',
      workoutNotes: data.workoutNotes || '',
      level: data.level || 'Intermediate',
      duration: data.duration || 0,
      source: data.source || '',
      folderName: data.folderName || '',
      templateId: data.templateId || null,
      isCustomWorkout: Boolean(data.isCustomWorkout),
      isSetupMode: Boolean(data.isSetupMode),
      exercises: data.exercises || [],
      seconds: data.seconds || 0,
      startTime: Date.now() - (data.seconds || 0) * 1000,
      isRestTimerVisible: false,
      restSeconds: 0,
      activeTimerSetIds: [],
    });
  }, []);

  // Update ongoing workout state (exercises, title, notes, etc.)
  const updateWorkout = useCallback((updates) => {
    setActiveWorkout(prev => {
      if (!prev || !prev.isActive) return prev;
      const nextData = typeof updates === 'function' ? updates(prev) : updates;
      return { ...prev, ...nextData };
    });
  }, []);

  // Discard workout session completely
  const discardWorkout = useCallback(() => {
    setActiveWorkout(null);
  }, []);

  // Finish workout session (successfully saved/completed)
  const finishWorkout = useCallback(() => {
    setActiveWorkout(null);
  }, []);

  // Computed total completed sets
  const completedSetsCount = useMemo(() => {
    if (!activeWorkout || !Array.isArray(activeWorkout.exercises)) return 0;
    return activeWorkout.exercises.reduce((acc, ex) => {
      const sets = Array.isArray(ex.sets) ? ex.sets : [];
      return acc + sets.filter(s => s.completed).length;
    }, 0);
  }, [activeWorkout?.exercises]);

  // Computed total volume in kg
  const totalVolume = useMemo(() => {
    if (!activeWorkout || !Array.isArray(activeWorkout.exercises)) return 0;
    return activeWorkout.exercises.reduce((acc, ex) => {
      const sets = Array.isArray(ex.sets) ? ex.sets : [];
      return acc + sets.reduce((sAcc, s) => {
        if (!s.completed) return sAcc;
        const w = parseFloat(s.weight) || 0;
        const r = parseInt(s.reps, 10) || 0;
        return sAcc + Math.round(w * r);
      }, 0);
    }, 0);
  }, [activeWorkout?.exercises]);

  const value = useMemo(() => ({
    activeWorkout,
    startWorkout,
    updateWorkout,
    discardWorkout,
    finishWorkout,
    completedSetsCount,
    totalVolume,
  }), [
    activeWorkout,
    startWorkout,
    updateWorkout,
    discardWorkout,
    finishWorkout,
    completedSetsCount,
    totalVolume,
  ]);

  return (
    <ActiveWorkoutContext.Provider value={value}>
      {children}
    </ActiveWorkoutContext.Provider>
  );
};

export const useActiveWorkout = () => {
  const ctx = useContext(ActiveWorkoutContext);
  if (!ctx) {
    throw new Error('useActiveWorkout must be used within an ActiveWorkoutProvider');
  }
  return ctx;
};

export default ActiveWorkoutContext;
