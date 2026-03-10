import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export type RoomStatus = 'on' | 'off' | 'countdown';

export interface Room {
  id: number;
  name: string;
  status: RoomStatus;
  lights: boolean;
  fan: boolean;
  ac: boolean;
  faceCount: number;
  confidence: number;
  onSince: number | null;
  countdownRemaining: number | null;
  manualOverride: 'none' | 'forceOn' | 'forceOff';
  totalOnSeconds: number;
}

export interface LogEntry {
  id: number;
  room: string;
  action: string;
  reason: string;
  time: Date;
}

export interface Settings {
  powerOffDelay: number;
  electricityRate: number;
  nightModeEnabled: boolean;
  nightModeStart: string;
  nightModeEnd: string;
  detectionSensitivity: number;
  roomDevices: { [roomId: number]: { lights: boolean; fan: boolean; ac: boolean } };
}

interface GridSenseContextType {
  rooms: Room[];
  settings: Settings;
  logs: LogEntry[];
  holidayMode: boolean;
  selectedCameraRoom: number;
  cameraActive: boolean;
  modelLoaded: boolean;
  modelError: boolean;
  setSelectedCameraRoom: (id: number) => void;
  setCameraActive: (active: boolean) => void;
  setModelLoaded: (loaded: boolean) => void;
  setModelError: (error: boolean) => void;
  updateRoom: (id: number, updates: Partial<Room>) => void;
  updateSettings: (updates: Partial<Settings>) => void;
  updateRoomName: (id: number, name: string) => void;
  updateRoomDevices: (id: number, devices: { lights?: boolean; fan?: boolean; ac?: boolean }) => void;
  setManualOverride: (id: number, override: 'none' | 'forceOn' | 'forceOff') => void;
  emergencyCutoff: () => void;
  toggleHolidayMode: () => void;
  addLog: (room: string, action: string, reason: string) => void;
  detectFaces: (roomId: number, faceCount: number, confidence: number) => void;
  noFacesDetected: (roomId: number) => void;
}

const GridSenseContext = createContext<GridSenseContextType | null>(null);

const defaultRooms: Room[] = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  name: `Room ${101 + i}`,
  status: 'off' as RoomStatus,
  lights: false,
  fan: false,
  ac: false,
  faceCount: 0,
  confidence: 0,
  onSince: null,
  countdownRemaining: null,
  manualOverride: 'none' as const,
  totalOnSeconds: 0,
}));

const defaultSettings: Settings = {
  powerOffDelay: 30,
  electricityRate: 6,
  nightModeEnabled: false,
  nightModeStart: '22:00',
  nightModeEnd: '06:00',
  detectionSensitivity: 50,
  roomDevices: Object.fromEntries(
    Array.from({ length: 6 }, (_, i) => [i + 1, { lights: true, fan: true, ac: true }])
  ),
};

export function GridSenseProvider({ children }: { children: React.ReactNode }) {
  const [rooms, setRooms] = useState<Room[]>(defaultRooms);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [holidayMode, setHolidayMode] = useState(false);
  const [selectedCameraRoom, setSelectedCameraRoom] = useState(1);
  const [cameraActive, setCameraActive] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);
  const logIdRef = useRef(0);
  const countdownTimers = useRef<{ [roomId: number]: NodeJS.Timeout }>({});

  const addLog = useCallback((room: string, action: string, reason: string) => {
    setLogs(prev => {
      const entry: LogEntry = { id: ++logIdRef.current, room, action, reason, time: new Date() };
      return [entry, ...prev].slice(0, 50);
    });
  }, []);

  const updateRoom = useCallback((id: number, updates: Partial<Room>) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const updateRoomName = useCallback((id: number, name: string) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, name: name.slice(0, 20) } : r));
  }, []);

  const updateRoomDevices = useCallback((id: number, devices: { lights?: boolean; fan?: boolean; ac?: boolean }) => {
    setSettings(prev => ({
      ...prev,
      roomDevices: {
        ...prev.roomDevices,
        [id]: { ...prev.roomDevices[id], ...devices },
      },
    }));
  }, []);

  const setManualOverride = useCallback((id: number, override: 'none' | 'forceOn' | 'forceOff') => {
    setRooms(prev => prev.map(r => {
      if (r.id !== id) return r;
      const devices = settings.roomDevices[id];
      if (override === 'forceOn') {
        return { ...r, manualOverride: override, status: 'on', lights: devices.lights, fan: devices.fan, ac: devices.ac, onSince: r.onSince || Date.now(), countdownRemaining: null };
      }
      if (override === 'forceOff') {
        if (countdownTimers.current[id]) { clearInterval(countdownTimers.current[id]); delete countdownTimers.current[id]; }
        return { ...r, manualOverride: override, status: 'off', lights: false, fan: false, ac: false, onSince: null, countdownRemaining: null, faceCount: 0 };
      }
      return { ...r, manualOverride: 'none' };
    }));
    const room = rooms.find(r => r.id === id);
    addLog(room?.name || `Room ${id}`, `Manual Override: ${override}`, 'Admin action');
  }, [rooms, settings, addLog]);

  const emergencyCutoff = useCallback(() => {
    Object.values(countdownTimers.current).forEach(t => clearInterval(t));
    countdownTimers.current = {};
    setRooms(prev => prev.map(r => ({
      ...r, status: 'off', lights: false, fan: false, ac: false,
      onSince: null, countdownRemaining: null, faceCount: 0, manualOverride: 'forceOff',
    })));
    addLog('ALL ROOMS', 'Emergency Cutoff', 'Admin triggered emergency cutoff');
  }, [addLog]);

  const toggleHolidayMode = useCallback(() => {
    setHolidayMode(prev => {
      const next = !prev;
      if (next) {
        Object.values(countdownTimers.current).forEach(t => clearInterval(t));
        countdownTimers.current = {};
        setRooms(prev2 => prev2.map(r => ({
          ...r, status: 'off', lights: false, fan: false, ac: false,
          onSince: null, countdownRemaining: null, faceCount: 0, manualOverride: 'forceOff',
        })));
        addLog('ALL ROOMS', 'Holiday Mode ON', 'All rooms forced OFF');
      } else {
        setRooms(prev2 => prev2.map(r => ({ ...r, manualOverride: 'none' })));
        addLog('ALL ROOMS', 'Holiday Mode OFF', 'Detection re-enabled');
      }
      return next;
    });
  }, [addLog]);

  const detectFaces = useCallback((roomId: number, faceCount: number, confidence: number) => {
    setRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      if (r.manualOverride !== 'none' || holidayMode) return r;
      const devices = settings.roomDevices[roomId];
      if (countdownTimers.current[roomId]) {
        clearInterval(countdownTimers.current[roomId]);
        delete countdownTimers.current[roomId];
      }
      const wasOff = r.status === 'off' || r.status === 'countdown';
      if (wasOff) {
        addLog(r.name, 'Power ON', `${faceCount} face(s) detected (${Math.round(confidence * 100)}%)`);
      }
      return {
        ...r,
        status: 'on',
        faceCount,
        confidence,
        lights: devices.lights,
        fan: devices.fan,
        ac: devices.ac,
        onSince: r.onSince || Date.now(),
        countdownRemaining: null,
      };
    }));
  }, [settings, holidayMode, addLog]);

  const noFacesDetected = useCallback((roomId: number) => {
    setRooms(prev => {
      const room = prev.find(r => r.id === roomId);
      if (!room || room.manualOverride !== 'none' || room.status === 'off' || holidayMode) return prev;
      if (room.status === 'countdown') return prev;

      // Start countdown
      const delay = settings.powerOffDelay;
      let remaining = delay;

      if (countdownTimers.current[roomId]) clearInterval(countdownTimers.current[roomId]);

      countdownTimers.current[roomId] = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearInterval(countdownTimers.current[roomId]);
          delete countdownTimers.current[roomId];
          setRooms(p => p.map(r => {
            if (r.id !== roomId || r.manualOverride !== 'none') return r;
            addLog(r.name, 'Power OFF', 'No faces detected - countdown expired');
            return { ...r, status: 'off', lights: false, fan: false, ac: false, onSince: null, countdownRemaining: null, faceCount: 0 };
          }));
        } else {
          setRooms(p => p.map(r => r.id === roomId ? { ...r, countdownRemaining: remaining } : r));
        }
      }, 1000);

      addLog(room.name, 'Countdown Started', `No faces - powering off in ${delay}s`);
      return prev.map(r => r.id === roomId ? { ...r, status: 'countdown', countdownRemaining: delay, faceCount: 0, confidence: 0 } : r);
    });
  }, [settings, holidayMode, addLog]);

  // Track total on seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRooms(prev => prev.map(r => {
        if (r.status === 'on' && r.onSince) {
          return { ...r, totalOnSeconds: r.totalOnSeconds + 1 };
        }
        return r;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Night mode check
  useEffect(() => {
    if (!settings.nightModeEnabled) return;
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const inNightMode = currentTime >= settings.nightModeStart || currentTime < settings.nightModeEnd;
      if (inNightMode) {
        setRooms(prev => prev.map(r => {
          if (r.status !== 'off') {
            return { ...r, status: 'off', lights: false, fan: false, ac: false, onSince: null, countdownRemaining: null, faceCount: 0, manualOverride: 'forceOff' };
          }
          return r;
        }));
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [settings.nightModeEnabled, settings.nightModeStart, settings.nightModeEnd]);

  return (
    <GridSenseContext.Provider value={{
      rooms, settings, logs, holidayMode, selectedCameraRoom, cameraActive, modelLoaded, modelError,
      setSelectedCameraRoom, setCameraActive, setModelLoaded, setModelError,
      updateRoom, updateSettings, updateRoomName, updateRoomDevices,
      setManualOverride, emergencyCutoff, toggleHolidayMode, addLog, detectFaces, noFacesDetected,
    }}>
      {children}
    </GridSenseContext.Provider>
  );
}

export function useGridSense() {
  const ctx = useContext(GridSenseContext);
  if (!ctx) throw new Error('useGridSense must be used within GridSenseProvider');
  return ctx;
}
