import { useGridSense } from '@/contexts/GridSenseContext';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { settings, updateSettings, rooms, updateRoomName, updateRoomDevices } = useGridSense();

  return (
    <div className="p-6 max-h-screen overflow-y-auto">
      <h1 className="text-2xl font-bold font-mono text-foreground mb-6">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">
        {/* Power OFF Delay */}
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel rounded-xl p-5">
          <h3 className="font-mono text-sm font-semibold text-foreground mb-3">⏱️ Power OFF Delay</h3>
          <p className="text-xs text-muted-foreground mb-3">Seconds before power shuts off when no face detected</p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={10}
              max={3600}
              step={5}
              value={settings.powerOffDelay}
              onChange={e => updateSettings({ powerOffDelay: Number(e.target.value) })}
              className="flex-1 accent-primary"
            />
            <span className="font-mono text-sm text-foreground w-16 text-right">{settings.powerOffDelay}s</span>
          </div>
        </motion.div>

        {/* Electricity Rate */}
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="glass-panel rounded-xl p-5">
          <h3 className="font-mono text-sm font-semibold text-foreground mb-3">💰 Electricity Rate</h3>
          <p className="text-xs text-muted-foreground mb-3">Rate per kWh in ₹ (Amaravati, AP default: ₹6)</p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">₹</span>
            <input
              type="number"
              min={1}
              max={20}
              value={settings.electricityRate}
              onChange={e => updateSettings({ electricityRate: Math.max(1, Math.min(20, Number(e.target.value))) })}
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-xs text-muted-foreground">/kWh</span>
          </div>
        </motion.div>

        {/* Detection Sensitivity */}
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-panel rounded-xl p-5">
          <h3 className="font-mono text-sm font-semibold text-foreground mb-3">🎯 Detection Sensitivity</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {settings.detectionSensitivity <= 30 ? 'Low — detects faces > 50% confidence' :
             settings.detectionSensitivity <= 70 ? 'Medium — detects faces > 70% confidence' :
             'High — detects faces > 85% confidence'}
          </p>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.detectionSensitivity}
            onChange={e => updateSettings({ detectionSensitivity: Number(e.target.value) })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Low</span><span>Medium</span><span>High</span>
          </div>
        </motion.div>

        {/* Night Mode */}
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="glass-panel rounded-xl p-5">
          <h3 className="font-mono text-sm font-semibold text-foreground mb-3">🌙 Auto Night Mode</h3>
          <p className="text-xs text-muted-foreground mb-3">Force all rooms OFF during set hours</p>
          <label className="flex items-center gap-3 mb-3 cursor-pointer">
            <div
              onClick={() => updateSettings({ nightModeEnabled: !settings.nightModeEnabled })}
              className={`w-10 h-5 rounded-full relative transition-all duration-200 cursor-pointer spring-transition ${
                settings.nightModeEnabled ? 'bg-primary' : 'bg-secondary'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-all duration-200 spring-transition ${
                settings.nightModeEnabled ? 'left-5' : 'left-0.5'
              }`} />
            </div>
            <span className="text-sm text-foreground">{settings.nightModeEnabled ? 'Enabled' : 'Disabled'}</span>
          </label>
          {settings.nightModeEnabled && (
            <div className="flex gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Start</label>
                <input
                  type="time"
                  value={settings.nightModeStart}
                  onChange={e => updateSettings({ nightModeStart: e.target.value })}
                  className="block bg-secondary border border-border rounded-lg px-2 py-1 text-sm text-foreground mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">End</label>
                <input
                  type="time"
                  value={settings.nightModeEnd}
                  onChange={e => updateSettings({ nightModeEnd: e.target.value })}
                  className="block bg-secondary border border-border rounded-lg px-2 py-1 text-sm text-foreground mt-1"
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Room Names & Devices */}
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl p-5 lg:col-span-2">
          <h3 className="font-mono text-sm font-semibold text-foreground mb-4">🏷️ Room Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map(room => {
              const devices = settings.roomDevices[room.id];
              return (
                <div key={room.id} className="bg-secondary/30 rounded-lg p-3 border border-border/30">
                  <input
                    type="text"
                    value={room.name}
                    maxLength={20}
                    onChange={e => updateRoomName(room.id, e.target.value)}
                    className="w-full bg-transparent border-b border-border/30 pb-1 mb-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary"
                  />
                  <div className="flex gap-4 text-xs">
                    {(['lights', 'fan', 'ac'] as const).map(device => (
                      <label key={device} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={devices[device]}
                          onChange={e => updateRoomDevices(room.id, { [device]: e.target.checked })}
                          className="accent-primary"
                        />
                        <span className="text-muted-foreground capitalize">{device === 'ac' ? 'AC' : device}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
