import { useGridSense } from '@/contexts/GridSenseContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function LogsPage() {
  const { rooms, logs, setManualOverride, emergencyCutoff, toggleHolidayMode, holidayMode } = useGridSense();
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);

  return (
    <div className="p-6 max-h-screen overflow-y-auto">
      <h1 className="text-2xl font-bold font-mono text-foreground mb-6">Admin Controls & Logs</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-6xl">
        {/* Manual Overrides */}
        <div className="glass-panel rounded-xl p-5 lg:col-span-2">
          <h3 className="font-mono text-sm font-semibold text-foreground mb-4">Manual Override</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {rooms.map(room => (
              <div key={room.id} className="bg-secondary/30 rounded-lg p-3 border border-border/30">
                <div className="text-xs font-mono text-foreground mb-2">{room.name}</div>
                <div className="flex gap-1">
                  {(['none', 'forceOn', 'forceOff'] as const).map(override => (
                    <button
                      key={override}
                      onClick={() => setManualOverride(room.id, override)}
                      className={`text-[10px] px-2 py-1 rounded-full transition-all duration-200 spring-transition ${
                        room.manualOverride === override
                          ? override === 'forceOn' ? 'bg-gs-green/20 text-gs-green border border-gs-green/30'
                          : override === 'forceOff' ? 'bg-gs-red/20 text-gs-red border border-gs-red/30'
                          : 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-secondary text-muted-foreground border border-transparent hover:border-border'
                      }`}
                    >
                      {override === 'none' ? 'Auto' : override === 'forceOn' ? 'Force ON' : 'Force OFF'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency & Holiday */}
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-5">
            <h3 className="font-mono text-sm font-semibold text-foreground mb-3">Emergency</h3>
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="btn-danger w-full"
            >
              🚨 Emergency Cutoff
            </button>
          </div>

          <div className="glass-panel rounded-xl p-5">
            <h3 className="font-mono text-sm font-semibold text-foreground mb-3">Holiday Mode</h3>
            <p className="text-xs text-muted-foreground mb-3">
              {holidayMode ? 'All rooms forced OFF, detection disabled' : 'Click to disable all detection'}
            </p>
            <button
              onClick={() => !holidayMode ? setShowHolidayModal(true) : toggleHolidayMode()}
              className={holidayMode ? 'btn-pill w-full' : 'btn-danger w-full'}
            >
              {holidayMode ? '🏖 Disable Holiday Mode' : '🏖 Enable Holiday Mode'}
            </button>
          </div>
        </div>

        {/* Action Log */}
        <div className="glass-panel rounded-xl p-5 lg:col-span-3">
          <h3 className="font-mono text-sm font-semibold text-foreground mb-4">📋 Action Log (Last 20)</h3>
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No events yet. Start the camera to begin detection.</p>
          ) : (
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {logs.slice(0, 20).map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.02 }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/20 text-xs"
                  >
                    <span className="text-muted-foreground font-mono w-16 flex-shrink-0">
                      {log.time.toLocaleTimeString()}
                    </span>
                    <span className="font-mono text-primary font-medium w-24 flex-shrink-0 truncate">{log.room}</span>
                    <span className="text-foreground font-medium w-32 flex-shrink-0">{log.action}</span>
                    <span className="text-muted-foreground truncate">{log.reason}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Modal */}
      <AnimatePresence>
        {showEmergencyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowEmergencyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="glass-panel glow-red rounded-2xl p-8 max-w-md mx-4"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="font-mono text-lg font-bold text-gs-red mb-2">⚠️ Emergency Cutoff</h2>
              <p className="text-sm text-muted-foreground mb-6">
                This will immediately turn OFF all rooms and override all settings. Are you sure?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowEmergencyModal(false)} className="btn-pill flex-1">Cancel</button>
                <button
                  onClick={() => { emergencyCutoff(); setShowEmergencyModal(false); }}
                  className="btn-danger flex-1"
                >
                  Confirm Cutoff
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Holiday Modal */}
      <AnimatePresence>
        {showHolidayModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowHolidayModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="glass-panel glow-amber rounded-2xl p-8 max-w-md mx-4"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="font-mono text-lg font-bold text-gs-amber mb-2">🏖 Holiday Mode</h2>
              <p className="text-sm text-muted-foreground mb-6">
                All rooms will be forced OFF and face detection will be disabled. Continue?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowHolidayModal(false)} className="btn-pill flex-1">Cancel</button>
                <button
                  onClick={() => { toggleHolidayMode(); setShowHolidayModal(false); }}
                  className="btn-danger flex-1"
                >
                  Enable Holiday Mode
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
