import { motion } from 'framer-motion';
import { Lightbulb, Fan, Snowflake } from 'lucide-react';
import { Room } from '@/contexts/GridSenseContext';
import { useEffect, useState } from 'react';

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export default function RoomCard({ room }: { room: Room }) {
  const [ripple, setRipple] = useState(false);
  const [prevStatus, setPrevStatus] = useState(room.status);

  useEffect(() => {
    if (prevStatus !== 'on' && room.status === 'on') {
      setRipple(true);
      const t = setTimeout(() => setRipple(false), 500);
      return () => clearTimeout(t);
    }
    setPrevStatus(room.status);
  }, [room.status, prevStatus]);

  const glowClass = room.status === 'on' ? 'glow-green' : room.status === 'countdown' ? 'glow-amber' : '';
  const dimmed = room.status === 'off';

  return (
    <motion.div
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={room.status !== 'off' ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={`glass-panel rounded-xl p-5 relative overflow-hidden transition-all duration-300 ${glowClass} ${dimmed ? 'opacity-60' : ''} ${ripple ? 'heartbeat-ripple' : ''}`}
    >
      {/* Status dot */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-mono text-sm font-semibold text-foreground">{room.name}</h3>
        <div className={`status-dot ${room.status === 'on' ? 'status-dot-on' : room.status === 'countdown' ? 'status-dot-countdown' : 'status-dot-off'}`} />
      </div>

      {/* Status label */}
      <div className="mb-3">
        <motion.span
          key={room.status}
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            room.status === 'on' ? 'bg-gs-green/20 text-gs-green' :
            room.status === 'countdown' ? 'bg-gs-amber/20 text-gs-amber' :
            'bg-muted text-muted-foreground'
          }`}
        >
          {room.status === 'on' ? 'POWERED ON' :
           room.status === 'countdown' ? `OFF in ${room.countdownRemaining}s` :
           'POWERED OFF'}
        </motion.span>
      </div>

      {/* Device icons */}
      <div className="flex gap-3 mb-3">
        <div className={`transition-all duration-300 ${room.lights ? 'text-gs-amber drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]' : 'text-muted-foreground/30'}`}>
          <Lightbulb size={18} />
        </div>
        <div className={`transition-all duration-300 ${room.fan ? 'text-gs-blue drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]' : 'text-muted-foreground/30'}`}>
          <Fan size={18} className={room.fan ? 'animate-spin' : ''} style={room.fan ? { animationDuration: '2s' } : {}} />
        </div>
        <div className={`transition-all duration-300 ${room.ac ? 'text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]' : 'text-muted-foreground/30'}`}>
          <Snowflake size={18} />
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center justify-between text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
        <span className="font-mono-display">
          {room.status === 'on' && room.onSince ? `⏱ ${formatDuration(Date.now() - room.onSince)}` : '⏱ --'}
        </span>
        {room.faceCount > 0 && (
          <span className="font-mono-display text-gs-green">
            👤 {room.faceCount} face{room.faceCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Manual override indicator */}
      {room.manualOverride !== 'none' && (
        <div className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-gs-red/20 text-gs-red font-medium">
          {room.manualOverride === 'forceOn' ? 'FORCED ON' : 'FORCED OFF'}
        </div>
      )}
    </motion.div>
  );
}
